import { env } from "cloudflare:test";
import { afterEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";
import { googleVerifier } from "../src/lib/googleIdToken";
import { api, makeUser } from "./helpers";

afterEach(() => vi.restoreAllMocks());

const photo = "https://lh3.googleusercontent.com/a/abc=s96-c";

describe("Google profile picture", () => {
  it("imports name and picture on sign-up and keeps an uploaded picture on later sign-ins", async () => {
    vi.spyOn(googleVerifier, "verify").mockResolvedValue({ sub: "g-pic", email: "pic@example.com", email_verified: true, name: "Pia", picture: photo });
    const first = await api("POST", "/api/social/google", { body: { idToken: "t" } });
    expect(first.json.user).toMatchObject({ name: "Pia", image: photo });
    expect((await api("GET", "/api/me", { token: first.json.token })).json.image).toBe(photo);

    const put = await app.request(
      "/api/me/avatar",
      { method: "PUT", headers: { authorization: `Bearer ${first.json.token}`, "content-type": "image/png" }, body: new Uint8Array([1, 2, 3]) },
      env,
    );
    expect(put.status).toBe(200);
    const { image } = (await put.json()) as { image: string };
    expect(image).toContain(`/api/me/avatar/${first.json.user.id}`);

    const again = await api("POST", "/api/social/google", { body: { idToken: "t" } });
    expect(again.json.user.image).toBe(image);
    const served = await app.request(`/api/me/avatar/${first.json.user.id}`, {}, env);
    expect(served.status).toBe(200);
    expect(served.headers.get("content-type")).toBe("image/png");
  });
});

describe("profile editing", () => {
  it("renames, rejects bad pictures and removes the picture", async () => {
    const { token } = await makeUser();
    expect((await api("PATCH", "/api/me", { token, body: { name: "  Ada L  " } })).json.name).toBe("Ada L");
    expect((await api("GET", "/api/me", { token })).json.name).toBe("Ada L");
    expect((await api("PATCH", "/api/me", { token, body: { name: "" } })).status).toBe(400);

    const bad = await app.request("/api/me/avatar", { method: "PUT", headers: { authorization: `Bearer ${token}`, "content-type": "text/html" }, body: "x" }, env);
    expect(bad.status).toBe(400);
    const big = await app.request(
      "/api/me/avatar",
      { method: "PUT", headers: { authorization: `Bearer ${token}`, "content-type": "image/jpeg" }, body: new Uint8Array(1024 * 1024 + 1) },
      env,
    );
    expect(big.status).toBe(413);
    expect((await api("DELETE", "/api/me/avatar", { token })).json).toEqual({ ok: true });
    expect((await api("GET", "/api/me", { token })).json.image).toBeNull();
  });
});
