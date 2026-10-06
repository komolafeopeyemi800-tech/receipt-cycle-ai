import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export type GoogleClaims = { sub?: string; email?: string; email_verified?: boolean; name?: string; picture?: string };

/** Wrapped in an object so tests can replace it without network access. */
export const googleVerifier = {
  async verify(idToken: string, audiences: string[]): Promise<GoogleClaims> {
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: audiences,
    });
    return payload as GoogleClaims;
  },
};
