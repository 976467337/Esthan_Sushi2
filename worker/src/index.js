const ALLOWED_ORIGINS = [
  'https://esthan-sushi.com.br',
  'https://www.esthan-sushi.com.br',
  'http://localhost:5173',
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
const PREP_MINUTES = 15;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // Visitor submits a testimonial -> stored as pending, returns an approval link
    if (url.pathname === '/submit' && request.method === 'POST') {
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

      const approveUrl = `${url.origin}/approve?id=${id}`;
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

    // Valida o endereço digitado pelo cliente (proxy pro Nominatim/OSM — sem CORS liberado pra chamar direto do navegador)
    if (url.pathname === '/geocode' && request.method === 'GET') {
      const address = clip(url.searchParams.get('address'), 200).trim();
      if (!address) return json(cors, { error: 'missing_address' }, 400);

      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(address)}`;
      const resp = await fetch(nomUrl, { headers: { 'User-Agent': 'EsthanSushiSite/1.0 (contato via esthan-sushi.com.br)' } });
      const results = await resp.json();

      if (!results.length) return json(cors, { found: false });
      const { lat, lon, display_name } = results[0];
      return json(cors, { found: true, lat: Number(lat), lon: Number(lon), displayName: display_name });
    }

    // Calcula tempo estimado de entrega: rota de carro/moto até o endereço + tempo de preparo
    if (url.pathname === '/eta' && request.method === 'GET') {
      const lat = Number(url.searchParams.get('lat'));
      const lon = Number(url.searchParams.get('lon'));
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return json(cors, { error: 'invalid_coords' }, 400);

      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${RESTAURANT_ORIGIN.lon},${RESTAURANT_ORIGIN.lat};${lon},${lat}?overview=false`;
      const resp = await fetch(routeUrl);
      const data = await resp.json();

      if (data.code !== 'Ok' || !data.routes?.length) return json(cors, { error: 'no_route' }, 502);
      const travelMinutes = Math.max(1, Math.ceil(data.routes[0].duration / 60));
      return json(cors, { travelMinutes, prepMinutes: PREP_MINUTES, totalMinutes: travelMinutes + PREP_MINUTES });
    }

    return new Response('Not found', { status: 404 });
  },
};
