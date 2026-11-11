export function authMessage(error: { status?: number; code?: string; name?: string }, fallback: string) {
  if (error.status === 429) return 'Muitas tentativas. Aguarde um momento antes de tentar novamente.';
  if (error.code === 'email_not_confirmed')
    return 'Confirme seu e-mail com o código recebido antes de entrar.';
  if (error.name === 'AuthRetryableFetchError' || error.status === 0 || (error.status ?? 0) >= 500)
    return 'Conexão indisponível. Confira sua rede e tente novamente.';
  return fallback;
}
