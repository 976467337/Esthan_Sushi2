# Ativar aviso automático no WhatsApp para novos depoimentos

O formulário de depoimentos do site já salva cada envio como "pendente" no Worker
e gera um link de aprovação de 1 toque. Falta só um passo pra esse aviso chegar
**automaticamente no WhatsApp `+5511946645976`** assim que alguém envia um
depoimento — sem o visitante precisar abrir ou enviar nada pelo WhatsApp dele.

Isso é feito com a [Green API](https://green-api.com), gratuita até um volume
generoso de mensagens/mês (mais que suficiente pros depoimentos de um restaurante).
Diferente de bots compartilhados, aqui você conecta um WhatsApp de verdade (o seu
próprio número pessoal, por exemplo) via QR Code — funciona como uma sessão de
WhatsApp Web, e esse número passa a ser o "remetente" automático dos avisos.

> Já tentamos antes um serviço mais simples (CallMeBot), mas o número dele estava
> fora do ar / instável na hora do teste — por isso migramos pra Green API.

## 1. Criar a conta gratuita

1. Acesse https://green-api.com e crie uma conta (e-mail ou Google).
2. No painel, uma instância "Developer" já é criada automaticamente pra você
   testar — é essa que vamos usar.

## 2. Conectar o WhatsApp remetente via QR Code

1. Na instância criada, abra a aba de QR Code.
2. No celular que vai *enviar* os avisos (pode ser o seu próprio WhatsApp pessoal),
   vá em **WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho**
   e escaneie o QR Code mostrado no painel da Green API.
3. Quando o status da instância mudar pra "autorizado"/"authorized", está pronto.

Esse WhatsApp precisa continuar com internet de vez em quando (como qualquer sessão
do WhatsApp Web) — se ficar muito tempo offline ou for desconectado manualmente,
os avisos param até reconectar (é só escanear o QR de novo).

## 3. Pegar as duas credenciais

No painel da instância, tem dois valores:
- **idInstance** (um número)
- **apiTokenInstance** (um token longo)

Copie os dois e me envie — eu configuro como secrets do Worker
(`GREENAPI_ID_INSTANCE` e `GREENAPI_API_TOKEN`), nunca aparecem no código nem no
GitHub.

## 4. Testar

Depois de configurado, envie um depoimento de teste pelo site. A mensagem deve
chegar no WhatsApp `+5511946645976` em poucos segundos, com o link de aprovação
de 1 toque.

Se as credenciais ainda não estiverem configuradas, o site continua funcionando
normalmente — o depoimento fica salvo como pendente, só sem o aviso automático.

## Trocar o número que recebe o aviso

O número de destino (`OWNER_PHONE`) está fixo no código, em
`worker/src/index.js`. Pra trocar, é só pedir — não precisa reconfigurar as
credenciais da Green API, só esse número muda.
