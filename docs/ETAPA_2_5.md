# Etapa 2.5 · Sessões e homologação

## Estado desta entrega

A CLI Supabase 2.75.0 executou `supabase start` neste Windows. A tentativa parou na inspeção de `supabase_db_autocrm`: o canal `//./pipe/docker_engine` não existia. Docker Desktop, serviço Docker ativo, API em 127.0.0.1:54321 e configuração de um projeto hospedado estavam ausentes. O teste ao vivo parou na consulta de saúde de Auth com ECONNREFUSED, antes de criar qualquer conta. As migrações 001 a 003 foram aplicadas no PostgreSQL embarcado da suíte. A pilha local com GoTrue, SMTP e PostgREST permanece pendente, assim como a homologação em aparelhos. Não foi necessária uma quarta migração.

## Executar a jornada com Supabase local

1. Instale as dependências com `npm ci` na raiz. Inicie o Docker Desktop com contêineres Linux e confirme que `docker info` mostra o servidor. Com a CLI 2.75.0 execute `supabase start`. Em uma instância nova, a CLI aplica as migrações e carrega os modelos locais de confirmação e recuperação. Para uma instância existente, aplique migrações pendentes com `supabase migration up --local` e reinicie a pilha para reler a configuração do Auth.
2. Copie os exemplos de ambiente da web e do mobile para `.env.local` em cada app. Obtenha a URL da API e a chave publicável com `supabase status`. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` na web e as equivalentes `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` no Expo. Em aparelho físico use um endereço alcançável na rede de desenvolvimento. `EXPO_PUBLIC_WEB_URL` define o endereço web dos convites.
3. Para rodar a suíte com o serviço local, exporte também as duas variáveis da web no **terminal** do teste. Use `http://127.0.0.1:54321` como URL. Execute `npm run build`, `npx playwright install chromium` e `npm run test:supabase`. O teste cria contas descartáveis e duas oficinas. Lê exclusivamente os códigos das suas próprias mensagens no Mailpit em 127.0.0.1:54324. O limite de e-mails da configuração local acomoda cadastro e recuperação durante o teste.
4. Para testar manualmente, execute `npm run web` e `npm run mobile`. Teste o splash e o SecureStore em builds nativos Android e iOS que incluam os novos módulos. A exportação de JavaScript não exercita o Keychain, o Keystore nem o ciclo de vida do dispositivo.

## Usar caixas postais reais em homologação

Em projeto Supabase dedicado, aplique as migrações 001, 002 e 003 em ordem. Ative Email, cadastro, confirmação de e-mail, senha mínima de dez caracteres e SMTP com remetente verificado. Configure a Site URL HTTPS. Em **Email Templates**, use `supabase/templates/confirmation.html` para Confirm signup e `supabase/templates/recovery.html` para Reset password. Ambos mostram o OTP com `{{ .Token }}`. No projeto local o OTP tem oito dígitos e expira em dez minutos. As credenciais SMTP ficam exclusivamente no Supabase.

- **Oficina.** Na área Oficina, cadastre e confirme o proprietário. Crie a oficina, recarregue o site e confira o painel. Cadastre um cliente, gere o convite de motorista e, em Gerenciar equipe, gere outro para um funcionário. Use três caixas postais diferentes.
- **Motorista.** Na área Motorista, crie a conta com o mesmo e-mail do contato, confirme o código e aceite o convite. Feche e reabra o app, selecione Motorista e confira a oficina vinculada. O convite e o OTP de autenticação são códigos diferentes.
- **Funcionário.** Aceite o convite na área Oficina, confira a função e tente abrir outra oficina. Revogue o acesso no painel do proprietário e atualize o painel do funcionário mantendo a sessão aberta. O vínculo deixou de existir mesmo que a conta permaneça autenticada.
- **Recuperação e saída.** Saia, selecione Esqueci minha senha, informe o e-mail, digite o OTP e salve a nova senha. Teste a entrada com a senha nova e a recusa da antiga. Após sair, recarregue a página ou reinicie o app e confira o retorno ao login.
- **Conexão e renovação.** Abra o portal, interrompa a rede, tente atualizar e depois reconecte. No app, alterne entre primeiro plano e segundo plano. Em homologação, repita atravessando o prazo de expiração do access token e, em um ensaio separado, encerre a sessão no servidor para conferir o retorno ao login após a próxima renovação.

## Implementação e alcance dos testes

O Next usa um cliente SSR por requisição. O proxy renova cookies e encaminha as alterações ao navegador e ao renderizador. As páginas da oficina e do motorista consultam claims verificados no servidor. Respostas personalizadas usam cache privado sem armazenamento. O SDK no navegador precisa ler os cookies para a renovação; eles usam SameSite=Lax e Secure em HTTPS. A autorização de dados continua nas RPCs e na RLS. [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

No mobile, a sessão fica no SecureStore com acesso no dispositivo desbloqueado no iOS. O adaptador divide valores grandes em partes e publica a nova versão depois de completar a gravação. O SDK usa um cliente por processo e renova em primeiro plano. O logout usa o escopo local da sessão atual. [Expo SecureStore](https://docs.expo.dev/versions/v54.0.0/sdk/securestore/)

A suíte de banco verifica RLS nas onze tabelas, privilégios, alterações diretas de terceiros, operações de proprietário, revogação e contatos vinculados em múltiplas oficinas. Os testes do SDK SSR simulam o transporte de autenticação para verificar o contrato de cookies. Os do adaptador nativo simulam o cofre para exercitar restauração, rotação, gravação interrompida e limpeza. Apenas a suíte `test:supabase` usa a API real, com os tokens das próprias contas de teste, para verificar inclusive as recusas de escrita pelo PostgREST. A disponibilidade do Docker é pré-requisito para executá-la nesta máquina.
