/**
 * Password hashing that fits the Workers free plan: PBKDF2-SHA256 runs in the platform's native crypto
 * (Better Auth's default scrypt runs in JavaScript and takes several times the free CPU limit).
 * Format: pbkdf2$<iterations>$<salt base64>$<hash base64>. Cloudflare caps PBKDF2 at 100,000 iterations.
 */
const ITERATIONS = 100_000;

const b64 = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password.normalize("NFKC")), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
}

export async function hashPbkdf2(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(await derive(password, salt, ITERATIONS))}`;
}

export const isPbkdf2 = (hash: string) => hash.startsWith("pbkdf2$");

export async function verifyPbkdf2(hash: string, password: string): Promise<boolean> {
  const [, iter, salt, expected] = hash.split("$");
  const iterations = Number(iter);
  if (!salt || !expected || !Number.isInteger(iterations) || iterations < 1 || iterations > 100_000) return false;
  const actual = new Uint8Array(await derive(password, unb64(salt), iterations));
  const want = unb64(expected);
  if (actual.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ want[i];
  return diff === 0;
}
