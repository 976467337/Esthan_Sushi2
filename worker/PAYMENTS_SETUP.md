# Ativar pagamento online (Pix + Cartão) via Mercado Pago

O site já está preparado para aceitar pagamento online embutido na página (Pix e cartão),
usando o Mercado Pago. O recurso fica **desligado por padrão** — o botão "Pagar agora"
só aparece depois que os 2 passos abaixo forem feitos. Até lá, o site continua funcionando
normalmente só com "Pagar na entrega".

## 1. Criar/confirmar a conta Mercado Pago

- Acesse https://www.mercadopago.com.br e crie (ou confirme) a conta do restaurante
  (pode ser pessoa física, mas o ideal é CNPJ do Esthan Sushi).
- Complete a verificação de identidade pedida pelo Mercado Pago (documento, etc.) —
  sem isso a conta não recebe pagamentos de verdade.

## 2. Gerar as credenciais

- Acesse o painel de desenvolvedores: https://www.mercadopago.com.br/developers/panel
- Crie uma aplicação (qualquer nome, ex: "Esthan Sushi Site").
- Em "Credenciais de produção", copie:
  - **Public Key** (pode ficar visível, não é segredo)
  - **Access Token** (esse é secreto — nunca deve aparecer em nenhum arquivo do repositório)
- Existem também "Credenciais de teste" na mesma tela — use elas primeiro pra testar
  sem mexer com dinheiro de verdade (ver seção de testes abaixo).

## 3. Colar a Public Key no código

Abra `src/app/payments.ts` e troque:

```ts
export const MP_PUBLIC_KEY = "";
```

pela chave copiada, por exemplo:

```ts
export const MP_PUBLIC_KEY = "APP_USR-xxxxxxxx-xxxxxx-xxxxxxxxxxxxxxxx-xxxxxxxx";
```

## 4. Configurar o Access Token como secret do Worker (nunca no código)

Dentro da pasta `worker/`, rode:

```
wrangler secret put MP_ACCESS_TOKEN
```

Cole o Access Token quando for pedido. Isso guarda o token direto na Cloudflare,
sem nunca passar pelo Git/GitHub.

## 5. Testar antes de ir pra produção

Repita os passos 3 e 4 usando as **credenciais de teste** do Mercado Pago primeiro.
Com elas, use os cartões de teste oficiais para simular aprovação/recusa:
https://www.mercadopago.com.br/developers/pt/docs/checkout-api/additional-content/your-integrations/test/cards

Para Pix, o ambiente de teste da Mercado Pago também gera um QR code que pode ser
"pago" simulando pelo próprio painel deles (não precisa de app de banco de verdade).

Só depois de validar com as credenciais de teste, troque pelas credenciais de produção
(passos 3 e 4 de novo, agora com os valores reais) e o botão "Pagar agora" passa a
processar pagamentos de verdade.

## 6. (Opcional, recomendado) Configurar o webhook

No painel da aplicação, em "Webhooks", configure a URL:

```
https://esthan-depoimentos.rieres.workers.dev/payment/webhook
```

Isso é um reforço — hoje a confirmação do pagamento no site já funciona por
consulta direta (polling), então o webhook não é obrigatório para o recurso
funcionar, mas ajuda a reconciliar pagamentos caso o cliente feche a aba antes
da confirmação aparecer.
