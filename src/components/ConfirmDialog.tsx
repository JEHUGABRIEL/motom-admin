import { AlertCircle, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
};

const variants = {
  danger: {
    iconBg: "bg-red-400/10",
    iconColor: "text-red-400",
    buttonBg: "bg-red-500 hover:bg-red-600",
  },
  warning: {
    iconBg: "bg-amber-400/10",
    iconColor: "text-amber-400",
    buttonBg: "bg-amber-500 hover:bg-amber-600",
  },
  info: {
    iconBg: "bg-blue-400/10",
    iconColor: "text-blue-400",
    buttonBg: "bg-blue-500 hover:bg-blue-600",
  },
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const v = variants[variant];

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl p-8 max-w-sm w-full border border-gold/20 shadow-2xl animate-fade-up relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="text-center">
          <div
            className={`w-14 h-14 rounded-full ${v.iconBg} flex items-center justify-center mx-auto mb-5`}
          >
            <AlertCircle size={24} className={v.iconColor} />
          </div>

          <h3 className="font-display font-semibold text-white text-lg mb-2">
            {title}
          </h3>

          <p className="text-sm text-white/50 mb-7 leading-relaxed">
            {message}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-all ${v.buttonBg}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
