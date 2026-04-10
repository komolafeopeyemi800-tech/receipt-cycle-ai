import { useCallback, useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@convex/_generated/api";
import { userFacingError } from "@/lib/userFacingErrors";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { useWebAuth } from "@/contexts/WebAuthContext";

const primary = "#0f766e";
const rose600 = "#e11d48";

type Msg = { role: "user" | "assistant"; content: string };

export type CoachRow = {
  date: string;
  amount: number;
  type: string;
  category: string;
  merchant?: string;
  description?: string;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => {
      const data = r.result as string;
      resolve(data.includes(",") ? data.split(",")[1]! : data);
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodLabel: string;
  rowsForAi: CoachRow[];
  userId: string | undefined;
};

/** Web port of mobile `FinanceCoachScreen` — chat grounded in the same transaction slice. */
export function FinanceCoachDialog({ open, onOpenChange, periodLabel, rowsForAi, userId }: Props) {
  const { token } = useWebAuth();
  const { voiceInputLanguage } = useWebPreferences();
  const coachChat = useAction(api.voiceFinance.financeCoachChat);
  const transcribe = useAction(api.voiceFinance.transcribeUserAudio);

  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      role: "assistant",
      content:
        "Ask anything about your spending in this period: where money might be wasted, what to cut, category patterns, or how to budget better. Use voice or type.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const recCtxRef = useRef<{ recorder: MediaRecorder; stream: MediaStream } | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    setMessages([
      {
        role: "assistant",
        content:
          "Ask anything about your spending in this period: where money might be wasted, what to cut, category patterns, or how to budget better. Use voice or type.",
      },
    ]);
    setInput("");
  }, [open]);

  const stopTracks = useCallback(() => {
    recCtxRef.current?.stream.getTracks().forEach((t) => t.stop());
    recCtxRef.current = null;
  }, []);

  const sendMessages = useCallback(
    async (nextMsgs: Msg[]) => {
      if (!userId || !token) return;
      if (rowsForAi.length === 0) {
        setMessages([
          ...nextMsgs,
          { role: "assistant", content: "Add a few transactions first — then I can look at your patterns." },
        ]);
        return;
      }
      setBusy(true);
      try {
        const out = await coachChat({
          periodLabel,
          rows: rowsForAi,
          messages: nextMsgs.map((m) => ({ role: m.role, content: m.content })),
          sessionToken: token,
        });
        if (!out.ok) {
          setMessages([...nextMsgs, { role: "assistant", content: userFacingError(out.error) }]);
          return;
        }
        setMessages([...nextMsgs, { role: "assistant", content: out.reply }]);
      } catch (e) {
        setMessages([
          ...nextMsgs,
          { role: "assistant", content: userFacingError(e instanceof Error ? e.message : "Request failed.") },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [coachChat, periodLabel, rowsForAi, userId, token],
  );

  const onSend = useCallback(async () => {
    const t = input.trim();
    if (!t || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    await sendMessages(next);
  }, [input, busy, messages, sendMessages]);

  const toggleRecord = useCallback(async () => {
    if (busy && !recording) return;
    if (recording && recCtxRef.current) {
      setRecording(false);
      const { recorder } = recCtxRef.current;
      return new Promise<void>((resolve) => {
        recorder.onstop = async () => {
          stopTracks();
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
          chunksRef.current = [];
          setBusy(true);
          try {
            if (!token) {
              setMessages((m) => [...m, { role: "assistant", content: "Sign in to use voice." }]);
              setBusy(false);
              resolve();
              return;
            }
            const b64 = await blobToBase64(blob);
            const tr = await transcribe({
              audioBase64: b64,
              mimeType: blob.type || "audio/webm",
              language: voiceInputLanguage,
              sessionToken: token,
            });
            if (!tr.ok) {
              setMessages((m) => [...m, { role: "assistant", content: userFacingError(tr.error) }]);
            } else {
              const text = tr.text.trim();
              if (text) {
                let nextForSend: Msg[] = [];
                setMessages((prev) => {
                  nextForSend = [...prev, { role: "user", content: text }];
                  return nextForSend;
                });
                await sendMessages(nextForSend);
              }
            }
          } catch (e) {
            setMessages((m) => [
              ...m,
              {
                role: "assistant",
                content: userFacingError(e instanceof Error ? e.message : "Transcription failed."),
              },
            ]);
          } finally {
            setBusy(false);
            resolve();
          }
        };
        recorder.stop();
      });
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMessages((m) => [...m, { role: "assistant", content: "Voice questions aren’t available in this browser." }]);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime =
        MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recCtxRef.current = { recorder, stream };
      recorder.start(250);
      setRecording(true);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Enable the microphone in your browser to ask a question by voice." },
      ]);
    }
  }, [busy, recording, sendMessages, stopTracks, transcribe, voiceInputLanguage, token]);

  useEffect(() => {
    return () => stopTracks();
  }, [stopTracks]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-slate-200 px-4 py-3 text-left">
          <DialogTitle className="text-base font-bold text-slate-900">Finance coach</DialogTitle>
          <p className="text-xs font-medium text-slate-500">{periodLabel}</p>
        </DialogHeader>

        <div className="min-h-[280px] flex-1 overflow-y-auto px-4 py-3">
          <ul className="space-y-3">
            {messages.map((m, i) => (
              <li
                key={i}
                className={`rounded-xl px-3 py-2 text-[13px] leading-snug ${
                  m.role === "user" ? "ml-6 bg-slate-100 text-slate-900" : "mr-6 bg-emerald-50 text-slate-800"
                }`}
              >
                {m.content}
              </li>
            ))}
          </ul>
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void toggleRecord()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#0f766e] bg-white text-[#0f766e] disabled:opacity-50"
              style={recording ? { backgroundColor: rose600, borderColor: rose600, color: "#fff" } : undefined}
              aria-label={recording ? "Stop recording" : "Record question"}
            >
              {busy && !recording ? (
                <i className="fas fa-circle-notch fa-spin" aria-hidden />
              ) : (
                <i className={`fas ${recording ? "fa-stop" : "fa-microphone"}`} aria-hidden />
              )}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              rows={2}
              placeholder="Ask a question…"
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] disabled:bg-slate-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <button
              type="button"
              disabled={busy || !input.trim()}
              onClick={() => void onSend()}
              className="shrink-0 rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              style={{ backgroundColor: primary }}
            >
              Send
            </button>
          </div>
          {recording ? (
            <p className="mt-2 text-[11px] font-semibold text-rose-600">Recording… tap mic to stop and send.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
