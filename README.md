# AutoCRM Connect

Fundação do SaaS de atendimento automotivo. O monorepo utiliza npm workspaces, Next.js, Expo Router e Supabase. A oficina e o motorista têm entradas próprias na web e nos aplicativos. A demonstração permanece disponível com dados fictícios.

## Executar

Use Node.js 24 e npm 11. Abra o terminal na pasta que contém este README e o arquivo `package-lock.json`. Instale todas as dependências uma vez:

```sh
npm ci
```

| Plataforma | Comando na raiz | Como acessar |
| --- | --- | --- |
| Web | `npm run web` | Abra `http://localhost:3000`. Use as entradas Oficina ou Motorista, ou o link da demonstração. |
| Android | `npm run android` | Inicie um emulador Android com o SDK configurado ou conecte um dispositivo. Utilize um cliente Expo compatível com o SDK 54. |
| iOS | `npm run ios` | Em macOS com Xcode e o Simulator instalados, inicie um simulador compatível. |
| Aparelho na rede local | `npm run mobile` | Abra o QR com um cliente compatível com o SDK do projeto. Windows pode servir o JavaScript para um iPhone. Para um development build, use as ferramentas nativas da plataforma. |

Os aplicativos abrem sem variáveis de ambiente. Nesse caso os portais informam que o acesso está em configuração. Na web, `/demo/index.html` contém a simulação interativa original. No mobile, a rota `/demo` mantém os dados em memória.

## Conectar um Supabase de desenvolvimento

1. Em um projeto de desenvolvimento vazio, aplique pelo SQL Editor, em ordem, `supabase/migrations/001_core.sql` e `002_portals.sql`. Com Supabase CLI e Docker locais, execute `supabase start` na raiz para criar a instância local com as migrações. A segunda migração valida referências existentes. Se houver dados anteriores inconsistentes, revise-os antes de migrar.
2. Copie `apps/web/.env.example` para `apps/web/.env.local` e `apps/mobile/.env.example` para `apps/mobile/.env.local`. Preencha a URL da API e a **chave publicável** do projeto. Cada app usa o prefixo presente em seu exemplo. No aparelho use uma URL alcançável por ele. Reinicie o servidor de desenvolvimento ou gere um novo build ao alterar esses valores.
3. Para testar com contas descartáveis, crie e confirme os usuários de e-mail/senha no Supabase Auth. No SQL Editor ou Studio, crie uma linha em `profiles` para cada UUID de Auth, uma oficina em `workshops` e um vínculo em `workshop_members` para o funcionário. Crie um `customer_contacts` da oficina com o UUID do motorista em `user_id`, um veículo desse contato e uma OS referenciando os mesmos três registros. Use exclusivamente dados fictícios.
4. Entre com cada conta na área correspondente. A oficina consulta as últimas 50 OS das oficinas vinculadas. O motorista consulta as últimas 50 OS dos seus contatos. O botão **Atualizar** repete a consulta. O acesso ao banco passa pela RLS. As credenciais de sessão ficam em memória e é preciso entrar de novo ao reabrir o portal.

As permissões de aplicativo são de leitura e limitadas a colunas específicas. A criação de vínculos permanece administrativa nesta etapa. A chave `service_role`, senhas de banco e tokens de provedores pertencem exclusivamente a serviços de confiança. Não os coloque nos arquivos de ambiente públicos.

## Verificar

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run build:mobile
```

O teste de navegador inicia o build web na porta 4173. Para usar o Chrome instalado, configure `CHROME_CHANNEL=chrome` no ambiente. O build web pode ser servido com `npm run start -w @autocrm/web`. A exportação mobile grava bundles Hermes e assets em `apps/mobile/dist`. Gerar e assinar instaladores exige as toolchains Android e Apple correspondentes.

## Estrutura e próximos passos

- `apps/web` contém a landing page, os portais e uma cópia pública da demo.
- `apps/mobile` contém as rotas Expo, a interface nativa e a demonstração.
- `packages/core` concentra etapas de manutenção, textos de navegação, criação do cliente Supabase e acesso comum aos atendimentos.
- `supabase/migrations` contém a estrutura relacional e as permissões. Nenhum worker de envio está instalado.
- `tests` contém as verificações do domínio, das políticas em PostgreSQL embarcado e da navegação web.

Consulte a [auditoria da fundação](docs/FUNDACAO.md) para escopo, validações e próxima implementação. O [contrato de produto](docs/PRODUCT.md) descreve as fases seguintes.
