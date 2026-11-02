import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { AppRoutes } from "./App";
import { publicPageDefinitions } from "./PublicApp";

/** Build-time static render waits for lazy public pages; no private account records are rendered. */
export function renderPage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    const chunks: Buffer[] = [];
    let renderError: unknown;
    output.on("data", chunk => chunks.push(Buffer.from(chunk)));
    output.on("end", () => renderError ? reject(renderError) : resolve(Buffer.concat(chunks).toString("utf8")));
    output.on("error", reject);
    const timeout = setTimeout(() => { stream.abort(); reject(new Error(`Static rendering timed out for ${url}`)); }, 120000);
    output.on("close", () => clearTimeout(timeout));
    const stream = renderToPipeableStream(<AppErrorBoundary><StaticRouter location={url}><AppRoutes /></StaticRouter></AppErrorBoundary>, {
      identifierPrefix: "rc-",
      onAllReady() { stream.pipe(output); },
      onShellError(error) { clearTimeout(timeout); reject(error); },
      onError(error) { renderError = error; },
    });
  });
}

export function pageModule(path: string): string | undefined {
  const route = publicPageDefinitions.find(p => p.path === path || (p.path === "/blog/:slug" && path.startsWith("/blog/")));
  return route?.module;
}
