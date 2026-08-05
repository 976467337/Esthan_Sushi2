# Ativar aviso automático no WhatsApp para novos depoimentos

O formulário de depoimentos do site já salva cada envio como "pendente" no Worker
e gera um link de aprovação de 1 toque. Falta só um passo pra esse aviso chegar
**automaticamente no seu WhatsApp** assim que alguém envia um depoimento — sem o
visitante precisar abrir ou enviar nada pelo WhatsApp dele.

Isso é feito com o [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/),
um serviço gratuito que manda mensagens de WhatsApp via API para um número que você mesmo
autoriza (o seu). Sem custo, mas não é oficial da Meta — é o jeito mais rápido de começar.
Se um dia o volume de depoimentos crescer muito ou o serviço ficar instável, dá pra trocar
depois por uma API oficial sem mudar a estrutura (só a função `notifyOwnerWhatsApp` no Worker).

## 1. Autorizar o CallMeBot no seu WhatsApp (feito uma única vez)

1. No celular que recebe os pedidos (o número `5511994597259`, já usado no site),
   salve nos contatos: **+34 644 51 79 41**
2. Pelo WhatsApp, mande para esse contato exatamente esta mensagem:
   ```
   I allow callmebot to send me messages
   ```
3. Em alguns segundos o bot responde com sua **API Key** (um número, ex: `123456`).
   Guarde essa chave — é ela que vai para o passo 2.

## 2. Configurar a API Key como secret do Worker (nunca no código)

Dentro da pasta `worker/`, rode:

```
wrangler secret put CALLMEBOT_APIKEY
```

Cole a API Key recebida do CallMeBot quando for pedido. Fica guardada direto na
Cloudflare, sem passar pelo Git/GitHub.

## 3. Testar

Depois de configurar o secret e publicar o Worker (`wrangler deploy`), envie um
depoimento de teste pelo site. A mensagem deve chegar no seu WhatsApp em poucos
segundos, já com o link de aprovação de 1 toque.

Se o secret ainda não estiver configurado, o site continua funcionando normalmente —
o depoimento fica salvo como pendente, só sem o aviso automático (você pode checar
manualmente pela Cloudflare enquanto isso).

## Limites do CallMeBot (plano gratuito)

- Pensado para uso pessoal/baixo volume — não é a API oficial do WhatsApp.
- Pode haver limite de mensagens por dia e o serviço eventualmente ficar instável
  ou exigir reautorização.
- Se isso virar um problema no dia a dia do restaurante, o caminho de evolução é
  migrar para UltraMsg/Green API (mais robusto, pago) ou o WhatsApp Cloud API oficial
  da Meta — mudando só a função `notifyOwnerWhatsApp` em `worker/src/index.js`.
