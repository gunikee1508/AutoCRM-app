'use client';

import { useState } from 'react';
import type { Kit } from '@autocrm/core/kit';

async function jpeg(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024)
    throw Error('Escolha um JPEG, PNG ou WebP de até 12 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw Error('Não foi possível preparar a foto.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.76).split(',')[1];
    if (!base64 || base64.length > 699052) throw Error('Escolha uma imagem menor.');
    return base64;
  } finally {
    bitmap.close();
  }
}

export const kit: Kit = {
  Form: ({ children, submit }) => (
    <form
      className="work-card"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {children}
    </form>
  ),
  Card: ({ children }) => <section className="work-card">{children}</section>,
  Heading: ({ children }) => <h2>{children}</h2>,
  Body: ({ children }) => <p>{children}</p>,
  Notice: ({ children }) => (
    <p className="work-notice" role="status">
      {children}
    </p>
  ),
  Input: ({ label, value, change, type, hint }) => (
    <label>
      {label}
      <input
        value={value}
        onChange={(e) => change(e.target.value)}
        type={type === 'email' || type === 'password' ? type : 'text'}
        placeholder={hint}
        autoComplete={type === 'otp' ? 'one-time-code' : type === 'email' ? 'email' : undefined}
      />
    </label>
  ),
  Button: ({ children, press, secondary, disabled, submit }) => (
    <button
      type={submit ? 'submit' : 'button'}
      className={secondary ? 'subtle' : ''}
      disabled={disabled}
      onClick={submit ? undefined : press}
    >
      {children}
    </button>
  ),
  Image: ({ label, src }) => <img className="shop-image" src={src} alt={label} />,
  Pick: ({ label, disabled, picked, failed }) => (
    <label>
      {label}
      <input
        type="file"
        disabled={disabled}
        accept="image/jpeg,image/png,image/webp"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            picked(await jpeg(file));
          } catch (err) {
            failed(err instanceof Error ? err.message : 'Não foi possível ler a imagem.');
          }
        }}
      />
    </label>
  ),
  Share: function Share({ area, code }) {
    const [status, setStatus] = useState('');
    const link = window.location.origin + '/' + area + '#convite=' + code;
    return (
      <div className="invite-share">
        <p>
          Compartilhe em particular com o destinatário. O link abre na web e também pode ser colado no
          aplicativo.
        </p>
        <label>
          Link de uso único
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
        </label>
        <button
          className="subtle"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(link);
              setStatus('Link copiado.');
            } catch {
              setStatus('Selecione o link e copie manualmente.');
            }
          }}
        >
          Copiar convite
        </button>
        <span role="status">{status}</span>
      </div>
    );
  },
};
