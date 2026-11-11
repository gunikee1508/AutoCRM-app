# AutoCRM — contrato de produto v0.1

## Visão
SaaS B2B de pós-venda e acompanhamento de manutenção. A oficina paga. O motorista usa gratuitamente. Três superfícies de acesso: site público + portal web, app Android e app iOS. Duas áreas distintas em cada app.

## Papéis e autorização
- **Oficina:** owner, manager, mechanic, receptionist. Dados sempre particionados por workshop_id.
- **Motorista:** cliente autenticado que vê somente contatos, veículos e OS explicitamente vinculados ao seu usuário.
- Uma pessoa pode ser mecânico de uma oficina e cliente de outra, mas não terá um botão para trocar de papel sem autenticação/entitlement adequado.
- Não usar a placa ou um link adivinhável como prova de acesso ao histórico. Vincular atendimento via convite de curta duração e verificação de telefone/e-mail.

## Oficina: jornada prioritária
1. Onboarding: nome e endereço da oficina, horários, modo de WhatsApp (API oficial Business ou pessoal/manual), e-mail transacional.
2. Criar OS: cliente, telefone, e-mail, veículo, serviço, quilometragem, orçamento opcional, revisão futura opcional, consentimentos.
3. Alterar status: recebido → diagnóstico → manutenção → pronto → entregue.
4. Marcar **pronto para retirada**: atualiza status imediatamente e enfileira notificações autorizadas. Não bloqueia o botão aguardando APIs.
5. Visualizar notificações enviadas, falhas e pedidos de agendamento. Anexar fotos e orçamento quando houver.
6. Registrar retirada; futura revisão permanece agendada por data e/ou km, com revisão técnica e regras de opt-out.

## Motorista: jornada prioritária
1. Link de convite/verificação ou app instalado; entra e vê veículos vinculados.
2. Tela principal: status claro, progressão, contato, previsão de entrega (somente quando fornecida), orçamento/valor, fotos compartilhadas, endereço de retirada.
3. Aprovar orçamento ou pedir revisão; ações somente para o próprio atendimento e mediante autenticação.
4. Solicitar agendamento e receber confirmação; acompanhar histórico e revisões.
5. Gerenciar preferências de notificações e privacidade.

## Notificações
- WhatsApp Business automatizado SOMENTE com conexão à API oficial, autenticação do número, modelos aprovados quando necessários, opt-in adequado e tratamento de limites/custos.
- WhatsApp pessoal NÃO deve usar automação via WhatsApp Web; mensagem preparada e ação manual via link.
- E-mail transacional automático após confirmação do serviço, com domínio remetente validado, provedor e critérios de envio.
- Mensagens por serviço concluído só disparam na transição para 'ready'; registros de fila idempotentes e retentativas controladas.
- Separar mensagens relacionadas ao atendimento de campanhas comerciais/revisões, com consentimentos e direito de descadastro apropriados.
- Lembretes de revisão não inferem km futuro como certeza; prevalecem manual/fabricante e consentimentos.

## UX e design
- Marca de trabalho: AutoCRM Connect (sujeita a pesquisa de marca e domínio).
- Visual: premium, limpo e acessível; primário #101A2F, azul #3264EC, destaque #15BCA6; superfícies #F5F7FB.
- Oficina: dashboard responsivo, tarefas rápidas, botões visíveis, estados consistentes.
- Motorista: primeiro status e endereço, depois orçamento/fotos/histórico, sem sobrecarga de informação.
- WCAG: contraste, labels, foco visível, teclado, respostas de erro, tamanho de alvos de toque.

## Fases
- **F0 — Prévia UX:** protótipo estático web navegável + tela mobile React Native de demonstração, sem integrações (incluso neste pacote).
- **F1 — MVP real:** configurar Supabase, autenticação, convite do cliente, RLS testado, CRUD OS, atualização em tempo real.
- **F2 — Comunicações:** worker de notificações, e-mail real, integração WhatsApp Business API e modo pessoal, opt-out, auditoria.
- **F3 — Produto:** pagamentos, planos, contratos, fotos, orçamento/aprovação, agendamento, revisão futura, telemetria.
- **F4 — Lançamento:** testes Android/iOS, build e publicação, política de privacidade, LGPD, observabilidade e pilotos de oficinas.

## Decisões pendentes
Definir nome final e identidade jurídica, domínio, conta Apple/Google, provedor de e-mail/pagamentos, modelo de cobrança por mensagens, integração com WhatsApp Business e os primeiros usuários-piloto.
