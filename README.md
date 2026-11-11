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

## Cadastro e homologação

A Etapa 2 disponibiliza cadastro com confirmação de e-mail, onboarding da oficina, gestão de funcionários e vínculo de motoristas por convite de uso único. Os painéis usam permissões verificadas no banco.

Siga o [guia da Etapa 2](docs/ETAPA_2.md) para aplicar as três migrações, configurar Auth e SMTP, preencher os arquivos de ambiente e testar com contas reais na web e nos aplicativos. O guia contém a matriz de permissões e os passos para executar o teste com Supabase Auth local.

O [guia de sessões e homologação da Etapa 2.5](docs/ETAPA_2_5.md) detalha recuperação por e-mail, testes entre contas e validação em aparelhos.

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

Consulte a [auditoria da fundação](docs/FUNDACAO.md) para o histórico do primeiro marco. O [contrato de produto](docs/PRODUCT.md) descreve as fases seguintes.
