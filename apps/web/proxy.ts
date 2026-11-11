import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { url, key, cookieOptions } from './lib/auth';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!url || !key) return response;
  const client = createServerClient(url, key, {
    cookieOptions: { ...cookieOptions, secure: request.nextUrl.protocol === 'https:' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(updates, headers) {
        for (const { name, value } of updates) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of updates) response.cookies.set(name, value, options);
        for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
      },
    },
  });
  await client.auth.getClaims();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/oficina/:path*', '/motorista/:path*'] };
