# AutoCRM — primeira prévia Android/iOS

Esta pasta contém as telas iniciais React Native/Expo. **Não é um app publicado**, não foi possível compilar nesta sessão (instalação das dependências exige internet). O estado é local e fictício.

Para criar o projeto Expo no seu computador com internet:

```bash
npx create-expo-app@latest autocrm-mobile
cd autocrm-mobile
```

Use a estrutura padrão com Expo Router. Substitua os arquivos `app/index.tsx`, `app/_layout.tsx` e `app.json` pelos arquivos desta pasta. Então:

```bash
npx expo start
```

O app Expo tem uma chave visual para alternar entre a prévia de oficina e a de motorista. **Em produção, essa alternância será removida**: o usuário verá somente os acessos autorizados por login, claims e políticas RLS do servidor. O aplicativo ainda não tem backend nem APIs, e ações de notificação são meras simulações.

Antes de distribuir: definir identificadores únicos, configurar push notifications, ícones, autenticação e EAS Build. Os identificadores `com.exemplo.autocrm` são placeholders; não use esses IDs em publicação.
