export const AUTH_COOKIE = 'shinecalc_auth';

/** Cookie value = SHA-256(password). Works in both the edge middleware and node routes. */
export async function authToken(): Promise<string> {
  const pw = process.env.APP_PASSWORD ?? '';
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`shinecalc:${pw}`)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
