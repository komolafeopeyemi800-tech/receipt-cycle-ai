import { useCallback, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { userFacingError } from "@/lib/userFacingErrors";
import { useWebPreferences } from "@/contexts/WebPreferencesContext";
import { useWebAuth } from "@/contexts/WebAuthContext";

const primary = "#0f766e";
const rose600 = "#e11d48";

export type VoiceDraft = {
  intent: "transaction" | "budget";
  amount: number | null;
  type: "expense" | "income";
  category: string;
  merchant: string | null;
  date: string | null;
  description: string | null;
  payment_method: string | null;
  confidence: string;
  budgetCategory: string | null;
  budgetLimit: number | null;
  budgetMonth: string | null;
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

type VoiceHints = {
  expenseCategories?: string[];
  incomeCategories?: string[];
  accountNames?: string[];
};

type Props = {
  disabled?: boolean;
  hints?: VoiceHints | null;
  onParsed: (draft: VoiceDraft, transcript?: string) => void;
};

/** Voice + quick text parse; wired to the same backend actions as the mobile app. */
export function VoiceQuickAddWeb({ disabled, hints, onParsed }: Props) {
  const { token } = useWebAuth();
  const { voiceInputLanguage } = useWebPreferences();
  const parseFromText = useAction(api.voiceFinance.parseTransactionFromSpeech);
  const voiceFromAudio = useAction(api.voiceFinance.voiceTransactionFromAudio);

  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const recCtxRef = useRef<{ recorder: MediaRecorder; stream: MediaStream } | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const stopTracks = useCallback(() => {
    recCtxRef.current?.stream.getTracks().forEach((t) => t.stop());
    recCtxRef.current = null;
  }, []);

  const runParseFromText = useCallback(async () => {
    const t = phrase.trim();
    if (!t) {
      setMsg('Type or record something like "12 dollars coffee at Starbucks yesterday".');
      return;
    }
    setMsg(null);
    if (!token) {
      setMsg("Sign in to use voice and quick text.");
      return;
    }
    setBusy(true);
    try {
      const out = await parseFromText({
        text: t,
        sessionToken: token,
        hints: hints ?? undefined,
      });
      if (!out.ok || !out.draft) {
        setMsg(userFacingError(out.error));
        return;
      }
      onParsed(out.draft as VoiceDraft);
      setMsg("Parsed — review the preview below and save.");
    } catch (e) {
      setMsg(userFacingError(e instanceof Error ? e.message : "Parse failed"));
    } finally {
      setBusy(false);
    }
  }, [phrase, parseFromText, onParsed, token, hints]);

  const toggleRecording = useCallback(async () => {
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
              setMsg("Sign in to use voice.");
              setBusy(false);
              resolve();
              return;
            }
            const b64 = await blobToBase64(blob);
            const mt = blob.type || "audio/webm";
            const out = await voiceFromAudio({
              audioBase64: b64,
              mimeType: mt,
              language: voiceInputLanguage,
              sessionToken: token,
              hints: hints ?? undefined,
            });
            if (!out.ok || !out.draft) {
              const err = userFacingError(out.error);
              setMsg(
                out.transcript
                  ? `${err} Here’s what we heard: “${out.transcript.slice(0, 200)}${out.transcript.length > 200 ? "…" : ""}”`
                  : err,
              );
              if (out.transcript) setPhrase(out.transcript);
              return;
            }
            if (out.transcript) setPhrase(out.transcript);
            onParsed(out.draft as VoiceDraft, out.transcript);
            setMsg("Filled from voice — review and save.");
          } catch (e) {
            setMsg(userFacingError(e instanceof Error ? e.message : "Voice processing failed"));
          } finally {
            setBusy(false);
            resolve();
          }
        };
        recorder.stop();
      });
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setMsg("Voice input isn’t available in this browser. Try typing your purchase instead.");
      return;
    }
    setMsg(null);
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
      setMsg("Enable the microphone in your browser to record a purchase, or type it instead.");
    }
  }, [busy, recording, stopTracks, voiceFromAudio, onParsed, voiceInputLanguage, token, hints]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[13px] font-extrabold text-slate-800">Voice or quick text</p>
      <p className="mt-1.5 text-[11px] leading-snug text-slate-600">
        Say a purchase, a budget cap (e.g. &quot;set food budget to 400 this month&quot;), or type below — we match your
        categories and accounts when possible.
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void toggleRecording()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#0f766e] bg-white text-[#0f766e] shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
          style={recording ? { backgroundColor: rose600, borderColor: rose600, color: "#fff" } : undefined}
          aria-label={recording ? "Stop recording" : "Start voice recording"}
        >
          {busy && !recording ? (
            <i className="fas fa-circle-notch fa-spin text-lg" aria-hidden />
          ) : (
            <i className={`fas ${recording ? "fa-stop" : "fa-microphone"} text-lg`} aria-hidden />
          )}
        </button>
        <input
          type="text"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          disabled={disabled || busy}
          placeholder="Type a purchase…"
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] disabled:bg-slate-50"
        />
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => void runParseFromText()}
          className="shrink-0 rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: primary }}
        >
          Parse
        </button>
      </div>
      {recording ? (
        <p className="mt-2 text-[11px] font-semibold text-rose-600">Recording… tap the mic again to stop.</p>
      ) : null}
      {msg ? <p className="mt-2 text-[11px] text-slate-600">{msg}</p> : null}
    </div>
  );
}


