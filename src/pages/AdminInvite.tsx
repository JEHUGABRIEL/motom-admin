import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Building2, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, KeyRound, UserRound } from "lucide-react";


export default function AdminInvite() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const valid = token.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admins/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        navigate("/", { replace: true });
      } else {
        setError(data.error || "Impossible d'activer le compte");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full pl-10 pr-11 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all";

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-5 shadow-xl shadow-gold/20">
            <Building2 size={28} className="text-navy" />
          </div>
          <h1 className="font-display font-bold text-white text-2xl">
            Activation de votre compte
          </h1>
          <p className="text-white/50 text-sm mt-2">
            MOTOM — Espace d'administration
          </p>
        </div>

        {!valid ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <AlertCircle size={32} className="text-amber-400 mx-auto mb-4" />
            <p className="text-sm text-white/70">
              Lien d'invitation manquant ou incomplet. Vérifiez l'URL reçue par email.
            </p>
            <Link
              to="/"
              className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-semibold text-sm transition-all"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/30 space-y-5"
          >
            <div>
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ex. jean-admin"
                  className={inputCls}
                  required
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-white/30 mt-1.5">
                3 à 30 caractères : lettres, chiffres, _ . -
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                Mot de passe
              </label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  className={inputCls}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-gold transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Retapez le mot de passe"
                  className={inputCls}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 text-navy font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gold/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Activation…
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Activer mon compte
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}