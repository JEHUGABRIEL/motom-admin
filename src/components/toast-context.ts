import { createContext, useContext } from "react";

export type ToastType = "success" | "error" | "info";

export type ToastContextValue = {
  notify: (type: ToastType, msg: string) => void;
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
