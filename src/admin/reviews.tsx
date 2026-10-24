import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Star, Trash2, X } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/toast-context";
import {
  useAdminReviews,
  useCreateReview,
  useSetReviewStatus,
  useDeleteReview,
} from "../lib/api";
import type { Review } from "../admin/types";

export function AddReviewForm({ onAdded }: { onAdded: () => void }) {
  const { success, error } = useToast();
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const createReview = useCreateReview();
  const saving = createReview.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReview.mutateAsync({ author, rating, comment });
      success("Témoignage publié");
      setAuthor("");
      setRating(5);
      setComment("");
    } catch (err) {
      error(err instanceof Error ? err.message : "Ajout impossible");
    } finally {
      onAdded();
    }
  };

  const inputCls =
    "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all";

  return (
    <form onSubmit={submit} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 space-y-4">
      <p className="text-sm font-semibold text-white">Ajouter un témoignage client</p>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4">
        <input
          required
          maxLength={80}
          placeholder="Nom du client (ex. Jean-Marc K.)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className={inputCls}
        />
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Note">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
              onClick={() => setRating(i)}
            >
              <Star size={20} className={i <= rating ? "text-gold fill-gold" : "text-white/20"} />
            </button>
          ))}
        </div>
      </div>
      <textarea
        required
        rows={3}
        maxLength={1000}
        placeholder="Le témoignage, tel que le client l'a formulé"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className={`${inputCls} resize-none`}
      />
      <button
        type="submit"
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-gold text-navy text-sm font-semibold hover:bg-gold-light disabled:opacity-60 transition-all"
      >
        {saving ? "Publication…" : "Publier le témoignage"}
      </button>
    </form>
  );
}

export function ReviewsPage() {
  const { success, error } = useToast();
  const reviewsQuery = useAdminReviews();
  const reviews = reviewsQuery.data ?? [];
  const loading = reviewsQuery.isLoading;
  const setReviewStatus = useSetReviewStatus();
  const deleteReview = useDeleteReview();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<Review | null>(null);

  useEffect(() => {
    if (reviewsQuery.isError) error("Impossible de charger les avis");
  }, [reviewsQuery.isError, error]);

  const updateStatus = async (review: Review, status: "approved" | "rejected") => {
    try {
      await setReviewStatus.mutateAsync({ id: review.id, status });
      success(status === "approved" ? "Avis publié" : "Avis rejeté");
    } catch (err) {
      error(err instanceof Error && err.message ? err.message : "Action impossible");
    }
  };

  const remove = async (review: Review) => {
    try {
      await deleteReview.mutateAsync(review.id);
      success("Avis supprimé");
      setDeleteConfirm(null);
    } catch (err) {
      error(err instanceof Error && err.message ? err.message : "Suppression impossible");
      setDeleteConfirm(null);
    }
  };

  const filtered = reviews.filter((r) => filter === "all" || r.status === filter);
  const counts = {
    all: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: reviews.filter((r) => r.status === "approved").length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
  };

  const filterBtn = (key: "all" | "pending" | "approved" | "rejected", label: string) => (
    <button
      key={key}
      onClick={() => setFilter(key)}
      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
        filter === key
          ? "bg-gold text-navy"
          : "bg-white/[0.04] text-white/50 hover:text-white hover:bg-white/[0.08]"
      }`}
    >
      {label} <span className="opacity-60">({counts[key]})</span>
    </button>
  );

  const stars = (n: number) => (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={13} className={i <= n ? "text-gold fill-gold" : "text-white/20"} />
      ))}
    </span>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-white text-xl sm:text-2xl">Avis clients</h1>
        <p className="text-sm text-white/40 mt-1">
          Les avis publiés apparaissent sur l'accueil. Saisissez ici les témoignages reçus de vos clients (WhatsApp, téléphone, à l'agence).
        </p>
      </div>

      <AddReviewForm onAdded={() => reviewsQuery.refetch()} />

      <div className="flex items-center gap-2 flex-wrap">
        {filterBtn("all", "Tous")}
        {filterBtn("pending", "À valider")}
        {filterBtn("approved", "Publiés")}
        {filterBtn("rejected", "Rejetés")}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/40 text-sm">
          Aucun avis dans cette catégorie.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  {r.avatar ? (
                    <img src={r.avatar} alt={r.author} className="w-11 h-11 rounded-full object-cover ring-2 ring-gold/40 shrink-0" />
                  ) : (
                    <span className="w-11 h-11 rounded-full bg-gold/15 text-gold font-semibold text-sm flex items-center justify-center shrink-0">
                      {r.author.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="font-semibold text-white text-sm">{r.author}</p>
                      {stars(r.rating)}
                    </div>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  r.status === "approved"
                    ? "bg-green-400/10 text-green-400 border-green-400/20"
                    : r.status === "rejected"
                      ? "bg-red-400/10 text-red-400 border-red-400/20"
                      : "bg-amber-400/10 text-amber-400 border-amber-400/20"
                }`}>
                  {r.status === "approved" ? "Publié" : r.status === "rejected" ? "Rejeté" : "À valider"}
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed mt-3">{r.comment}</p>
              <div className="flex items-center gap-2 mt-4">
                {r.status !== "approved" && (
                  <button
                    onClick={() => updateStatus(r, "approved")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/15 text-green-400 text-xs font-medium hover:bg-green-500/25 transition-all"
                  >
                    <CheckCircle2 size={14} /> Publier
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => updateStatus(r, "rejected")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/15 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-all"
                  >
                    <X size={14} /> Rejeter
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirm(r)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Supprimer cet avis ?"
        message={deleteConfirm ? `L'avis de « ${deleteConfirm.author} » sera définitivement supprimé.` : ""}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => deleteConfirm && remove(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}


