import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Copy, KeyRound, Loader2, ShieldCheck, Smartphone, Upload, X } from "lucide-react";
import { useToast } from "../components/toast-context";
import { loadCloudinaryWidgetScript, openSignedUploadWidget } from "../lib/cloudinary";
import type { AdminProfile } from "../admin/types";

export function MfaSection() {
  const { success, error } = useToast();
  const [status, setStatus] = useState<{ enabled: boolean; recoveryCodesLeft: number } | null>(null);
  const [setup, setSetup] = useState<{ qrCode: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [confirming, setConfirming] = useState<null | "disable" | "regenerate">(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mfa");
      if (res.ok) setStatus(await res.json());
    } catch {
      
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (action: string, payload: Record<string, unknown> = {}) => {
    const res = await fetch("/api/mfa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Opération impossible");
    return data;
  };

  const run = async (fn: () => Promise<void>, fallback: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      error(e instanceof Error ? e.message : fallback);
    } finally {
      setBusy(false);
    }
  };

  const startSetup = () =>
    run(async () => {
      const data = await call("setup");
      setSetup({ qrCode: data.qrCode, secret: data.secret });
      setCode("");
    }, "Impossible de démarrer la configuration");

  const activate = () =>
    run(async () => {
      const data = await call("activate", { code });
      setCodes(data.recoveryCodes);
      setSetup(null);
      setCode("");
      success("Double authentification activée");
      await load();
    }, "Code incorrect");

  const disable = () =>
    run(async () => {
      await call("disable", { password });
      setPassword("");
      setConfirming(null);
      setCodes(null);
      success("Double authentification désactivée");
      await load();
    }, "Mot de passe incorrect");

  const regenerate = () =>
    run(async () => {
      const data = await call("recovery-codes", { password });
      setCodes(data.recoveryCodes);
      setPassword("");
      setConfirming(null);
      success("Nouveaux codes de secours générés");
      await load();
    }, "Mot de passe incorrect");

  const copyCodes = () => {
    if (!codes) return;
    navigator.clipboard?.writeText(codes.join("\n")).then(
      () => success("Codes copiés"),
      () => error("Copie impossible")
    );
  };

  const field =
    "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-all";

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck size={16} className="text-gold" />
        <h4 className="font-display font-semibold text-white text-sm">
          Vérification en deux étapes
        </h4>
        {status?.enabled && (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300">
            Active
          </span>
        )}
      </div>

      {codes && (
        <div className="mb-4 rounded-xl bg-gold/10 border border-gold/30 p-4">
          <p className="text-xs text-gold font-semibold mb-2">Conservez ces codes maintenant</p>
          <p className="text-[11px] text-white/60 mb-3">
            Ils ne seront plus jamais affichés. Chacun ne fonctionne qu'une fois et permet de
            vous connecter si vous perdez votre téléphone.
          </p>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {codes.map((c) => (
              <code key={c} className="text-xs text-white bg-white/10 rounded-lg px-2 py-1.5 text-center tracking-wider">
                {c}
              </code>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={copyCodes} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all">
              <Copy size={13} /> Copier
            </button>
            <button type="button" onClick={() => setCodes(null)} className="flex-1 px-3 py-2 rounded-lg bg-gold hover:bg-gold-light text-navy text-xs font-semibold transition-all">
              J'ai noté ces codes
            </button>
          </div>
        </div>
      )}

      {!status?.enabled && !setup && !codes && (
        <>
          <p className="text-[11px] text-white/40 mb-3">
            Un code à six chiffres sera demandé à chaque connexion, en plus du mot de passe.
            Nécessite une application comme Google Authenticator ou Authy.
          </p>
          <button type="button" onClick={startSetup} disabled={busy} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white text-sm font-medium transition-all">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Smartphone size={14} />}
            Activer
          </button>
        </>
      )}

      {setup && (
        <div className="space-y-3">
          <p className="text-[11px] text-white/50">
            1. Scannez ce QR code avec votre application d'authentification.
          </p>
          <div className="flex justify-center">
            <img src={setup.qrCode} alt="QR code de configuration" className="rounded-xl bg-white p-2" width={200} height={200} />
          </div>
          <details className="text-[11px] text-white/40">
            <summary className="cursor-pointer hover:text-white/60">Impossible de scanner ?</summary>
            <p className="mt-2">Saisissez cette clé manuellement :</p>
            <code className="block mt-1 text-white/70 bg-white/5 rounded-lg px-2 py-1.5 break-all tracking-wider">
              {setup.secret}
            </code>
          </details>
          <p className="text-[11px] text-white/50">2. Saisissez le code affiché pour confirmer.</p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            placeholder="123456"
            className={`${field} text-center tracking-[0.3em]`}
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => { setSetup(null); setCode(""); }} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">
              Annuler
            </button>
            <button type="button" onClick={activate} disabled={busy || code.trim().length < 6} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gold hover:bg-gold-light text-navy disabled:opacity-60 transition-all flex items-center justify-center gap-2">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              Confirmer
            </button>
          </div>
        </div>
      )}

      {status?.enabled && !codes && (
        <div className="space-y-3">
          <p className="text-[11px] text-white/40">
            Codes de secours restants :{" "}
            <span className="text-white/70 font-semibold">{status.recoveryCodesLeft}</span>
            {status.recoveryCodesLeft <= 2 && (
              <span className="text-amber-300"> — pensez à en régénérer</span>
            )}
          </p>
          {confirming === null ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirming("regenerate")} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium bg-white/10 text-white hover:bg-white/20 transition-all">
                <KeyRound size={13} /> Nouveaux codes
              </button>
              <button type="button" onClick={() => setConfirming("disable")} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-medium bg-red-500/15 text-red-200 hover:bg-red-500/25 transition-all">
                Désactiver
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-white/50">
                {confirming === "disable"
                  ? "Confirmez la désactivation avec votre mot de passe :"
                  : "Confirmez avec votre mot de passe. Les anciens codes cesseront de fonctionner."}
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Mot de passe"
                className={field}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setConfirming(null); setPassword(""); }} className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all">
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirming === "disable" ? disable : regenerate}
                  disabled={busy || !password}
                  className={`flex-1 px-3 py-2 rounded-lg disabled:opacity-50 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    confirming === "disable"
                      ? "bg-red-500/20 hover:bg-red-500/30 text-red-200"
                      : "bg-gold hover:bg-gold-light text-navy"
                  }`}
                >
                  {busy && <Loader2 size={13} className="animate-spin" />}
                  {confirming === "disable" ? "Désactiver" : "Régénérer"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ProfileModal({
  open,
  admin,
  onClose,
  onSaved,
}: {
  open: boolean;
  admin: AdminProfile | null;
  onClose: () => void;
  onSaved: (updated: Partial<AdminProfile>) => void;
}) {
  const { success, error } = useToast();
  const [username, setUsername] = useState(admin?.username ?? "");
  const [avatar, setAvatar] = useState(admin?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setUsername(admin?.username ?? "");
      setAvatar(admin?.avatar ?? "");
    }
  }, [open, admin]);

  useEffect(() => {
    loadCloudinaryWidgetScript();
  }, []);

  const pickAvatar = async () => {
    if (!window.cloudinary) {
      error("Le téléchargeur d'images n'est pas encore prêt. Réessayez dans un instant.");
      return;
    }
    setUploading(true);
    try {
      await openSignedUploadWidget((url) => {
        setAvatar(url);
        success("Photo téléchargée. Pensez à enregistrer.");
      });
    } catch (e) {
      error(e instanceof Error ? e.message : "Impossible de télécharger la photo");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admins/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatar }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        success("Profil mis à jour");
        onSaved(data.admin);
      } else {
        error(data.error || "Impossible d'enregistrer les modifications");
      }
    } catch {
      error("Erreur de connexion au serveur");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !admin) return null;

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl p-8 max-w-md w-full border border-gold/20 shadow-2xl animate-fade-up relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>

        <h3 className="font-display font-semibold text-white text-lg mb-6">Mon profil</h3>

        <form onSubmit={save} className="space-y-5">
          <div className="flex flex-col items-center gap-3">
            {avatar ? (
              <img src={avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-gold/40" />
            ) : (
              <span className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-navy font-bold text-xl uppercase">
                {(admin.username || admin.email || "A").slice(0, 2)}
              </span>
            )}
            <button
              type="button"
              onClick={pickAvatar}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-60 text-white text-xs font-medium transition-all"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {avatar ? "Changer la photo" : "Ajouter une photo"}
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Nom d'utilisateur
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre nom d'utilisateur"
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold transition-all"
            />
            <p className="text-[11px] text-white/30 mt-1.5">
              3 à 30 caractères : lettres, chiffres, _ . -
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3">
            <p className="text-[11px] text-white/40">
              Email du compte : <span className="text-white/70">{admin.email}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-gold hover:bg-gold-light text-navy disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>

        <MfaSection />
      </div>
    </div>
  );
}

