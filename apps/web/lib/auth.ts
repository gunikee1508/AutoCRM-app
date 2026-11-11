export const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// The browser SDK must be able to rotate its own cookies. Production uses HTTPS.
export const cookieOptions = { path: '/', sameSite: 'lax' as const };
