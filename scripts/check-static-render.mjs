import { renderPage } from "../dist-ssr/entry-server.js";
for (const path of ["/", "/privacy", "/pricing", "/blog/how-to-track-business-travel-expenses"]) {
  const html = await renderPage(path);
  if (!html.includes("<h1")) throw new Error(`Missing primary content: ${path}`);
  console.log(JSON.stringify({ path, bytes: Buffer.byteLength(html), images: (html.match(/<img\b/g) ?? []).length }));
}
