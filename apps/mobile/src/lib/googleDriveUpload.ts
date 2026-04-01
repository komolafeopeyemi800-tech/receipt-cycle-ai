/**
 * Upload JSON to the user's Google Drive (files created by this app; scope drive.file).
 * Uses uploadType=media then PATCH name — multipart uploads are unreliable in React Native fetch.
 */
export async function uploadJsonToDrive(accessToken: string, fileName: string, jsonBody: string): Promise<void> {
  const createRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=media", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: jsonBody,
  });

  if (!createRes.ok) {
    const t = await createRes.text();
    let detail = t || `Drive upload failed (${createRes.status})`;
    try {
      const j = JSON.parse(t) as { error?: { message?: string } };
      if (j?.error?.message) detail = j.error.message;
    } catch {
      /* keep text */
    }
    throw new Error(detail);
  }

  const created = (await createRes.json()) as { id?: string };
  if (!created.id) throw new Error("Drive upload succeeded but no file id was returned.");

  const patchRes = await fetch(`https://www.googleapis.com/drive/v3/files/${created.id}?fields=id,name`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: fileName }),
  });

  if (!patchRes.ok) {
    const t = await patchRes.text();
    throw new Error(t || `Could not set file name on Drive (${patchRes.status})`);
  }
}
