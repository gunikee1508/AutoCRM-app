# AutoCRM Connect — início do projeto

**Primeira entrega:** protótipo web interativo e telas nativas de prévia Android/iOS, especificação de produto, modelo relacional inicial com RLS e briefing de implementação para Codex.

Esta **não** é a aplicação comercial pronta. Não há login, API funcionando, envio de WhatsApp/e-mail, integração com loja de apps ou banco conectado. Use apenas dados fictícios no protótipo.

## Começar agora

**Ver o protótipo web:** abra `prototype/index.html` em Chrome/Edge, ou execute:

```bash
cd prototype
python -m http.server 8000
```

Acesse `http://localhost:8000`. Teste a alternância de Oficina/Motorista. Mudar status de uma OS para `Pronto para retirada` atualiza a área do motorista e registra uma comunicação **simulada**.

**Abrir telas móveis:** consulte `apps/mobile/README.md`. O código Expo Router incluído deve ser copiado para um projeto criado com a versão corrente do `create-expo-app`. Não foi compilado nesta sessão, porque não há acesso ao registro de pacotes npm.

**Implementação com Codex:** coloque este pacote em um repositório Git, abra-o no Codex e forneça o arquivo `docs/CODEX_START_HERE.md` como primeira tarefa. O Codex poderá completar o stack, testes e integrações dentro do seu ambiente de desenvolvimento.

## Estrutura

- `prototype/` — UX web navegável, com dados fictícios em `localStorage`.
- `apps/mobile/` — código React Native/Expo para prévia de dois papéis (sem backend).
- `supabase/migrations/001_core.sql` — migração inicial de domínio e RLS, a revisar/testar antes do uso.
- `docs/PRODUCT.md` — especificação de UX, jornadas, papéis, notificações e fases.
- `docs/CODEX_START_HERE.md` — instruções para Codex implementar o produto real.

## Arquitetura-alvo

- **Site público e portal web:** Next.js / TypeScript.
- **Android e iOS:** React Native / Expo Router.
- **Dados:** Supabase/PostgreSQL, RLS multi-tenant.
- **Comunicações:** API oficial WhatsApp Business + provedor de e-mail, com worker/filas e preferências LGPD.
- **Assinaturas:** provedor brasileiro de cobrança recorrente.

Antes de uso comercial, definir contas/credenciais, hospedagem, domínio e políticas de privacidade, revisar UX em dispositivos reais e validar permissões. "AutoCRM" é nome provisório, sujeito a disponibilidade de marca e domínio.
