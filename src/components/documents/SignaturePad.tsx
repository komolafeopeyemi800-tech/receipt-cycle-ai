import { useEffect, useRef, useState } from "react";
import { Modal, PrimaryButton, SecondaryButton } from "@/components/workspace/DesktopWorkspaceUI";
import type { SignatureInk } from "@/contexts/DesktopBusinessContext";

type Pt = [number, number];

/**
 * Turns drawn strokes (pixels) into the phone app's signature format: points normalised to 0..1 after trimming the
 * empty margins, plus the width / height ratio. Exported for tests.
 */
export function strokesToInk(strokes: Pt[][]): SignatureInk | null {
  const all = strokes.flat();
  if (!all.length) return null;
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = Math.max(maxX - minX, 8), bh = Math.max(maxY - minY, 8);
  const norm = strokes.filter((s) => s.length).map((stroke) => stroke.map(([x, y]) => [Math.round(((x - minX) / bw) * 1000) / 1000, Math.round(((y - minY) / bh) * 1000) / 1000]));
  return { strokes: norm, aspect: Math.min(Math.max(bw / bh, 0.8), 6) };
}

/** Draws a saved signature (used for the small preview next to the Draw button). */
export function InkPreview({ ink, className = "h-12" }: { ink: SignatureInk; className?: string }) {
  const w = 100 * Math.min(ink.aspect, 6), h = 100;
  const d = ink.strokes
    .map((stroke) => {
      const pts = stroke.length === 1 ? [stroke[0], [stroke[0][0] + 0.001, stroke[0][1]]] : stroke;
      return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${(x * w).toFixed(1)} ${(y * h).toFixed(1)}`).join(" ");
    })
    .join(" ");
  return (
    <svg viewBox={`-4 -4 ${w + 8} ${h + 8}`} className={className} role="img" aria-label="Saved signature">
      <path d={d} fill="none" stroke="#111827" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A pad to sign with a mouse, finger or pen. Saves the same signature format the phone app uses. */
export function SignaturePad({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (ink: SignatureInk) => void }) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const strokes = useRef<Pt[][]>([]);
  const drawing = useRef(false);
  const [count, setCount] = useState(0);

  const redraw = () => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#111827";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes.current) {
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0][0], stroke[0][1], 1.2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      stroke.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    }
  };

  useEffect(() => {
    if (open) {
      strokes.current = [];
      setCount(0);
    }
  }, [open]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const rect = e.currentTarget.getBoundingClientRect();
    // The canvas is drawn at its on-screen size, so pointer coordinates map straight onto it.
    return [Math.min(Math.max(e.clientX - rect.left, 0), rect.width), Math.min(Math.max(e.clientY - rect.top, 0), rect.height)];
  };

  return (
    <Modal open={open} onClose={onClose} title="Draw your signature" description="Use your mouse, finger or pen. It is printed on documents that ask for a signature." width="max-w-xl">
      <canvas
        ref={(el) => {
          canvas.current = el;
          if (el && (el.width !== Math.round(el.clientWidth) || el.height !== Math.round(el.clientHeight)) && el.clientWidth) {
            el.width = Math.round(el.clientWidth);
            el.height = Math.round(el.clientHeight);
            redraw();
          }
        }}
        className="h-56 w-full touch-none rounded-md border border-dashed border-slate-300 bg-white"
        aria-label="Signature pad"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drawing.current = true;
          strokes.current = [...strokes.current, [point(e)]];
          setCount(strokes.current.length);
          redraw();
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const last = strokes.current[strokes.current.length - 1];
          if (last) last.push(point(e));
          redraw();
        }}
        onPointerUp={() => { drawing.current = false; }}
        onPointerCancel={() => { drawing.current = false; }}
      />
      <div className="mt-4 flex justify-end gap-2">
        <SecondaryButton onClick={() => { strokes.current = []; setCount(0); redraw(); }}>Clear</SecondaryButton>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton
          icon="fa-check"
          onClick={() => {
            if (!count) return;
            const ink = strokesToInk(strokes.current);
            if (ink) onSave(ink);
          }}
        >
          Use signature
        </PrimaryButton>
      </div>
    </Modal>
  );
}
