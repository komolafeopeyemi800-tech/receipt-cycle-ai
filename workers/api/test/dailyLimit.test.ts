import { describe, expect, it } from "vitest";
import { api, makeUser } from "./helpers";

const adminHeaders = { "x-admin-secret": "admin-secret" };

describe("daily limits on paid AI features", () => {
  it("stops a person after the admin's allowance and says to come back tomorrow, without revealing the number", async () => {
    const admin = await makeUser({ email: "boss@example.com" });
    const put = await api("PUT", "/api/admin/config", { token: admin.token, headers: adminHeaders, body: { dailyVoiceLimit: 2 } });
    expect(put.status).toBe(200);
    const read = await api("GET", "/api/admin/config", { token: admin.token, headers: adminHeaders });
    expect(read.json.dailyVoiceLimit).toBe(2);
    // the public config the apps read must not show the allowance
    const open = await api("GET", "/api/config", {});
    expect(open.json.dailyVoiceLimit).toBeUndefined();

    const { token } = await makeUser({ pro: true });
    const call = () => api("POST", "/api/ai/voice/parse", { token, body: { text: "coffee 3 dollars" } });
    await call();
    await call();
    const third = await call();
    expect(third.json.ok).toBe(false);
    expect(third.json.error).toMatch(/come back tomorrow/i);
    expect(String(third.json.error)).not.toMatch(/\b2\b/);
  });

  it("counts each person separately and counts uploads, scans and voice apart", async () => {
    const admin = await makeUser({ email: "boss@example.com" });
    await api("PUT", "/api/admin/config", { token: admin.token, headers: adminHeaders, body: { dailyVoiceLimit: 1, dailyScanLimit: 1, dailyUploadLimit: 1 } });
    const a = await makeUser({ pro: true });
    const b = await makeUser({ pro: true });
    await api("POST", "/api/ai/voice/parse", { token: a.token, body: { text: "lunch 10" } });
    const aVoice = await api("POST", "/api/ai/voice/parse", { token: a.token, body: { text: "lunch 10" } });
    expect(aVoice.json.error).toMatch(/come back tomorrow/i);
    const bVoice = await api("POST", "/api/ai/voice/parse", { token: b.token, body: { text: "lunch 10" } });
    expect(bVoice.json.error ?? "").not.toMatch(/come back tomorrow/i);
    // a's voice allowance being used up does not touch their scan allowance
    const scan = await api("POST", "/api/ai/scan", { token: a.token, body: { imageBase64: "AAAA" } });
    expect(scan.json.error ?? "").not.toMatch(/come back tomorrow/i);
    await api("POST", "/api/ai/scan-text", { token: a.token, body: { text: "Total 12.00 Coffee shop receipt" } });
    const upload = await api("POST", "/api/ai/scan-text", { token: a.token, body: { text: "Total 12.00 Coffee shop receipt" } });
    expect(upload.json.error).toMatch(/come back tomorrow/i);
  });
});
