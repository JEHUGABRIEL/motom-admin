import { ArrowLeft as ArrowLeftIcon, Edit3, Megaphone, Trash2 } from "lucide-react";

export function DetailsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs font-semibold text-white/40 uppercase tracking-wider shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-white text-right">{children}</span>
    </div>
  );
}
export function DetailsPageShell({
  title,
  onClose,
  onEdit,
  onDelete,
  onTogglePromo,
  isPromo,
  promoPaused,
  children,
}: {
  title: string;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePromo?: () => void;
  isPromo?: boolean;
  promoPaused?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/60 hover:text-gold hover:border-gold/40 transition-all"
            aria-label="Retour"
          >
            <ArrowLeftIcon size={17} />
          </button>
          <h2 className="font-display font-bold text-white text-2xl">{title}</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {onTogglePromo && (
            <button
              onClick={onTogglePromo}
              className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl font-semibold transition-all ${
                isPromo
                  ? "bg-gold/15 text-gold hover:bg-gold/25"
                  : "bg-white/[0.06] text-white/70 hover:bg-gold/15 hover:text-gold"
              }`}
            >
              <Megaphone size={15} />
              {isPromo ? (promoPaused ? "Reprendre la promo" : "Retirer la promo") : "Mettre en promo"}
            </button>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
            >
              <Edit3 size={15} />
              Modifier
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center gap-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
            >
              <Trash2 size={15} />
              Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-7">
        {children}
      </div>
    </div>
  );
}


