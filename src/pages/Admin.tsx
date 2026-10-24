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
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotDone, setForgotDone] = useState(false);
  const [forgotError, setForgotError] = useState("");
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    try {
      const res = await fetch("/api/admins/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setForgotDone(true);
      } else {
        setForgotError(data.error || "Impossible d'envoyer le lien");
      }
    } catch {
      setForgotError("Erreur de connexion au serveur");
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

          {!forgotMode && (
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

            <button
              type="button"
              onClick={() => {
                setForgotMode(true);
                setForgotDone(false);
                setForgotError("");
              }}
              className="w-full text-center text-sm text-white/40 hover:text-gold transition-colors"
            >
              Mot de passe oublié ?
            </button>

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
          )}

          {forgotMode && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/30">
              {forgotDone ? (
                <div className="text-center">
                  <CheckCircle2 size={28} className="text-green-400 mx-auto mb-3" />
                  <p className="text-sm text-white/70 leading-relaxed">
                    Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé (valable 1 heure).
                  </p>
                  <button
                    onClick={() => setForgotMode(false)}
                    className="mt-5 w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-gold hover:bg-gold-light text-navy transition-all"
                  >
                    Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5 block">
                      Adresse email du compte
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
                      required
                      autoFocus
                    />
                  </div>
                  {forgotError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">
                      <AlertCircle size={16} />
                      {forgotError}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="w-full bg-gold hover:bg-gold-light text-navy font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gold/20"
                  >
                    Envoyer le lien
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotMode(false)}
                    className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors"
                  >
                    ← Retour à la connexion
                  </button>
                </form>
              )}
            </div>
          )}

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


