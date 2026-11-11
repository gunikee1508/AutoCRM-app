import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Kit } from './portal-kit';
import { useTask } from './use-portal';

export function Account({
  kit: K,
  client,
  driver,
}: {
  kit: Kit;
  client: SupabaseClient;
  driver: boolean;
}) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const task = useTask();
  function change(next: typeof mode) {
    setMode(next);
    setPassword('');
    setCode('');
    task.setMessage('');
  }
  function submit() {
    void task.run(async () => {
      const address = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw Error('Confira o e-mail informado.');
      if (mode === 'verify') {
        const { error } = await client.auth.verifyOtp({
          email: address,
          token: code.trim(),
          type: 'email',
        });
        if (error) throw Error('Código inválido ou expirado. Solicite um novo código.');
      } else if (mode === 'signup') {
        if (!name.trim() || name.trim().length > 120) throw Error('Informe seu nome com até 120 caracteres.');
        if (password.length < 10) throw Error('Escolha uma senha com pelo menos 10 caracteres.');
        const { error } = await client.auth.signUp({ email: address, password, options: { data: { full_name: name.trim() } } });
        if (error)
          throw Error('Não foi possível cadastrar. Confira o e-mail e a senha ou tente entrar.');
        change('verify');
        task.setMessage('Confira sua caixa de entrada e a pasta de spam.');
      } else {
        const { error } = await client.auth.signInWithPassword({ email: address, password });
        if (error) throw Error('Confira o e-mail, a senha e a confirmação da conta.');
      }
    });
  }
  return (
    <K.Form submit={submit}>
      <K.Heading>
        {mode === 'login'
          ? 'Entre na sua conta'
          : mode === 'verify'
            ? 'Confirme seu e-mail'
            : driver
              ? 'Crie sua conta gratuita'
              : 'Crie sua conta profissional'}
      </K.Heading>
      <K.Body>
        {mode === 'verify'
          ? 'Digite o código enviado pelo AutoCRM para concluir a confirmação.'
          : driver
            ? 'Use o mesmo e-mail que você informou à oficina.'
            : 'Use seu e-mail individual para administrar a oficina ou aceitar um convite de equipe.'}
      </K.Body>
      {mode === 'signup' && <K.Input label="Nome completo" value={name} change={setName} />}
      <K.Input label="E-mail" type="email" value={email} change={setEmail} />
      {mode === 'verify' ? (
        <K.Input label="Código de confirmação" type="otp" value={code} change={setCode} />
      ) : (
        <K.Input label="Senha" type="password" value={password} change={setPassword} />
      )}
      <K.Button submit disabled={task.busy} press={submit}>
        {task.busy
          ? 'Aguarde…'
          : mode === 'verify'
            ? 'Confirmar e-mail'
            : mode === 'signup'
              ? 'Cadastrar e confirmar e-mail'
              : 'Entrar'}
      </K.Button>
      {mode === 'verify' && (
        <K.Button
          secondary
          disabled={task.busy}
          press={() =>
            void task.run(async () => {
              const { error } = await client.auth.resend({ type: 'signup', email: email.trim() });
              if (error) throw Error('Aguarde um momento antes de solicitar outro código.');
              task.setMessage('Verifique seu e-mail para continuar.');
            })
          }
        >
          Reenviar código
        </K.Button>
      )}
      <K.Button
        secondary
        disabled={task.busy}
        press={() => change(mode === 'login' ? 'signup' : 'login')}
      >
        {mode === 'login' ? 'Criar uma conta' : 'Já tenho conta confirmada'}
      </K.Button>
      {mode === 'login' && (
        <K.Button secondary disabled={task.busy} press={() => change('verify')}>
          Tenho um código de confirmação
        </K.Button>
      )}
      {task.message && <K.Notice>{task.message}</K.Notice>}
    </K.Form>
  );
}
