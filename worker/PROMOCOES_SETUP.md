# Painel de Promoções (`/admin`)

O dono não precisa mais pedir pra alguém mexer no código pra trocar as promoções do
site. Existe um painel simples, protegido por senha, onde dá pra escolher quais
pratos entram em promoção e por qual preço — e salvar. O site público já mostra a
mudança na hora, pra qualquer visitante.

## Como acessar

- Direto pelo endereço: `https://SEU-DOMINIO/admin`
- Ou pelo rodapé do site: tem um linkzinho discreto "Painel do dono" (não aparece
  em destaque de propósito, pra não chamar atenção de clientes — mas está lá).

Vale salvar esse link nos favoritos do celular do dono, ou mandar fixado no WhatsApp,
pra não se perder.

## Como usar

1. Abrir `/admin` e digitar a senha (a senha combinada não fica escrita em nenhum
   arquivo do repositório — é um segredo só do Worker, veja abaixo como trocar).
2. A tela mostra todos os pratos do cardápio, com foto, agrupados por categoria.
   Tem um campo de busca no topo pra achar rápido.
3. Pra colocar um prato em promoção: liga a chavinha ao lado dele e digita o preço
   promocional que aparece embaixo do nome.
4. Pra tirar um prato da promoção: só desliga a chavinha de novo.
5. Depois de mexer no que precisar, aperta **"Salvar promoções"** lá embaixo.
   Pronto — o site já atualiza pra todo mundo que visitar a partir daí.

O celular fica "logado" depois da primeira vez que digita a senha certa (não precisa
redigitar toda vez) — só sai se apertar "Sair" no canto de cima.

## Trocar a senha

Dentro da pasta `worker/`, rode:

```
wrangler secret put ADMIN_PASSWORD
```

Cole a nova senha quando for pedido. Isso já sobrescreve a senha atual — quem estiver
logado num celular vai precisar entrar de novo com a senha nova.

## Como funciona por trás (se precisar debugar um dia)

- `GET /promotions` — o site público chama isso pra saber quais promoções mostrar.
  Sem autenticação (é público, é só leitura).
- `POST /admin/check` — o painel usa isso só pra validar a senha digitada, antes de
  liberar a edição.
- `POST /admin/promotions` — o painel usa isso pra salvar. Exige o header
  `X-Admin-Password` batendo com o secret `ADMIN_PASSWORD`.

Tudo fica guardado na mesma KV (`TESTIMONIALS`) que já existia pros depoimentos, só
numa chave diferente (`promotions_config`) — não precisou criar nada novo na Cloudflare.

Enquanto o dono nunca salvou nada pelo painel (KV vazia), o site mostra um pacote de
promoções padrão definido no código (`DEFAULT_PROMOCOES` em `src/app/menu-data.ts`).
Assim que ele salva pela primeira vez, isso passa a valer no lugar do padrão.
