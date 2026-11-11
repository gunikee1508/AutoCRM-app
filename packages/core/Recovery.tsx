import { authMessage } from './auth-error';
import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Kit } from './portal-kit';
import { useTask } from './use-portal';

export function Recovery({
  kit: K,
  client,
  back,
}: {
  kit: Kit;
  client: SupabaseClient;
  back: () => void;
}) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const task = useTask();
  async function send() {
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw Error('Confira o e-mail informado.');
    const { error } = await client.auth.resetPasswordForEmail(address);
    if (error)
      throw Error(
        authMessage(error, 'Confira a conexão e aguarde um momento antes de tentar novamente.')
      );
    setSent(true);
    task.setMessage('Se houver uma conta com esse e-mail, você receberá um código de recuperação.');
  }
  function submit() {
    void task.run(async () => {
      if (!sent) return send();
      if (!/^\d{6,10}$/.test(code.trim())) throw Error('Digite o código numérico recebido por e-mail.');
      const { error } = await client.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'recovery',
      });
      if (error) throw Error(authMessage(error, 'Confira o código, a validade e sua conexão.'));
    });
  }
  return (
    <K.Form submit={submit}>
      <K.Heading>Recuperar senha</K.Heading>
      {sent ? (
        <>
          <K.Body>Digite o código enviado para {email.trim()}.</K.Body>
          <K.Input label="Código de recuperação" value={code} change={setCode} type="otp" />
        </>
      ) : (
        <K.Input label="E-mail de recuperação" value={email} change={setEmail} type="email" />
      )}
      <K.Button submit disabled={task.busy} press={submit}>
        {task.busy ? 'Aguarde…' : sent ? 'Verificar código' : 'Enviar código'}
      </K.Button>
      {sent && (
        <K.Button secondary disabled={task.busy} press={() => void task.run(send)}>
          Reenviar código
        </K.Button>
      )}
      <K.Button secondary disabled={task.busy} press={back}>
        Voltar ao login
      </K.Button>
      {task.message && <K.Notice>{task.message}</K.Notice>}
    </K.Form>
  );
}

export function NewPassword({
  kit: K,
  client,
  done,
}: {
  kit: Kit;
  client: SupabaseClient;
  done: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const task = useTask();
  function submit() {
    void task.run(async () => {
      if (password.length < 10) throw Error('Use pelo menos 10 caracteres na nova senha.');
      if (password !== confirmation) throw Error('As duas senhas precisam ser iguais.');
      const { error } = await client.auth.updateUser({ password });
      if (error)
        throw Error(
          authMessage(
            error,
            'Não foi possível alterar. Escolha uma senha diferente e confira sua conexão.'
          )
        );
      done();
    });
  }
  return (
    <K.Form submit={submit}>
      <K.Heading>Escolha uma nova senha</K.Heading>
      <K.Input label="Nova senha" value={password} change={setPassword} type="password" />
      <K.Input
        label="Confirme a nova senha"
        value={confirmation}
        change={setConfirmation}
        type="password"
      />
      <K.Button submit press={submit} disabled={task.busy}>
        {task.busy ? 'Salvando…' : 'Salvar nova senha'}
      </K.Button>
      {task.message && <K.Notice>{task.message}</K.Notice>}
    </K.Form>
  );
}
