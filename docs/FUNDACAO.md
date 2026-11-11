# Auditoria da fundação

| Área | Ponto de partida | Entrega desta etapa |
| --- | --- | --- |
| Web | Landing Next e demo HTML/JS duplicada em public. O protótipo simula cadastro, atualização de status e aviso de retirada em localStorage. | Landing responsiva com entradas próprias, formulários e listagem de atendimentos em React. A demo mantém seu fluxo separado. |
| Android e iOS | Uma tela Expo com alternador de papel, dados em memória e alertas simulados. Faltavam manifesto npm e configuração TypeScript. | Workspace Expo executável, navegação por rota e conta nos portais. A prévia original continua acessível na demonstração. |
| Dados | A migração inicial habilitava RLS, mas concedia mutações amplas e permitia que a OS referenciasse o veículo de outro contato da mesma oficina. | Migração incremental com permissões por coluna, acesso mínimo para leitura e integridade composta entre OS, veículo, contato, eventos e fila. |
| Comunicação | Trigger de retirada criava jobs. O de e-mail só verificava endereço e ausência de opt-out. | A fila de retirada exige autorização de serviço também para e-mail. O modo pessoal não cria job de WhatsApp. O banco não contata provedores. |
| Ferramentas | Pastas independentes, sem dependências travadas ou repositório Git inicializado. Teste Python específico da demo e de um Chromium Linux. | Workspaces com lockfile, comandos na raiz e testes reproduzíveis de SQL e navegador. Histórico local separa o protótipo da implementação. |

## Limites das verificações

Os testes SQL aplicam as duas migrações em PGlite com pgcrypto. O teste substitui a tabela mínima de usuários e a leitura do UUID do JWT. Ele exerce os privilégios SQL e a RLS com duas oficinas, três clientes, duas contas de equipe e uma sessão anônima. Verifica também a rejeição de uma OS associada ao veículo errado, o opt-in para e-mail e a ausência de job de WhatsApp pessoal.

O Playwright navega pelas duas áreas no site compilado e muda o status de uma OS na demonstração, conferindo a visão do motorista em duas larguras. A exportação Hermes verifica empacotamento para as duas plataformas. A integração completa entre Auth, PostgREST e os aplicativos ainda requer homologação com uma instância Supabase e dispositivos reais.

## Próxima implementação

Entregar uma jornada de onboarding com cadastro autenticado do proprietário, criação atômica da oficina e da primeira associação, convite de motorista com expiração e verificação de identidade. Testar reutilização de convite, revogação, conta sem vínculo e uma pessoa com papéis em oficinas diferentes. Em seguida habilitar criação de OS e transições de status autorizadas com auditoria e atualização em tempo real.

Orçamentos e aprovação, fotos privadas, agendamentos, lembretes recorrentes, preferências por canal, envio por e-mail e integração oficial do WhatsApp Business pertencem às próximas etapas. No modo pessoal o envio continuará dependendo da ação humana. Antes de lançamento ainda serão necessárias revisão de segurança, validação de privacidade, testes em aparelhos e builds assinados.

## Resultado local desta entrega

Com Node 24 e npm 11 no Windows, a instalação limpa pelo lockfile, ESLint, TypeScript nos dois apps e build de produção do Next.js passaram. O executor Node registrou 10 testes/subtestes aprovados. Os dois cenários Playwright passaram no Chrome instalado, a 390 e 1440 px. O Expo gerou bundles Hermes de Android e iOS. A telemetria do Expo foi desativada para executar em ambiente restrito. A instalação reportou dependências obsoletas na árvore, a revisar na atualização de SDK e ferramentas. O workflow de CI foi preparado para repetir as verificações no GitHub.

Permanecem pendentes execução com Supabase Auth/PostgREST reais, testes em aparelho ou simulador, builds APK/AAB/IPA e auditoria de segurança para produção.
