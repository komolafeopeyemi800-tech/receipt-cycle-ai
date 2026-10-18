import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const run = vi.fn();
const state = {
  busy: null as string | null,
  error: null as { code: string; message: string } | null,
  done: null as unknown,
  canExport: true,
  disabledByAdmin: false,
  proRequired: false,
  rowCount: 3 as number | undefined,
};

vi.mock("@/components/layout/AppChrome", () => ({ AppChrome: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/contexts/WebAuthContext", () => ({ useWebAuth: () => ({ user: { id: "u1" }, token: "t" }) }));
vi.mock("@/contexts/WorkspaceContext", () => ({ useWorkspace: () => ({ workspace: "personal", ready: true }) }));
vi.mock("@mobile-lib/api", () => ({
  api: { notifications: { preferences: "p" }, transactions: { list: "l" } },
  useQuery: (ref: string) => (ref === "l" ? [{}, {}, {}] : { ok: true }),
}));
vi.mock("@/lib/googleDriveWeb", () => ({ isGoogleSaveConfigured: () => true, preloadGoogleIdentity: () => Promise.resolve() }));
vi.mock("@/hooks/useWebExport", () => ({ useWebExport: () => ({ ...state, run, reset: vi.fn(), loadingRows: false }) }));

import BackupExport from "./BackupExport";

function show() {
  return render(
    <MemoryRouter>
      <BackupExport />
    </MemoryRouter>,
  );
}

describe("BackupExport page", () => {
  beforeEach(() => {
    run.mockClear();
    Object.assign(state, { busy: null, error: null, done: null, canExport: true, disabledByAdmin: false, proRequired: false, rowCount: 3 });
  });

  it("shows the synced banner with the record count and the three options", () => {
    const { container } = show();
    expect(screen.getByText(/backed up and synchronized/i)).toBeInTheDocument();
    expect(screen.getByText(/Last synced:/)).toHaveTextContent(/3 records/);
    expect(screen.getByRole("button", { name: /download excel report/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /download csv/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /save to google sheets/i })).toBeEnabled();
    expect(container.textContent).not.toMatch(/[–—]/);
  });

  it("starts the matching export when a card is pressed", () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: /save to google sheets/i }));
    fireEvent.click(screen.getByRole("button", { name: /download csv/i }));
    expect(run.mock.calls.map((c) => c[0])).toEqual(["google", "csv"]);
  });

  it("disables export and explains why for the admin switch and for non-Pro", () => {
    state.disabledByAdmin = true;
    const first = show();
    expect(screen.getByText(/disabled by admin/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download excel report/i })).toBeDisabled();
    first.unmount();
    Object.assign(state, { disabledByAdmin: false, proRequired: true });
    show();
    expect(screen.getByText(/included with Pro/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save to google sheets/i })).toBeDisabled();
  });

  it("shows a friendly error and the Open in Google Sheets link after a save", () => {
    state.error = { code: "google_auth", message: "Your browser blocked the Google window. Allow pop-ups for this site and try again." };
    const first = show();
    expect(screen.getByRole("alert")).toHaveTextContent(/blocked the Google window/);
    first.unmount();
    Object.assign(state, { error: null, done: { action: "google", count: 3, sheet: { id: "x", webViewLink: "https://docs.google.com/spreadsheets/d/x/edit" } } });
    show();
    expect(screen.getByRole("link", { name: /open in google sheets/i })).toHaveAttribute("href", "https://docs.google.com/spreadsheets/d/x/edit");
  });
});
