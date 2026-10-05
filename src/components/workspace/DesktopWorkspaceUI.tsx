import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WorkspaceHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
    <div>{eyebrow ? <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-teal-700">{eyebrow}</p> : null}<h1 className="text-2xl font-extrabold tracking-tight text-slate-950">{title}</h1><p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p></div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>;
}

export function PrimaryButton({ children, icon = "fa-plus", onClick, type = "button", disabled, className }: { children: ReactNode; icon?: string; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; className?: string }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#0f766e] to-[#0d9488] px-4 text-sm font-bold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50", className)}><i className={`fas ${icon}`} aria-hidden />{children}</button>;
}

export function SecondaryButton({ children, icon, onClick, disabled, danger, className }: { children: ReactNode; icon?: string; onClick?: () => void; disabled?: boolean; danger?: boolean; className?: string }) {
  return <button type="button" onClick={onClick} disabled={disabled} className={cn("inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-bold shadow-sm transition hover:bg-slate-50 disabled:opacity-50", danger ? "border-rose-200 text-rose-700" : "border-slate-200 text-slate-700", className)}>{icon ? <i className={`fas ${icon}`} aria-hidden /> : null}{children}</button>;
}

export function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]", className)}>{children}</section>;
}

export function SurfaceHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3"><div><h2 className="text-sm font-extrabold text-slate-900">{title}</h2>{description ? <p className="mt-0.5 text-xs text-slate-500">{description}</p> : null}</div>{action}</div>;
}

export function StatCard({ label, value, detail, icon, tone = "teal" }: { label: string; value: string; detail?: string; icon: string; tone?: "teal" | "blue" | "rose" | "amber" | "violet" }) {
  const tones = { teal: "bg-teal-50 text-teal-700", blue: "bg-blue-50 text-blue-700", rose: "bg-rose-50 text-rose-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
  return <Surface className="min-w-0 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 truncate text-xl font-extrabold tabular-nums text-slate-950">{value}</p>{detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}</div><div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tones[tone])}><i className={`fas ${icon}`} /></div></div></Surface>;
}

export function StatusPill({ status }: { status: string }) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const palette = normalized.includes("paid") || normalized.includes("accepted") || normalized.includes("active") || normalized.includes("received") || normalized.includes("complete") ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : normalized.includes("overdue") || normalized.includes("expired") || normalized.includes("refund") ? "bg-rose-50 text-rose-700 ring-rose-200" : normalized.includes("sent") || normalized.includes("partial") ? "bg-blue-50 text-blue-700 ring-blue-200" : "bg-slate-100 text-slate-600 ring-slate-200";
  return <span className={cn("inline-flex rounded-full px-2 py-1 text-[10px] font-extrabold capitalize ring-1 ring-inset", palette)}>{status.replace(/_/g, " ")}</span>;
}

export function IconBox({ icon, tone = "teal", className }: { icon: string; tone?: "teal" | "blue" | "rose" | "amber" | "violet"; className?: string }) {
  const tones = { teal: "bg-teal-50 text-teal-700", blue: "bg-blue-50 text-blue-700", rose: "bg-rose-50 text-rose-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" };
  return <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", tones[tone], className)}><i className={`fas ${icon}`} /></div>;
}

export function Segmented<T extends string>({ options, value, onChange }: { options: readonly { value: T; label: string }[]; value: T; onChange: (value: NoInfer<T>) => void }) {
  return <div className="inline-flex rounded-lg bg-slate-100 p-1">{options.map((option) => <button key={option.value} type="button" onClick={() => onChange(option.value)} className={cn("rounded-md px-3 py-1.5 text-xs font-bold transition", value === option.value ? "bg-white text-teal-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}>{option.label}</button>)}</div>;
}

export function Field({ label, children, required, className }: { label: string; children: ReactNode; required?: boolean; className?: string }) {
  return <label className={cn("block text-xs font-bold text-slate-600", className)}>{label}{required ? <span className="text-rose-600"> *</span> : null}{children}</label>;
}

export const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10";
export const textareaClass = "mt-1.5 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10";

export function Drawer({ open, onClose, title, description, children, width = "max-w-xl" }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; width?: string }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true"><button className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]" onClick={onClose} aria-label="Close" /><aside className={cn("absolute bottom-0 right-0 top-0 w-full overflow-y-auto border-l border-slate-200 bg-[#f8fbfb] shadow-2xl", width)}><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4"><div><h2 className="text-lg font-extrabold text-slate-950">{title}</h2>{description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}</div><button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close"><i className="fas fa-times" /></button></div><div className="p-5">{children}</div></aside></div>;
}

export function Modal({ open, onClose, title, description, children, width = "max-w-lg" }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; width?: string }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true"><button className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px]" onClick={onClose} aria-label="Close" /><div className={cn("relative max-h-[92vh] w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl", width)}><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4"><div><h2 className="text-lg font-extrabold text-slate-950">{title}</h2>{description ? <p className="mt-1 text-xs text-slate-500">{description}</p> : null}</div><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close"><i className="fas fa-times" /></button></div><div className="p-5">{children}</div></div></div>;
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return <div className="flex flex-col items-center justify-center px-6 py-12 text-center"><IconBox icon={icon} className="h-12 w-12 rounded-xl text-lg" /><h3 className="mt-3 text-sm font-extrabold text-slate-900">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">{description}</p></div>;
}

export function DetailRow({ icon, label, value, onClick }: { icon: string; label: string; value: ReactNode; onClick?: () => void }) {
  const body = <><IconBox icon={icon} tone="blue" /><div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><div className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value}</div></div>{onClick ? <i className="fas fa-chevron-right text-xs text-slate-400" /> : null}</>;
  return onClick ? <button type="button" onClick={onClick} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50">{body}</button> : <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0">{body}</div>;
}
