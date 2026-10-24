import { type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Building2, Car, CarFront, CheckCircle2, Edit3, Eye, EyeOff, HelpCircle, Home, KeyRound, LayoutDashboard, Loader2, LogOut, Megaphone, Menu, MessageSquare, ShieldCheck, Star, UserRound, Users, Wrench } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import AuditLogPage from "../components/AuditLogPage";
import { ToastProvider } from "../components/ToastProvider";
import type { AdminProfile, Page } from "../admin/types";
import { Dashboard, MessagesWatcher, PropertiesCount } from "../admin/dashboard";
import { PropertiesList } from "../admin/properties";
import { MessagesSection } from "../admin/messages";
import { VehiclesList } from "../admin/vehicles";
import { FaqsList, PromosList, ServicesList } from "../admin/content";
import { AdminsPage, NotificationsBell } from "../admin/accounts";
import { ReviewsPage } from "../admin/reviews";
import { ProfileModal } from "../admin/security";

// URL du site public : le BO est déployé séparément, ce lien n'est donc pas relatif.
const SITE_URL = import.meta.env.VITE_SITE_URL ?? "https://motom-rca.vercel.app";

export default function Admin() {
  const [page, setPage] = useState<Page>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChange, setPasswordChange] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNext, setPwdNext] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpEmailSent, setOtpEmailSent] = useState(true);
  const [error, setError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoAddVehicle, setAutoAddVehicle] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaRecoveryMode, setMfaRecoveryMode] = useState(false);

  const navItems: { id: Page; label: string; icon: ReactNode; group?: string; superadminOnly?: boolean }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "promos", label: "Promotions", icon: <Megaphone size={18} /> },
    { id: "properties-vente", label: "Biens à vendre", icon: <Home size={18} />, group: "Biens" },
    { id: "properties-location", label: "Biens à louer", icon: <KeyRound size={18} />, group: "Biens" },
    { id: "vehicles-vente", label: "Véhicules à vendre", icon: <Car size={18} />, group: "Véhicules" },
    { id: "vehicles-location", label: "Véhicules à louer", icon: <CarFront size={18} />, group: "Véhicules" },
    { id: "services", label: "Services", icon: <Wrench size={18} /> },
    { id: "faqs", label: "FAQ", icon: <HelpCircle size={18} /> },
    { id: "messages", label: "Messages", icon: <MessageSquare size={18} /> },
    { id: "admins", label: "Administrateurs", icon: <Users size={18} />, group: "Gestion" },
    { id: "reviews", label: "Avis", icon: <Star size={18} />, group: "Gestion" },
    { id: "audit", label: "Journal d'audit", icon: <ShieldCheck size={18} />, group: "Gestion", superadminOnly: true },
  ];

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((data: { authenticated?: boolean; admin?: AdminProfile | null }) => {
        if (data.authenticated) {
          setAuthenticated(true);
          setAdmin(data.admin ?? null);
          setPage("dashboard");
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.mfaRequired) {
        
        setMfaPending(true);
        setMfaCode("");
        setMfaError("");
        setPassword("");
        return;
      }
      if (res.ok && data.passwordChangeRequired) {
        // Connexion acceptée avec le mot de passe temporaire : aucune session
        // n'est encore ouverte, l'admin doit d'abord choisir un mot de passe.
        setPasswordChange(true);
        setPwdCurrent(password);
        setPwdNext("");
        setPwdConfirm("");
        setPwdError("");
        setError("");
        setPassword("");
        return;
      }
      if (res.ok && data.success) {
        setAuthenticated(true);
        setAdmin(data.admin ?? null);
        setPage("dashboard");
      } else {
        setError(data.error || "Identifiant ou mot de passe incorrect");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaError("");
    setMfaBusy(true);
    try {
      const res = await fetch("/api/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mfaRecoveryMode ? "recovery" : "verify",
          code: mfaCode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMfaPending(false);
        setMfaCode("");
        setAuthenticated(true);
        setAdmin(data.admin ?? null);
        setPage("dashboard");
      } else {
        setMfaError(data.error || "Code incorrect");
        setMfaCode("");
      }
    } catch {
      setMfaError("Erreur de connexion au serveur");
    } finally {
      setMfaBusy(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdBusy(true);
    try {
      const res = await fetch("/api/auth?step=change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: pwdCurrent,
          newPassword: pwdNext,
          confirmPassword: pwdConfirm,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.otpRequired) {
        setPasswordChange(false);
        setOtpStep(true);
        setOtpEmailSent(data.emailSent !== false);
        setOtpCode("");
        setOtpError("");
        setPwdCurrent("");
        setPwdNext("");
        setPwdConfirm("");
        return;
      }
      setPwdError(data.error || "Impossible de modifier le mot de passe");
    } catch {
      setPwdError("Erreur de connexion au serveur");
    } finally {
      setPwdBusy(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setOtpBusy(true);
    try {
      const res = await fetch("/api/auth?step=verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.mfaRequired) {
        setOtpStep(false);
        setOtpCode("");
        setMfaPending(true);
        setMfaCode("");
        setMfaError("");
        return;
      }
      if (res.ok && data.success) {
        setOtpStep(false);
        setAuthenticated(true);
        setAdmin(data.admin ?? null);
        setPage("dashboard");
        return;
      }
      setOtpError(data.error || "Code incorrect");
      setOtpCode("");
    } catch {
      setOtpError("Erreur de connexion au serveur");
    } finally {
      setOtpBusy(false);
    }
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    fetch("/api/auth", { method: "DELETE" }).catch(() => {});
    setAuthenticated(false);
    setPage("login");
  };

  if (!authenticated && mfaPending) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-5 shadow-xl shadow-gold/20">
              <ShieldCheck size={28} className="text-navy" />
            </div>
            <h1 className="font-display font-bold text-white text-2xl">
              Vérification en deux étapes
            </h1>
            <p className="text-white/50 text-sm mt-2">
              {mfaRecoveryMode
                ? "Saisissez l'un de vos codes de secours"
                : "Saisissez le code affiché par votre application"}
            </p>
          </div>

          <form
            onSubmit={handleMfaSubmit}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 space-y-4"
          >
            <input
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              autoFocus
              autoComplete="one-time-code"
              inputMode={mfaRecoveryMode ? "text" : "numeric"}
              placeholder={mfaRecoveryMode ? "XXXXX-XXXXX" : "123456"}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-center text-white text-lg tracking-[0.3em] placeholder:text-white/25 placeholder:tracking-normal focus:outline-none focus:border-gold transition-all"
            />

            {mfaError && (
              <p className="text-red-300 text-sm text-center">{mfaError}</p>
            )}

            <button
              type="submit"
              disabled={mfaBusy || !mfaCode.trim()}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gold hover:bg-gold-light text-navy disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {mfaBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {mfaBusy ? "Vérification…" : "Valider"}
            </button>

            <div className="flex flex-col gap-2 pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMfaRecoveryMode((v) => !v);
                  setMfaCode("");
                  setMfaError("");
                }}
                className="text-white/50 hover:text-gold text-xs transition-colors"
              >
                {mfaRecoveryMode
                  ? "Utiliser plutôt mon application d'authentification"
                  : "Je n'ai pas accès à mon application"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMfaPending(false);
                  setMfaRecoveryMode(false);
                  setMfaCode("");
                  setMfaError("");
                }}
                className="text-white/30 hover:text-white/60 text-xs transition-colors"
              >
                Revenir à la connexion
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (!authenticated && otpStep) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-5 shadow-xl shadow-gold/20">
              <ShieldCheck size={28} className="text-navy" />
            </div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold">
              Étape 2 sur 2
            </p>
            <h1 className="mt-2 font-display font-bold text-white text-2xl">
              Vérification par email
            </h1>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">
              Un code à 6 chiffres vient d'être envoyé à l'adresse de votre compte.
              Il est valable 10 minutes.
            </p>
          </div>

          <form
            onSubmit={handleOtpSubmit}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 space-y-4"
          >
            {!otpEmailSent && (
              <div className="flex items-start gap-2 text-amber-300 text-xs bg-amber-400/10 rounded-xl px-4 py-3">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                L'email n'a pas pu être envoyé (service email non configuré).
                Demandez le code au super administrateur.
              </div>
            )}

            <input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="123456"
              aria-label="Code de vérification"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-center text-white text-lg tracking-[0.4em] placeholder:text-white/25 placeholder:tracking-normal focus:outline-none focus:border-gold transition-all"
            />

            {otpError && <p className="text-red-300 text-sm text-center">{otpError}</p>}

            <button
              type="submit"
              disabled={otpBusy || otpCode.length !== 6}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gold hover:bg-gold-light text-navy disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {otpBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {otpBusy ? "Vérification…" : "Valider le code"}
            </button>

            <button
              type="button"
              onClick={() => {
                setOtpStep(false);
                setOtpCode("");
                setOtpError("");
              }}
              className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Revenir à la connexion
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!authenticated && passwordChange) {
    const rules = [
      { label: "8 caractères minimum", ok: pwdNext.length >= 8 },
      { label: "Une majuscule", ok: /[A-Z]/.test(pwdNext) },
      { label: "Un chiffre", ok: /[0-9]/.test(pwdNext) },
      { label: "Un caractère spécial", ok: /[^A-Za-z0-9]/.test(pwdNext) },
    ];
    const canSubmit =
      rules.every((r) => r.ok) && pwdNext === pwdConfirm && pwdCurrent.length > 0;

    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-5 shadow-xl shadow-gold/20">
              <KeyRound size={28} className="text-navy" />
            </div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold">
              Étape 1 sur 2
            </p>
            <h1 className="mt-2 font-display font-bold text-white text-2xl">
              Nouveau mot de passe
            </h1>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">
              Votre mot de passe temporaire est reconnu. Choisissez maintenant le mot
              de passe définitif de votre compte.
            </p>
          </div>

          <form
            onSubmit={handlePasswordChange}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 space-y-4"
          >
            <div>
              <label
                htmlFor="pwd-current"
                className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block"
              >
                Mot de passe temporaire
              </label>
              <input
                id="pwd-current"
                type="password"
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
                autoFocus
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="pwd-next"
                className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block"
              >
                Nouveau mot de passe
              </label>
              <input
                id="pwd-next"
                type="password"
                value={pwdNext}
                onChange={(e) => setPwdNext(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
              />
              <ul className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {rules.map((rule) => (
                  <li
                    key={rule.label}
                    className={`flex items-center gap-1.5 text-[11px] ${
                      rule.ok ? "text-emerald-300" : "text-white/35"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        rule.ok ? "bg-emerald-400" : "bg-white/25"
                      }`}
                    />
                    {rule.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label
                htmlFor="pwd-confirm"
                className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="pwd-confirm"
                type="password"
                value={pwdConfirm}
                onChange={(e) => setPwdConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
              />
              {pwdConfirm.length > 0 && pwdNext !== pwdConfirm && (
                <p className="mt-2 text-xs text-red-300">
                  Les deux mots de passe ne correspondent pas.
                </p>
              )}
            </div>

            {pwdError && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                <AlertCircle size={16} />
                {pwdError}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || pwdBusy}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold bg-gold hover:bg-gold-light text-navy disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {pwdBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {pwdBusy ? "Enregistrement…" : "Enregistrer et recevoir le code"}
            </button>

            <button
              type="button"
              onClick={() => {
                setPasswordChange(false);
                setPwdCurrent("");
                setPwdNext("");
                setPwdConfirm("");
                setPwdError("");
              }}
              className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Annuler et revenir à la connexion
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-5 shadow-xl shadow-gold/20">
              <Building2 size={28} className="text-navy" />
            </div>
            <h1 className="font-display font-bold text-white text-2xl">
              Administration
            </h1>
            <p className="text-white/50 text-sm mt-2">
              MOTOM — Accès réservé
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/40 ring-1 ring-white/5 space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                Email ou nom d'utilisateur
              </label>
              <div className="relative">
                <UserRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez le mot de passe"
                  className="w-full pl-4 pr-11 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-white/30 hover:text-gold transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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
              className="w-full bg-gold hover:bg-gold-light text-navy font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gold/20"
            >
              Se connecter
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-white/30">
            Mot de passe oublié ? Contactez le super administrateur : il génère un
            mot de passe temporaire à usage unique.
          </p>

          <a
            href={SITE_URL}
            className="block text-center text-white/30 text-xs mt-8 hover:text-white/50 transition-colors"
          >
            ← Retour au site
          </a>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
    <div className="min-h-screen bg-navy/95 flex">
      {}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-navy/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-gradient-to-b from-zinc-900 to-navy border-r border-white/[0.06] flex flex-col transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {}
        <div className="px-5 py-6 border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-navy font-bold text-sm shadow-lg shadow-gold/20">
              D
            </span>
            <div>
              <p className="font-display font-bold text-white text-sm leading-tight">
                MOTOM
              </p>
              <p className="text-[10px] text-white/30">Administration</p>
            </div>
          </Link>
        </div>

        {}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems
            .filter((item) => !item.superadminOnly || admin?.role === "superadmin")
            .map((item, i) => {
              const visibleItems = navItems.filter(
                (it) => !it.superadminOnly || admin?.role === "superadmin"
              );
              const isActive = page === item.id;
              const prev = i > 0 ? visibleItems[i - 1] : null;
              const showGroup = item.group && (!prev || prev.group !== item.group);
              return (
                <div key={item.id}>
                  {showGroup && (
                    <p className="px-3.5 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
                      {item.group}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      setPage(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-gradient-to-r from-gold/15 to-gold/5 text-gold shadow-sm"
                        : "text-white/50 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className={`transition-colors duration-200 ${
                      isActive ? "text-gold" : "text-white/30 group-hover:text-white/60"
                    }`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                    )}
                  </button>
                </div>
              );
            })}
        </nav>

        {}
        <div className="px-3 py-4 border-t border-white/[0.06] space-y-1.5">
          {admin && (
            <div className="px-2 pb-2">
              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 hover:border-gold/40 hover:bg-white/[0.07] transition-all group"
                title="Modifier mon profil"
              >
                {admin.avatar ? (
                  <img
                    src={admin.avatar}
                    alt={admin.username || "avatar"}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-gold/30 shrink-0"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center text-navy font-bold text-xs uppercase shrink-0">
                    {(admin.username || admin.email || "A").slice(0, 2)}
                  </span>
                )}
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-white truncate">
                    {admin.username || admin.email}
                  </p>
                  <p className="text-[10px] text-white/40 truncate">
                    {admin.role === "superadmin" ? "Superadmin" : "Admin"} · Modifier
                  </p>
                </div>
                <Edit3 size={13} className="ml-auto text-white/20 group-hover:text-gold transition-colors" />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-400/[0.08] transition-all"
          >
            <LogOut size={16} />
            <span>Déconnexion</span>
          </button>
          <div className="px-3.5 pt-2">
            <p className="text-[10px] text-white/20">
              <PropertiesCount />
            </p>
          </div>
        </div>
      </aside>

      {}
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter du panneau d'administration ?"
        confirmLabel="Se déconnecter"
        variant="danger"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          handleLogout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {}
        <header className="sticky top-0 z-30 lg:hidden bg-navy/80 backdrop-blur-xl border-b border-white/[0.06] px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white text-sm">MOTOM</span>
            <span className="text-[10px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
              Admin
            </span>
          </div>
          <div className="w-9 h-9" /> {}
        </header>

        {}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {page === "dashboard" && (
            <Dashboard
              onNavigate={setPage}
              admin={admin}
              onAddVehicle={() => {
                setPage("vehicles-vente");
                setAutoAddVehicle(true);
              }}
            />
          )}
          {(page === "properties-vente" || page === "properties-location") && (
            <PropertiesList
              defaultType={page === "properties-vente" ? "Vente" : "Location"}
            />
          )}
          {(page === "vehicles-vente" || page === "vehicles-location") && (
            <VehiclesList
              defaultType={page === "vehicles-vente" ? "Vente" : "Location"}
              autoOpenAdd={autoAddVehicle}
              onAutoAddHandled={() => setAutoAddVehicle(false)}
            />
          )}
          {page === "promos" && <PromosList />}
          {page === "services" && <ServicesList />}
          {page === "faqs" && <FaqsList />}
          {page === "messages" && <MessagesSection />}
          {page === "admins" && <AdminsPage me={admin} />}
          {page === "reviews" && <ReviewsPage />}
          {page === "audit" && admin?.role === "superadmin" && <AuditLogPage />}
        </main>
      </div>
      <MessagesWatcher />
      <NotificationsBell />
      <ProfileModal
        open={showProfileModal}
        admin={admin}
        onClose={() => setShowProfileModal(false)}
        onSaved={(updated) => {
          setAdmin((prev) => (prev ? { ...prev, ...updated } : prev));
          setShowProfileModal(false);
        }}
      />
    </div>
    </ToastProvider>
  );
}


