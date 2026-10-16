import { useState } from "react";
import { Field, Segmented, textareaClass } from "@/components/workspace/DesktopWorkspaceUI";
import type { InvoicePreferences } from "@/contexts/DesktopBusinessContext";
import { ACCENTS, PAPER, type DocKind, type DocOptions, type DocTemplate, type PaperSize } from "../../../apps/mobile/src/features/documents/layout";
import { resolveDocumentStyle } from "../../../apps/mobile/src/features/documents/styleStore";
import { settingsFromPrefs } from "@/lib/documents/build";

/** The same "what to show" switches, in the same order and wording, as the phone app's Style & Color screen. */
export const SHOW_OPTIONS: { key: keyof DocOptions; title: string; note?: string; invoiceOnly?: boolean }[] = [
  { key: "logo", title: "My logo", note: "Your own logo, when you have uploaded one" },
  { key: "address", title: "Business address" },
  { key: "phone", title: "Business phone" },
  { key: "email", title: "Business email" },
  { key: "taxId", title: "Tax number" },
  { key: "website", title: "Website" },
  { key: "customerContact", title: "Customer phone and email" },
  { key: "itemNumbers", title: "Row numbers" },
  { key: "itemDescriptions", title: "Item descriptions" },
  { key: "taxLine", title: "Tax line in the totals" },
  { key: "amountBox", title: "Amount box at the top", note: "Standard layout only" },
  { key: "notes", title: "Notes" },
  { key: "terms", title: "Payment terms" },
  { key: "paymentDetails", title: "Payment details", note: "Bank or mobile-money details you type below" },
  { key: "signatureDefault", title: "Signature on new invoices", note: "You can still change it on each invoice", invoiceOnly: true },
  { key: "hideBranding", title: "Hide “Created with Receipt Cycle”", note: "Removes the small line in the footer" },
];

/** Like Field, but a plain block: a <label> around buttons would press the first button when its caption is clicked. */
function Group({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`block text-xs font-bold text-slate-600 ${className ?? ""}`} role="group" aria-label={label}>
      {label}
      {children}
    </div>
  );
}

/**
 * Layout, colour, paper size, what to print and payment details for invoices and estimates. Saves into the same
 * fields the phone app uses (invoiceTemplate, invoiceColor, estimateTemplate, estimateColor, paperSize, docOptions,
 * paymentInstructions) so a change here shows up on the phone and the other way round.
 */
export function DocumentStyleControls({
  prefs,
  onChange,
  kind,
  onKind,
}: {
  prefs: InvoicePreferences;
  onChange: (next: InvoicePreferences) => void;
  kind: DocKind;
  onKind: (kind: DocKind) => void;
}) {
  const [open, setOpen] = useState(false);
  const style = resolveDocumentStyle(kind, settingsFromPrefs(prefs), (ymd) => ymd);
  const setTemplate = (template: DocTemplate) => onChange({ ...prefs, ...(kind === "INVOICE" ? { invoiceTemplate: template } : { estimateTemplate: template }) });
  const setAccent = (hex: string) => onChange({ ...prefs, ...(kind === "INVOICE" ? { invoiceColor: hex } : { estimateColor: hex }) });
  const setPaper = (paperSize: PaperSize) => onChange({ ...prefs, paperSize });
  const setOption = (key: keyof DocOptions, value: boolean) =>
    onChange({ ...prefs, docOptions: { ...prefs.docOptions, [kind]: { ...style.options, [key]: value } } });
  const noun = kind === "INVOICE" ? "invoice" : "estimate";

  return (
    <div className="sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs font-bold text-slate-600">Document style</p>
          <p className="text-xs text-slate-500">How printed invoices and estimates look. Shared with the phone app.</p>
        </div>
        <Segmented options={[{ value: "INVOICE", label: "Invoice" }, { value: "ESTIMATE", label: "Estimate" }] as const} value={kind} onChange={onKind} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 grid-cols-1">
        <Group label="Layout">
          <div className="mt-2">
            <Segmented options={[{ value: "standard", label: "Standard" }, { value: "compact", label: "Compact" }] as const} value={style.template} onChange={setTemplate} />
          </div>
          <p className="mt-2 text-[11px] font-normal text-slate-500">
            {style.template === "standard" ? "Colour header, shaded table and a bold total. Best for sending to clients." : "Thin lines and small type. Fits more on a page and saves ink."}
          </p>
        </Group>
        <Group label="Paper size">
          <div className="mt-2">
            <Segmented options={[{ value: "a4", label: PAPER.a4.label }, { value: "letter", label: PAPER.letter.label }] as const} value={style.paper} onChange={setPaper} />
          </div>
        </Group>
        <Group label="Colour" className="sm:col-span-2">
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAccent(a.hex)}
                className={`h-9 w-9 rounded-full ring-offset-2 ${style.accent === a.hex ? "ring-2 ring-slate-900" : ""}`}
                style={{ backgroundColor: a.hex }}
                aria-label={a.name}
                aria-pressed={style.accent === a.hex}
              />
            ))}
          </div>
        </Group>
      </div>
      <div className="mt-4 rounded-lg border border-slate-200">
        <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left" aria-expanded={open}>
          <span className="text-xs font-bold text-slate-600">What to show on each {noun}</span>
          <i className={`fas fa-chevron-${open ? "up" : "down"} text-xs text-slate-400`} />
        </button>
        {open ? (
          <div className="divide-y divide-slate-100 border-t border-slate-100">
            {SHOW_OPTIONS.filter((row) => !row.invoiceOnly || kind === "INVOICE").map((row) => (
              <label key={row.key} className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-slate-800">{row.title}</span>
                  {row.note ? <span className="block text-[11px] text-slate-500">{row.note}</span> : null}
                </span>
                <input type="checkbox" className="h-4 w-4 shrink-0 accent-teal-700" checked={Boolean(style.options[row.key])} onChange={(e) => setOption(row.key, e.target.checked)} />
              </label>
            ))}
          </div>
        ) : null}
      </div>
      {style.options.paymentDetails ? (
        <Field label="Payment details" className="mt-4 block">
          <textarea
            className={textareaClass}
            maxLength={400}
            value={prefs.paymentInstructions ?? ""}
            onChange={(e) => onChange({ ...prefs, paymentInstructions: e.target.value })}
            placeholder="Bank name, account name and number, payment reference"
          />
          <p className="mt-1 text-[11px] font-normal text-slate-500">Printed under your notes on every {noun}. Leave empty to print nothing.</p>
        </Field>
      ) : null}
    </div>
  );
}
