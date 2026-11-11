import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { url, key, cookieOptions } from './auth';

export async function serverIdentity() {
  if (!url || !key) return null;
  const jar = await cookies();
  const client = createServerClient(url, key, {
    cookieOptions,
    cookies: { getAll: () => jar.getAll() },
  });
  const { data } = await client.auth.getClaims();
  return data?.claims.sub ?? null;
}
