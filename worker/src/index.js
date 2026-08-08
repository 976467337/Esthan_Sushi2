const ALLOWED_ORIGINS = [
  'https://esthansushi.com.br',
  'https://www.esthansushi.com.br',
  'http://localhost:5173',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
  };
}

function htmlPage(title, message) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body{
    font-family: 'Segoe UI', sans-serif; background:#0a0806; color:#f5f0e8;
    display:flex; align-items:center; justify-content:center; min-height:100vh;
    margin:0; text-align:center; padding: 24px;
  }
  .card{ max-width: 420px; border:1px solid rgba(212,144,15,0.3); border-radius: 8px; padding: 32px; background:#17110c; }
  h1{ font-size: 1.3rem; line-height:1.4; }
</style>
</head>
<body><div class="card"><h1>${message}</h1></div></body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function clip(str, max) {
  return String(str || '').slice(0, max);
}

function json(cors, body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

// restaurante: R. Marina Lemos de Abreu, 68 - Jardim Centenário, São Paulo - SP, 02882-020
// coordenadas aproximadas: o OpenStreetMap não tem o número exato indexado nessa rua,
// então usamos o ponto conhecido mais próximo da própria rua (confirmado via ViaCEP)
const RESTAURANT_ORIGIN = { lat: -23.4737, lon: -46.6695 };
const PREP_MINUTES = 20;

// WhatsApp que recebe a notificação de novo depoimento — número separado do que
// recebe os pedidos dos clientes. Não é segredo — só as credenciais da Green API
// (GREENAPI_ID_INSTANCE / GREENAPI_API_TOKEN, wrangler secret) são.
const OWNER_PHONE = '5511946645976';

// Avisa o dono no WhatsApp via Green API (mensagem enviada pelo WhatsApp conectado
// via QR Code no painel da Green API) assim que um depoimento é enviado.
// Best-effort: se as credenciais não estiverem configuradas ou a Green API falhar,
// o depoimento continua salvo como pendente (o dono só não recebe o aviso automático).
async function notifyOwnerWhatsApp(env, record, approveUrl) {
  if (!env.GREENAPI_ID_INSTANCE || !env.GREENAPI_API_TOKEN) return;

  const text = `Novo depoimento para aprovação no site:\nNome: ${record.nome}\nItem pedido: ${record.item || '-'}\nAvaliação: ${record.stars} (${record.nota}/5)\nDepoimento: ${record.texto}\n\n✅ Aprovar e publicar: ${approveUrl}`;
  const url = `https://api.green-api.com/waInstance${env.GREENAPI_ID_INSTANCE}/sendMessage/${env.GREENAPI_API_TOKEN}`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: `${OWNER_PHONE}@c.us`, message: text }),
    });
  } catch {
    // Green API fora do ar — sem retry aqui, o depoimento já está salvo como pendente
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // Visitor submits a testimonial -> stored as pending, returns an approval link
    if (url.pathname === '/submit' && request.method === 'POST') {
      // CF-Connecting-IP vem do edge da Cloudflare (conexão TCP real), não é um header
      // que o cliente consegue forjar como faria com X-Forwarded-For.
      const ip = request.headers.get('CF-Connecting-IP') || '';
      if (ip) {
        const alreadySent = await env.TESTIMONIALS.get(`ip:${ip}`);
        if (alreadySent) {
          return json(cors, { error: 'already_submitted' }, 429);
        }
      }

      let body;
      try {
        body = await request.json();
      } catch (err) {
        return new Response(JSON.stringify({ error: 'invalid_json' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const nome = clip(body.nome, 80).trim();
      const item = clip(body.item, 80).trim();
      const nota = Math.min(5, Math.max(1, Number(body.nota) || 5));
      const texto = clip(body.texto, 600).trim();

      if (!nome || !texto) {
        return new Response(JSON.stringify({ error: 'missing_fields' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      const stars = '★'.repeat(nota) + '☆'.repeat(5 - nota);
      const id = crypto.randomUUID();
      const record = { id, nome, item, nota, stars, texto, createdAt: Date.now() };

      await env.TESTIMONIALS.put(`pending:${id}`, JSON.stringify(record), {
        expirationTtl: 60 * 60 * 24 * 30, // pending links expire after 30 days if never approved
      });

      // Trava o IP para não permitir um novo envio (mesmo antes da aprovação do dono).
      if (ip) {
        await env.TESTIMONIALS.put(`ip:${ip}`, id);
      }

      const approveUrl = `${url.origin}/approve?id=${id}`;

      // Não bloqueia a resposta ao visitante esperando o CallMeBot responder.
      ctx.waitUntil(notifyOwnerWhatsApp(env, record, approveUrl));

      return new Response(JSON.stringify({ id, approveUrl }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    // Owner taps the link from WhatsApp -> publishes the testimonial
    if (url.pathname === '/approve' && request.method === 'GET') {
      const id = url.searchParams.get('id') || '';
      const raw = await env.TESTIMONIALS.get(`pending:${id}`);

      if (!raw) {
        return new Response(htmlPage('Link inválido', 'Este link já foi usado, expirou ou é inválido.'), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      const record = JSON.parse(raw);
      const approvedRaw = await env.TESTIMONIALS.get('approved');
      const approved = approvedRaw ? JSON.parse(approvedRaw) : [];
      approved.unshift(record);
      await env.TESTIMONIALS.put('approved', JSON.stringify(approved));
      await env.TESTIMONIALS.delete(`pending:${id}`);

      return new Response(
        htmlPage('Depoimento aprovado', `Depoimento de ${escapeHtml(record.nome)} aprovado e publicado no site! ✅`),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Site fetches this on page load to render approved testimonials
    if (url.pathname === '/approved' && request.method === 'GET') {
      const approvedRaw = await env.TESTIMONIALS.get('approved');
      const approved = approvedRaw ? JSON.parse(approvedRaw) : [];
      return new Response(JSON.stringify(approved), {
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' },
      });
    }

    // Site público consulta isso pra saber quais pratos estão em promoção agora e por qual
    // preço — o dono edita essa lista pelo painel /admin do site, sem mexer em código.
    if (url.pathname === '/promotions' && request.method === 'GET') {
      const raw = await env.TESTIMONIALS.get('promotions_config');
      // null explícito quando o dono nunca salvou nada (chave nem existe na KV) — diferente
      // de '{}' quando ele já salvou e escolheu de propósito não ter nenhuma promoção ativa.
      // O site usa essa diferença pra saber se cai no pacote padrão ou respeita a escolha dele.
      return json(cors, raw ? JSON.parse(raw) : null);
    }

    // Painel /admin testa a senha antes de liberar a edição (não salva nada aqui).
    if (url.pathname === '/admin/check' && request.method === 'POST') {
      if (!env.ADMIN_PASSWORD) return json(cors, { error: 'admin_not_configured' }, 503);

      let body;
      try { body = await request.json(); } catch { return json(cors, { error: 'invalid_json' }, 400); }

      if (body.password !== env.ADMIN_PASSWORD) return json(cors, { error: 'wrong_password' }, 401);
      return json(cors, { ok: true });
    }

    // Painel /admin salva aqui quais pratos estão em promoção e por qual preço.
    // body esperado: { "Nome exato do prato": { active: true, price: "R$ 25,90" }, ... }
    if (url.pathname === '/admin/promotions' && request.method === 'POST') {
      if (!env.ADMIN_PASSWORD) return json(cors, { error: 'admin_not_configured' }, 503);
      if (request.headers.get('X-Admin-Password') !== env.ADMIN_PASSWORD) {
        return json(cors, { error: 'wrong_password' }, 401);
      }

      let body;
      try { body = await request.json(); } catch { return json(cors, { error: 'invalid_json' }, 400); }
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return json(cors, { error: 'invalid_body' }, 400);
      }

      const clean = {};
      for (const [name, entry] of Object.entries(body).slice(0, 200)) {
        const cleanName = clip(name, 80).trim();
        if (!cleanName || !entry?.active) continue;
        clean[cleanName] = { active: true, price: clip(entry.price, 20).trim() };
      }

      await env.TESTIMONIALS.put('promotions_config', JSON.stringify(clean));
      return json(cors, { ok: true, count: Object.keys(clean).length });
    }

    // Cliente escolheu "pagar agora" no site -> o Payment Brick do Mercado Pago manda o formData
    // pra cá, a gente completa com nossos dados (descrição, referência do pedido, webhook) e chama
    // a API da Mercado Pago com o Access Token secreto (nunca exposto no navegador).
    if (url.pathname === '/payment/process' && request.method === 'POST') {
      if (!env.MP_ACCESS_TOKEN) {
        return json(cors, { error: 'payment_not_configured' }, 503);
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return json(cors, { error: 'invalid_json' }, 400);
      }

      const mpResp = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          ...body,
          description: clip(body.description, 200) || 'Pedido Esthan Sushi',
          external_reference: clip(body.external_reference, 100),
          notification_url: `${url.origin}/payment/webhook`,
        }),
      });

      const data = await mpResp.json();
      if (!mpResp.ok) {
        return json(cors, { error: 'mp_error', detail: data }, mpResp.status);
      }

      const txData = data.point_of_interaction?.transaction_data;
      return json(cors, {
        id: data.id,
        status: data.status,
        status_detail: data.status_detail,
        qrCode: txData?.qr_code,
        qrCodeBase64: txData?.qr_code_base64,
      });
    }

    // Polling do front-end enquanto um Pix está pendente (aguardando o cliente escanear/pagar)
    if (url.pathname === '/payment/status' && request.method === 'GET') {
      if (!env.MP_ACCESS_TOKEN) {
        return json(cors, { error: 'payment_not_configured' }, 503);
      }

      const id = clip(url.searchParams.get('id'), 60);
      if (!id) return json(cors, { error: 'missing_id' }, 400);

      const mpResp = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
      });
      const data = await mpResp.json();
      if (!mpResp.ok) return json(cors, { error: 'mp_error', detail: data }, mpResp.status);

      return json(cors, { status: data.status, status_detail: data.status_detail });
    }

    // Webhook de notificação da Mercado Pago (opcional — configurar a URL no painel deles depois
    // que a conta estiver pronta). Por enquanto só confirma recebimento; a confirmação real do
    // pagamento no site acontece por polling em /payment/status.
    if (url.pathname === '/payment/webhook' && request.method === 'POST') {
      return new Response('ok', { status: 200 });
    }

    // Valida o endereço digitado pelo cliente (proxy pro Nominatim/OSM — sem CORS liberado pra chamar direto do navegador).
    // Muita rua de bairro periférico não está indexada com número exato (às vezes nem a rua
    // existe no OSM) — em vez de simplesmente falhar, tenta de novo com menos detalhe
    // (sem número, depois só bairro+cidade), sempre conferindo se o resultado bateu mesmo
    // na cidade/UF pedida (evita cair num bairro de mesmo nome em outra cidade).
    if (url.pathname === '/geocode' && request.method === 'GET') {
      const street = clip(url.searchParams.get('street'), 120).trim();
      const number = clip(url.searchParams.get('number'), 20).trim();
      const neighborhood = clip(url.searchParams.get('neighborhood'), 80).trim();
      const city = clip(url.searchParams.get('city'), 80).trim() || 'São Paulo';
      const state = clip(url.searchParams.get('state'), 5).trim() || 'SP';

      const attempts = [];
      if (street) attempts.push({ q: [street, number, neighborhood, city, state, 'Brasil'].filter(Boolean).join(', '), precision: 'exact' });
      if (street) attempts.push({ q: [street, neighborhood, city, state, 'Brasil'].filter(Boolean).join(', '), precision: 'approximate' });
      if (neighborhood) attempts.push({ q: [neighborhood, city, state, 'Brasil'].filter(Boolean).join(', '), precision: 'approximate' });

      for (const attempt of attempts) {
        const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&countrycodes=br&q=${encodeURIComponent(attempt.q)}`;
        const resp = await fetch(nomUrl, { headers: { 'User-Agent': 'EsthanSushiSite/1.0 (contato via esthansushi.com.br)' } });
        const results = await resp.json().catch(() => []);
        if (!results.length) continue;

        const result = results[0];
        const addr = result.address || {};
        const resultCity = (addr.city || addr.town || addr.municipality || addr.suburb || '').toLowerCase();
        const resultState = (addr.state_code || addr.state || '').toLowerCase();
        const cityMatches = resultCity.includes(city.toLowerCase()) || city.toLowerCase().includes(resultCity);
        const stateMatches = !resultState || resultState.includes(state.toLowerCase()) || resultState.includes('são paulo') || resultState.includes('sao paulo');
        if (!cityMatches || !stateMatches) continue;

        return json(cors, {
          found: true,
          lat: Number(result.lat),
          lon: Number(result.lon),
          displayName: result.display_name,
          precision: attempt.precision,
        });
      }

      // Só OpenStreetMap (gratuito, sem chave/cadastro de terceiro) — se nenhuma das
      // tentativas achou o endereço, o site trata como "distância não confirmada" e
      // pede confirmação manual em vez de arriscar cobrar frete errado (ver CartDrawer).
      return json(cors, { found: false });
    }

    // Calcula tempo estimado de entrega: rota de carro/moto até o endereço + tempo de preparo
    if (url.pathname === '/eta' && request.method === 'GET') {
      const lat = Number(url.searchParams.get('lat'));
      const lon = Number(url.searchParams.get('lon'));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json(cors, { error: 'invalid_coords' }, 400);

      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${RESTAURANT_ORIGIN.lon},${RESTAURANT_ORIGIN.lat};${lon},${lat}?overview=false`;
      const resp = await fetch(routeUrl);
      const data = await resp.json();

      if (data.code === 'Ok' && data.routes?.length) {
        const travelMinutes = Math.max(1, Math.ceil(data.routes[0].duration / 60));
        const distanceKm = Math.round((data.routes[0].distance / 1000) * 10) / 10;
        return json(cors, { travelMinutes, prepMinutes: PREP_MINUTES, totalMinutes: travelMinutes + PREP_MINUTES, distanceKm });
      }

      // OSRM (gratuito) não conseguiu traçar rota — o site trata como "distância não
      // confirmada" (mesmo tratamento de quando o /geocode não acha o endereço).
      return json(cors, { error: 'no_route' }, 502);
    }

    return new Response('Not found', { status: 404 });
  },
};
