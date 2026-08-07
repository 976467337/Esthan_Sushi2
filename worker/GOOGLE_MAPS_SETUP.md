# Ativar Google Maps como reforço do cálculo de entrega

O site já está preparado pra usar o Google Maps como reforço sempre que o
OpenStreetMap (o serviço gratuito que já usamos) não encontrar um endereço —
o que é comum em bairros periféricos de São Paulo. Enquanto a chave não for
configurada, o site continua funcionando exatamente como hoje (só com
OpenStreetMap).

## 1. Criar/confirmar um projeto no Google Cloud

- Acesse https://console.cloud.google.com/ e crie um projeto novo (qualquer
  nome, ex: "Esthan Sushi").
- **Ativar faturamento** (Billing): o Google exige cartão cadastrado pra
  liberar essas APIs, mas dá **US$200 de crédito grátis por mês** — pra um
  restaurante pequeno, isso cobre dezenas de milhares de consultas, muito
  acima do que o site vai usar. É bem difícil isso gerar cobrança de verdade.

## 2. Ativar as APIs necessárias

No menu "APIs e Serviços" → "Biblioteca", ative estas duas:

- **Geocoding API** (transforma endereço em coordenadas)
- **Distance Matrix API** (calcula tempo/distância de rota)

## 3. Gerar a chave de API

- Em "APIs e Serviços" → "Credenciais" → "Criar credenciais" → "Chave de API".
- Recomendado: clique na chave criada e em "Restrições de API", marque só
  as duas APIs acima (Geocoding + Distance Matrix) — assim, mesmo que a
  chave vaze, não dá pra usar pra mais nada.
- **Não é possível restringir por site/IP** nesse caso porque quem chama a
  API é o Worker (servidor), não o navegador do cliente — mas isso não é um
  problema de segurança, porque a chave nunca é exposta no site, fica só no
  Worker (mesmo esquema do Mercado Pago, ver `PAYMENTS_SETUP.md`).

## 4. Me passar a chave

Me manda a chave gerada (algo como `AIzaSy...`) que eu configuro como secret
no Worker via `wrangler secret put GOOGLE_MAPS_API_KEY` — nunca fica
salva no código nem no GitHub.

## 5. Testar

Depois de configurada, eu testo com os endereços que já sabemos que falhavam
no OpenStreetMap (ex: Rua Carlos Marighella, Jardim Elisa Maria) pra
confirmar que o Google Maps encontra certinho.
