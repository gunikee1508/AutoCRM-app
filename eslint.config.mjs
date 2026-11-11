import ts from 'typescript-eslint';
export default ts.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.expo/**', '**/.next/**', '**/public/demo/**', '**/next-env.d.ts'] },
  ...ts.configs.recommended
);
