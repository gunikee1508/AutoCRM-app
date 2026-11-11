# Etapa 2 · Contas, oficinas e vínculos

## Preparar uma homologação com contas reais

1. Crie ou selecione um projeto Supabase de **homologação**. No SQL Editor, aplique, em ordem, os arquivos de `supabase/migrations`. Se o banco já recebeu a fundação, aplique somente `003_onboarding.sql`. Aguarde o término da migração antes de trocar a versão dos aplicativos.
2. Em Authentication, habilite o provedor **Email**, o cadastro por novos usuários e **Confirm email**. Configure o tamanho mínimo de senha em 10 caracteres. Mantenha a confirmação habilitada durante todo o teste. A autorização usa o e-mail e o instante de confirmação de `auth.users`.
3. Configure a Site URL da web de homologação. Em **Email Templates → Confirm signup**, use o conteúdo de `supabase/templates/confirmation.html`. O modelo inclui `{{ .Token }}`. Configure o OTP com oito dígitos e validade de dez minutos. O usuário digita esse código na mesma área onde iniciou o cadastro. O código de e-mail e o convite de oficina têm finalidades e prazos independentes.
4. Para entrega em caixas postais reais, configure SMTP no Supabase Auth com remetente verificado. Os dados de SMTP ficam no servidor. Confira o limite de envio do projeto antes de testar vários cadastros. [Modelos de e-mail do Supabase](https://supabase.com/docs/guides/auth/auth-email-templates)
5. Copie os exemplos de ambiente de cada aplicativo para `.env.local` na mesma pasta. Preencha a **Project URL** e a **Publishable key** disponíveis no projeto. Não utilize chaves secretas ou `service_role` em campos públicos.

| Arquivo | Variáveis |
| --- | --- |
| `apps/web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `apps/mobile/.env.local` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `EXPO_PUBLIC_WEB_URL` |

`EXPO_PUBLIC_WEB_URL` é a origem HTTPS do site de homologação. O compartilhamento nativo gera links para essa origem. Sem ela, compartilha o código copiável. Reinicie o Next e o Metro após mudar essas variáveis. Para distribuição, gere novos bundles.

Na raiz, com Node 24 e npm 11, execute `npm ci`. Abra a web com `npm run web` e o Metro com `npm run mobile`. Use `npm run android` com emulador configurado, ou `npm run ios` no macOS com Xcode. Use um cliente compatível com Expo SDK 54. Em aparelho físico, a API deve ser alcançável pelo dispositivo.

## Roteiro com três caixas de e-mail

1. **Proprietário.** Abra Oficina, crie a conta, digite o código recebido e escolha **Cadastrar minha oficina**. Informe identidade comercial, endereço, contatos e horários. CNPJ, complemento e coordenadas são opcionais. Se preencher coordenadas, informe latitude e longitude juntas. Telefones incluem o código do país. O banco cria a oficina e o vínculo de proprietário em uma única transação.
2. **Imagens.** No painel, abra **Adicionar ou trocar imagens**. Selecione o logotipo e a foto. A web converte a seleção em JPEG e reduz a resolução. No app, use a biblioteca e o recorte. Cada JPEG aceito ocupa até 512 KiB e fica no banco com acesso privado. Uma falha de upload pode ser corrigida no painel sem repetir o cadastro.
3. **Funcionário.** Em **Gerenciar equipe**, informe um segundo e-mail e escolha a permissão. Copie ou compartilhe o convite em particular. O funcionário abre a área Oficina, cria e confirma sua própria conta e escolhe **Confirmar vínculo**. Confira o integrante no painel do proprietário e teste a alteração de função e a revogação.
4. **Motorista.** Em **Clientes e convites**, cadastre nome, telefone e um terceiro e-mail. Gere o convite para esse contato. Na conta do motorista, abra o link web ou cole o link/código em **Aceitar um convite** no app. Cadastre-se, confirme o e-mail correspondente e confirme o vínculo. Teste também sair e entrar por senha.
5. **Isolamento.** Tente aceitar o mesmo convite novamente e com outra conta confirmada. Ambos devem receber recusa. Uma segunda oficina pode convidar o mesmo motorista para outro contato próprio. Ao aceitar, o motorista passa a selecionar a oficina que quer consultar. Os veículos, ordens e agendamentos futuros são lidos dos registros de cada contato. Um cadastro novo apresenta listas vazias até haver atendimentos. A criação de veículos, ordens e agendamentos pela interface pertence à etapa operacional seguinte.

O compartilhamento dos convites é manual. Somente as mensagens de confirmação de identidade passam pelo Supabase Auth. As sessões desta versão ficam em memória e exigem novo login após recarregar a web ou reiniciar o app.

## Permissões e limites

| Perfil | Escopo |
| --- | --- |
| Proprietário | Painel, contatos, convites de clientes e equipe, imagens, alteração e revogação de funções na própria oficina. |
| Gerente | Consulta operacional, imagens, cadastro de clientes e gestão de convites de clientes na oficina vinculada. |
| Recepção | Consulta operacional, cadastro de clientes e emissão de convites. Pode revogar os convites de clientes que emitiu. |
| Mecânico | Consulta de veículos, ordens e agenda da equipe. |
| Motorista | Informações comerciais das oficinas vinculadas e dados de veículos e atendimentos dos seus próprios contatos. |

O servidor decide o papel pela associação no banco. As tabelas de convites, imagens e agenda têm RLS habilitada e privilégios diretos de aplicativo revogados. Cada RPC privilegiada valida identidade e escopo, usa referências qualificadas e restringe execução ao papel autenticado. O painel filtra o contato mesmo quando a pessoa é funcionária e motorista da mesma oficina.

O convite vincula oficina, destinatário, contato ou função e emissor. O banco armazena SHA-256 de um segredo aleatório e limita a emissão a 60 convites por oficina por hora. A aceitação confere o e-mail confirmado, a finalidade e as permissões do emissor, bloqueia a linha e consome o convite na mesma transação do vínculo. Reemitir para o mesmo contato ou funcionário invalida o convite anterior. Convites expiram em 48 horas. O token do link web chega no fragmento da URL e é removido da barra de endereços após a leitura.

## Testes

- `npm test` executa testes de domínio e das três migrações em PostgreSQL embarcado. O teste injeta o UUID e a situação de confirmação da identidade para exercer as permissões de banco.
- `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test:e2e` e `npm run build:mobile` cobrem análise estática, navegação web, demonstração e empacotamento Hermes. Para o navegador, execute antes `npx playwright install chromium` ou use Chrome instalado com `CHROME_CHANNEL=chrome`.
- `npm run test:supabase` executa uma jornada Playwright com **Supabase Auth, PostgREST e Mailpit locais**. Com Docker ativo e Supabase CLI v2, execute `supabase start` na raiz. Exporte para o terminal `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` com a chave pública local de `supabase status`. Execute `npm run build` nesse mesmo terminal e depois `npm run test:supabase`. Use a pilha local descartável. O teste cria duas contas e uma oficina, recebe OTPs em Mailpit e percorre login, cadastro e aceitação. Não envia mensagens a caixas externas. [Teste de e-mails no Supabase local](https://supabase.com/docs/guides/local-development/cli/testing-and-linting)
- O workflow de GitHub Actions prepara o serviço local e executa essa jornada. A execução em CI depende de um repositório remoto com Actions habilitado.

Nesta máquina Windows, Docker, projeto Supabase configurado e serviço Auth local estavam indisponíveis. A execução ponta a ponta com Auth/PostgREST, a entrega SMTP em caixas reais e a execução dos apps em aparelhos são pendências de homologação. A exportação Hermes não gera APK, AAB ou IPA assinado.
