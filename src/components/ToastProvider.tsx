import { useCallback, useState, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import {
  ToastContext,
  type ToastType,
  type ToastContextValue,
} from "./toast-context";

type Toast = {
  id: number;
  type: ToastType;
  msg: string;
};

const TOAST_DURATION = 4000;
const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={17} />,
  error: <AlertCircle size={17} />,
  info: <Info size={17} />,
};
const COLORS: Record<ToastType, string> = {
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  error: "bg-red-500/15 text-red-300 border-red-500/30",
  info: "bg-blue-500/15 text-blue-300 border-blue-500/30",
};


export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (type: ToastType, msg: string) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, msg }]);
      setTimeout(() => dismiss(id), TOAST_DURATION);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    notify,
    success: (msg) => notify("success", msg),
    error: (msg) => notify("error", msg),
    info: (msg) => notify("info", msg),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {}
      <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-2 w-[calc(100%-3rem)] max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md bg-navy/90 shadow-2xl animate-fade-up ${COLORS[t.type]}`}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
            <p className="text-sm flex-1">{t.msg}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

