# Instruções iniciais para Codex

Você é o engenheiro principal do produto AutoCRM (SaaS para oficinas mecânicas). Leia `docs/PRODUCT.md`, `supabase/migrations/001_core.sql` e `prototype/README.md` antes de editar.

## Tarefa 1 — transformar protótipo em produto real
1. Criar monorepo TypeScript com `apps/web` (Next.js App Router) e `apps/mobile` (Expo Router) e pacote compartilhado de tipos/validação.
2. Transformar o protótipo web em componentes React acessíveis; manter design, responsividade e UX, mas NÃO usar localStorage como banco de produção.
3. Implementar Supabase Auth, cadastro de oficina e convite/verificação de cliente. O menu de troca de papel é exclusivo do modo demonstração, e não pode ser rota de acesso a dados reais.
4. Revisar/testar as políticas RLS de `001_core.sql`; implementar testes que provem isolamento entre duas oficinas, dois clientes, e acesso somente de perfis autenticados.
5. CRUD de clientes, veículos, OS e status, com atualizações em tempo real entre web e apps. Expor aprovações de orçamento por endpoint autenticado específico.
6. Implementar uma fila assíncrona para enviar e-mail e, opcionalmente, WhatsApp Business pela API oficial. Nunca armazenar tokens da Meta no dispositivo ou no cliente web.
7. WhatsApp pessoal: usar link wa.me com mensagem pré-preenchida e clique humano para enviar. Não fazer automação não oficial.
8. Documentar env/config sem inserir segredos no repositório. Fazer CI, lint, typecheck, testes de unidade e testes E2E.
9. Não prometer publicação na loja nem integração externa sem credenciais, autorização e testes.

## Critérios de aceite do primeiro marco
- Um dono de oficina consegue criar oficina e atendimento no web e no mobile.
- Um funcionário pode marcar status `ready`; o cliente autenticado vinculado vê alteração nas duas plataformas.
- Dados de uma oficina e cliente são inacessíveis para terceiros (teste automatizado).
- A fila de eventos gera avisos idempotentes; há simulação segura caso as integrações não estejam configuradas.
- UI responde corretamente em smartphone e desktop, sem uso de dados reais em demo.

## Observações de segurança
Usar política de privilégio mínimo, validação de entrada, proteção CSRF onde aplicável, audit logs, criptografia em trânsito, rate limiting para convites, proteção de anexos, revogação de acessos e atenção à LGPD. Não tratar upload de fotos nem aprovação financeira como operações sem autenticação. Revisar regras para PII e mensagens antes da implantação.
