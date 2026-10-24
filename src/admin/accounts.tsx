import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bell, CheckCircle2, Copy, KeyRound, Laptop, Loader2, LogIn, Monitor, Plus, Send, ShieldCheck, ShieldX, Smartphone, Tablet, Trash2, X } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/toast-context";
import type { AdminProfile, AdminRow } from "../admin/types";
import {
  useAdmins,
  useInviteAdmin,
  useUpdateAdmin,
  useDeleteAdmin,
  useResetAdminPassword,
  useLoginEvents,
} from "../lib/api";

export function AdminsPage({ me }: { me: AdminProfile | null }) {
  const { success, error } = useToast();
  const isSuper = me?.role === "superadmin";
  const adminsQuery = useAdmins();
  const admins = adminsQuery.data ?? [];
  const loading = adminsQuery.isLoading;
  const inviteAdmin = useInviteAdmin();
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();
  const resetPassword = useResetAdminPassword();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState<{ url: string; emailSent: boolean } | null>(null);
  const [inviteError, setInviteError] = useState("");
  const inviting = inviteAdmin.isPending;
  const [blockConfirm, setBlockConfirm] = useState<AdminRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<AdminRow | null>(null);
  const [resetConfirm, setResetConfirm] = useState<AdminRow | null>(null);
  const [resetResult, setResetResult] = useState<{ url: string; emailSent: boolean } | null>(null);
  const resetting = resetPassword.isPending;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (adminsQuery.isError) error("Erreur lors du chargement des admins");
  }, [adminsQuery.isError, error]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteResult(null);
    try {
      const data = await inviteAdmin.mutateAsync(inviteEmail);
      setInviteEmail("");
      setInviteResult({ url: data.inviteUrl, emailSent: data.emailSent });
      success("Invitation envoyée");
    } catch (err) {
      setInviteError(
        err instanceof Error && err.message
          ? err.message
          : "Impossible d'envoyer l'invitation",
      );
    }
  };

  const handleBlock = async (admin: AdminRow) => {
    try {
      await updateAdmin.mutateAsync({
        id: admin.id,
        status: admin.status === "blocked" ? "active" : "blocked",
      });
      success(admin.status === "blocked" ? "Admin débloqué" : "Admin bloqué");
      setBlockConfirm(null);
    } catch (err) {
      error(err instanceof Error && err.message ? err.message : "Action impossible");
      setBlockConfirm(null);
    }
  };

  const handleDelete = async (admin: AdminRow) => {
    try {
      await deleteAdmin.mutateAsync(admin.id);
      success("Admin supprimé");
      setDeleteConfirm(null);
    } catch (err) {
      error(err instanceof Error && err.message ? err.message : "Suppression impossible");
      setDeleteConfirm(null);
    }
  };

  const handleReset = async (admin: AdminRow) => {
    setResetResult(null);
    try {
      const data = await resetPassword.mutateAsync(admin.id);
      setResetResult({ url: data.resetUrl, emailSent: data.emailSent });
      success("Lien de réinitialisation envoyé");
    } catch (err) {
      error(
        err instanceof Error && err.message
          ? err.message
          : "Impossible de réinitialiser le mot de passe",
      );
      setResetConfirm(null);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      success("Lien copié");
    } catch {
      error("Impossible de copier");
    }
  };

  const statusBadge = (a: AdminRow) => {
    if (a.status === "invited") return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">En attente</span>;
    if (a.status === "blocked") return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-400/10 text-red-400 border border-red-400/20">Bloqué</span>;
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 border border-green-400/20">Actif</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-white text-xl sm:text-2xl">Administrateurs</h1>
          <p className="text-sm text-white/40 mt-1">
            {isSuper
              ? "Gérez les accès au back-office. Seul le superadmin peut inviter, bloquer ou supprimer."
              : "Vous consultez vos informations de compte."}
          </p>
        </div>
        {isSuper && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-semibold text-sm transition-all"
          >
            <Plus size={16} />
            Inviter un admin
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Loader2 size={20} className="animate-spin mr-2" /> Chargement…
        </div>
      ) : (
        <div className="grid gap-3">
          {admins.map((a) => {
            const isSelf = me?.id === a.id;
            return (
              <div
                key={a.id}
                className={`bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 sm:p-5 flex items-center gap-4 ${
                  isSelf ? "ring-1 ring-gold/20" : ""
                }`}
              >
                <span className="w-11 h-11 rounded-full bg-gradient-to-br from-navy-light to-navy-dark border border-white/10 flex items-center justify-center text-white font-bold text-sm uppercase shrink-0">
                  {(a.username || a.email).slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white text-sm truncate">
                      {a.username || "—"}
                    </p>
                    {a.role === "superadmin" && (
                      <ShieldCheck size={14} className="text-gold" />
                    )}
                    {isSelf && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                        Vous
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate">{a.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {statusBadge(a)}
                    <span className="text-[10px] text-white/30">
                      {a.role === "superadmin" ? "Superadmin" : "Admin"}
                    </span>
                    {a.createdAt && (
                      <span className="text-[10px] text-white/30">
                        · depuis le {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isSuper && a.role !== "superadmin" && (
                    <>
                      <button
                        onClick={() => setResetConfirm(a)}
                        className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-blue-400/10 text-white/50 hover:text-blue-400 border border-white/[0.06] flex items-center justify-center transition-all"
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound size={16} />
                      </button>
                      <button
                        onClick={() => setBlockConfirm(a)}
                        className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-amber-400/10 text-white/50 hover:text-amber-400 border border-white/[0.06] flex items-center justify-center transition-all"
                        title={a.status === "blocked" ? "Débloquer" : "Bloquer"}
                      >
                        {a.status === "blocked" ? <ShieldCheck size={16} /> : <ShieldX size={16} />}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(a)}
                        className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-red-400/10 text-white/50 hover:text-red-400 border border-white/[0.06] flex items-center justify-center transition-all"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          {admins.length === 0 && (
            <div className="text-center py-16 text-white/40 text-sm">
              Aucun administrateur pour le moment.
            </div>
          )}
        </div>
      )}

      
      {showInvite && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-navy-light rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-fade-up relative">
            <button
              onClick={() => { setShowInvite(false); setInviteResult(null); setInviteError(""); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-semibold text-white text-lg mb-1">Inviter un administrateur</h3>
            <p className="text-sm text-white/50 mb-6">
              Un email avec un lien d'activation sera envoyé à l'adresse indiquée.
            </p>

            {!inviteResult ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="admin@exemple.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-all"
                    required
                    autoFocus
                  />
                </div>
                {inviteError && (
                  <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                    <AlertCircle size={16} />
                    {inviteError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 text-navy font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  {inviting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {inviting ? "Envoi…" : "Envoyer l'invitation"}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {inviteResult.emailSent ? (
                  <div className="flex items-start gap-2 text-green-400 text-sm bg-green-400/10 rounded-xl px-4 py-3">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                    Email envoyé. L'invité recevra le lien d'activation.
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-amber-400 text-sm bg-amber-400/10 rounded-xl px-4 py-3">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    Email non envoyé (service non configuré ou domaine non vérifié). Transmettez le lien manuellement :
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-white/60 break-all flex-1">{inviteResult.url}</p>
                  <button
                    onClick={() => copyLink(inviteResult.url)}
                    className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/50 hover:text-gold flex items-center justify-center shrink-0 transition-colors"
                    title="Copier le lien"
                  >
                    {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <button
                  onClick={() => { setShowInvite(false); setInviteResult(null); setInviteError(""); }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      
      {resetConfirm && !resetResult && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl p-8 max-w-md w-full border border-gold/20 shadow-2xl animate-fade-up relative">
            <button
              onClick={() => { setResetConfirm(null); setResetResult(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-400/10 flex items-center justify-center mx-auto mb-5">
                <KeyRound size={24} className="text-blue-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">
                Réinitialiser le mot de passe ?
              </h3>
              <p className="text-sm text-white/50 mb-7 leading-relaxed">
                Un lien de réinitialisation (valable 1 heure) sera envoyé à « {resetConfirm.email} ». L'admin pourra choisir un nouveau mot de passe.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setResetConfirm(null); setResetResult(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleReset(resetConfirm)}
                  disabled={resetting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white transition-all flex items-center justify-center gap-2"
                >
                  {resetting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  {resetting ? "Envoi…" : "Envoyer le lien"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {resetResult && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl p-8 max-w-md w-full border border-gold/20 shadow-2xl animate-fade-up relative">
            <button
              onClick={() => { setResetConfirm(null); setResetResult(null); }}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
            <h3 className="font-display font-semibold text-white text-lg mb-4">Réinitialisation demandée</h3>
            {resetResult.emailSent ? (
              <div className="flex items-start gap-2 text-green-400 text-sm bg-green-400/10 rounded-xl px-4 py-3 mb-4">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                Email envoyé. L'admin recevra le lien de réinitialisation (valable 1 heure).
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-400 text-sm bg-amber-400/10 rounded-xl px-4 py-3 mb-4">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                Email non envoyé (service non configuré ou domaine non vérifié). Transmettez le lien manuellement :
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl p-3 mb-6">
              <p className="text-xs text-white/60 break-all flex-1">{resetResult.url}</p>
              <button
                onClick={() => copyLink(resetResult.url)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/10 text-white/50 hover:text-gold flex items-center justify-center shrink-0 transition-colors"
                title="Copier le lien"
              >
                {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
              </button>
            </div>
            <button
              onClick={() => { setResetConfirm(null); setResetResult(null); }}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      
      <ConfirmDialog
        open={!!blockConfirm}
        title={blockConfirm?.status === "blocked" ? "Débloquer cet admin ?" : "Bloquer cet admin ?"}
        message={
          blockConfirm
            ? blockConfirm.status === "blocked"
              ? `Réactiver l'accès de « ${blockConfirm.email} » au back-office ?`
              : `« ${blockConfirm.email} » perdra immédiatement l'accès au back-office.`
            : ""
        }
        confirmLabel={blockConfirm?.status === "blocked" ? "Débloquer" : "Bloquer"}
        variant="warning"
        onConfirm={() => blockConfirm && handleBlock(blockConfirm)}
        onCancel={() => setBlockConfirm(null)}
      />

      
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Supprimer cet admin ?"
        message={
          deleteConfirm
            ? `Le compte de « ${deleteConfirm.email} » sera définitivement supprimé. Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}


export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const lastSeenRef = useRef<number>(Date.now());
  const { data: events = [] } = useLoginEvents();

  useEffect(() => {
    if (
      events.some((e) => new Date(e.createdAt).getTime() > lastSeenRef.current)
    ) {
      setHasNew(true);
    }
  }, [events]);

  const markSeen = () => {
    lastSeenRef.current = Date.now();
    setHasNew(false);
  };

  const deviceIcon = (device: string) => {
    const d = device.toLowerCase();
    if (d.includes("iphone") || d.includes("mobile") || d.includes("android")) return <Smartphone size={14} />;
    if (d.includes("tablet") || d.includes("ipad")) return <Tablet size={14} />;
    if (d.includes("mac") || d.includes("linux")) return <Laptop size={14} />;
    return <Monitor size={14} />;
  };

  return (
    <div className="fixed top-4 right-4 z-[60]">
      <button
        onClick={() => {
          setOpen((o) => !o);
          markSeen();
        }}
        className="relative w-10 h-10 rounded-xl bg-navy-light/80 backdrop-blur-xl border border-white/10 text-white/70 hover:text-gold hover:border-gold/40 shadow-lg shadow-black/20 flex items-center justify-center transition-all"
        aria-label="Notifications de connexion"
      >
        <Bell size={18} />
        {hasNew && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-navy" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-navy-light to-navy-dark border border-gold/20 shadow-2xl p-4 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-white text-sm">
                Connexions récentes
              </h3>
              <span className="text-[10px] text-white/40">24 dernières heures</span>
            </div>
            {events.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">
                Aucune connexion détectée pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {events.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3">
                    <span className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0">
                      {deviceIcon(e.device)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white flex items-center gap-1.5">
                        <LogIn size={12} className="text-gold" />
                        Nouvelle connexion
                      </p>
                      <p className="text-[11px] text-white/60 mt-0.5">
                        {e.device || "Appareil inconnu"} · {e.ip || "IP inconnue"}
                      </p>
                      <p className="text-[11px] text-white/40">
                        {e.username || e.email}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        {new Date(e.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}


