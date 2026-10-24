import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, Building2, Car, CheckCircle2, DollarSign, Home, KeyRound, LayoutDashboard, MapPin, Megaphone, MessageSquare, PieChart, Plus, Send, Sparkles, Star, TrendingUp } from "lucide-react";
import { formatPrice } from "../data/properties";
import { useCreateMessage, useCreateProperty, useMessages, useProperties, useStats } from "../lib/api";
import { useToast } from "../components/toast-context";
import type { AdminProfile, Page } from "../admin/types";
import { PropertyFormModal } from "../admin/properties";
import { MessageComposeModal } from "../admin/messages";

export function MessagesWatcher() {
  const { info } = useToast();
  const seenRef = useRef<Set<string>>(new Set());
  const { data: msgs = [] } = useMessages("all", { refetchInterval: 20_000 });

  useEffect(() => {
    if (msgs.length === 0) return;
    if (seenRef.current.size === 0) {
      msgs.forEach((m) => seenRef.current.add(m.id));
      return;
    }
    const fresh = msgs.filter((m) => !seenRef.current.has(m.id) && !m.read);
    fresh.forEach((m) => {
      seenRef.current.add(m.id);
      info(`📩 Nouveau message de ${m.name} — ${m.subject}`);
    });
  }, [msgs, info]);

  return null;
}


export function PropertiesCount() {
  const { data } = useProperties();
  return <>{data?.length ?? 0} biens enregistrés</>;
}


export function Dashboard({
  onNavigate,
  admin,
  onAddVehicle,
}: {
  onNavigate: (p: Page) => void;
  admin: AdminProfile | null;
  onAddVehicle: () => void;
}) {
  const { data: properties = [] } = useProperties();
  const { data: msgs = [] } = useMessages();
  const { data: serverStats } = useStats();
  const createProperty = useCreateProperty();
  const createMessage = useCreateMessage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const total = properties.length;
  const sales = properties.filter((p) => p.type === "Vente").length;
  const rentals = properties.filter((p) => p.type === "Location").length;
  const cities = [...new Set(properties.map((p) => p.city))].length;
  const unread = msgs.filter((m) => !m.read).length;
  const totalValue = properties.reduce((s, p) => s + p.price, 0);
  const avgPrice = total > 0 ? Math.round(totalValue / total) : 0;

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const stats = [
    { label: "Total biens", value: total, icon: Building2, accent: "text-amber-400", bar: "from-amber-500 to-yellow-400", ring: "ring-amber-500/20", sub: `${cities} ville${cities > 1 ? "s" : ""} couverte${cities > 1 ? "s" : ""}` },
    { label: "À vendre", value: sales, icon: Home, accent: "text-emerald-400", bar: "from-emerald-500 to-green-400", ring: "ring-emerald-500/20", sub: total > 0 ? `${Math.round((sales / total) * 100)}% du portefeuille` : "—" },
    { label: "À louer", value: rentals, icon: KeyRound, accent: "text-blue-400", bar: "from-blue-500 to-cyan-400", ring: "ring-blue-500/20", sub: total > 0 ? `${Math.round((rentals / total) * 100)}% du portefeuille` : "—" },
    { label: "Messages non lus", value: unread, icon: MessageSquare, accent: "text-purple-400", bar: "from-purple-500 to-pink-400", ring: "ring-purple-500/20", sub: unread > 0 ? "À traiter" : "Boîte à jour" },
  ];

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    properties.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [properties]);

  const byCity = useMemo(() => {
    const map: Record<string, number> = {};
    properties.forEach((p) => {
      map[p.city] = (map[p.city] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [properties]);

  const topValue = useMemo(() => {
    return [...properties].sort((a, b) => b.price - a.price).slice(0, 4);
  }, [properties]);

  const recent = useMemo(() => {
    return [...properties].reverse().slice(0, 5);
  }, [properties]);

  const recentMsgs = useMemo(() => {
    return [...msgs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
  }, [msgs]);

  const typePct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const salesPct = typePct(sales);
  const rentalsPct = typePct(rentals);
  const maxCity = byCity[0]?.[1] ?? 1;

  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const name = admin?.username || admin?.email?.split("@")[0] || "";
    const variants = [
      ["Bonjour", "content de vous revoir"],
      ["Bonjour", "ravi de vous accueillir"],
      ["Hello", "c'est toujours un plaisir"],
      ["Salut", "belle journée qui s'annonce"],
      ["Bonjour", "on se remet au travail ?"],
    ] as const;
    const night = [
      ["Bonsoir", "belle soirée en perspective"],
      ["Bonne nuit", "merci pour votre travail"],
      ["Bonsoir", "bienvenue à cette heure tardive"],
      ["Bonsoir", "heureux de vous voir"],
    ] as const;
    const pool = hour >= 19 || hour < 5 ? night : variants;
    
    const idx = Math.floor((Date.now() / 1000 / 15) % pool.length);
    const [salut, detail] = pool[idx];
    const emoji = hour >= 19 || hour < 5 ? "🌙" : "☀️";
    return { title: `${salut}${name ? ", " + name : ""} ${emoji}`, detail };
  }, [admin]);

  return (
    <div className="animate-fade-in">
      {}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-up ${
          toast.type === "success"
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-white text-2xl sm:text-3xl">
            {greeting.title}
          </h1>
          <p className="text-sm text-white/40 mt-1.5 capitalize">
            {greeting.detail} · {today}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <DollarSign size={15} className="text-gold" />
            <span className="text-xs text-white/50">
              Portefeuille : <span className="text-gold font-semibold">{(totalValue / 1_000_000).toFixed(0)} M FCFA</span>
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <Plus size={15} />
            Ajouter un bien
          </button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => {
          const maxStat = Math.max(sales, rentals, 1);
          const share = s.label === "À vendre" ? sales / maxStat : s.label === "À louer" ? rentals / maxStat : 1;
          return (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300 group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] ring-1 ${s.ring} ${s.accent}`}>
                  <s.icon size={20} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  KPI 0{i + 1}
                </span>
              </div>
              <p className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight tabular-nums">
                {s.value}
              </p>
              <p className="text-xs text-white/40 mt-1 font-medium">{s.label}</p>
              <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${s.bar} transition-all duration-700 ease-out`}
                  style={{ width: `${Math.max(share * 100, 8)}%` }}
                />
              </div>
              <p className="text-[10px] text-white/25 mt-2">{s.sub}</p>
            </div>
          );
        })}
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total véhicules",
            value: serverStats?.vehicles.total ?? "—",
            icon: Car,
            accent: "text-sky-400",
            bar: "from-sky-500 to-cyan-400",
            ring: "ring-sky-500/20",
            sub: serverStats ? `${serverStats.vehicles.sale} à vendre · ${serverStats.vehicles.rental} à louer` : "Chargement…",
          },
          {
            label: "Véhicules en vedette",
            value: serverStats?.vehicles.featured ?? "—",
            icon: Sparkles,
            accent: "text-amber-400",
            bar: "from-amber-500 to-yellow-400",
            ring: "ring-amber-500/20",
            sub: "Mis en avant sur le site",
          },
          {
            label: "Avis clients",
            value: serverStats?.reviews.total ?? "—",
            icon: Star,
            accent: "text-rose-400",
            bar: "from-rose-500 to-pink-400",
            ring: "ring-rose-500/20",
            sub: serverStats ? `${serverStats.reviews.approved} publiés` : "Chargement…",
          },
          {
            label: "Avis en attente",
            value: serverStats?.reviews.pending ?? "—",
            icon: MessageSquare,
            accent: "text-orange-400",
            bar: "from-orange-500 to-amber-400",
            ring: "ring-orange-500/20",
            sub: serverStats && serverStats.reviews.pending > 0 ? "À modérer" : "Tout est à jour",
          },
        ].map((s, i) => (
          <div
            key={s.label}
            className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04] ring-1 ${s.ring} ${s.accent}`}>
                <s.icon size={20} />
              </span>
            </div>
            <p className="font-display font-bold text-white text-2xl sm:text-3xl tracking-tight tabular-nums">
              {s.value}
            </p>
            <p className="text-xs text-white/40 mt-1 font-medium">{s.label}</p>
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full rounded-full bg-gradient-to-r ${s.bar} transition-all duration-700 ease-out`} style={{ width: "100%" }} />
            </div>
            <p className="text-[10px] text-white/25 mt-2">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
                <PieChart size={14} className="text-gold" />
              </span>
              <h3 className="font-display font-semibold text-white text-sm">
                Performance du portefeuille
              </h3>
            </div>
            <button
              onClick={() => onNavigate("promos")}
              className="text-[11px] font-medium text-gold/70 hover:text-gold transition-colors"
            >
              Gérer les promotions →
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {}
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
                {sales > 0 && (
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#10b981" strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${salesPct * 3.6} ${360 - salesPct * 3.6}`}
                    transform="rotate(-90 18 18)"
                  />
                )}
                {rentals > 0 && (
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round"
                    strokeDasharray={`${rentalsPct * 3.6} ${360 - rentalsPct * 3.6}`}
                    strokeDashoffset={-salesPct * 3.6}
                    transform="rotate(-90 18 18)"
                  />
                )}
                <text x="18" y="17.5" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="5.5" fontWeight="bold">
                  {total}
                </text>
                <text x="18" y="22" textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.4)" fontSize="2.4">
                  biens
                </text>
              </svg>
            </div>

            {}
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/15">
                <span className="flex items-center gap-2.5 text-sm text-white/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  À vendre
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm text-white font-semibold tabular-nums">{sales}</span>
                  <span className="text-xs text-emerald-400 font-medium w-10 text-right">{salesPct}%</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-500/[0.07] border border-blue-500/15">
                <span className="flex items-center gap-2.5 text-sm text-white/80">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  À louer
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-sm text-white font-semibold tabular-nums">{rentals}</span>
                  <span className="text-xs text-blue-400 font-medium w-10 text-right">{rentalsPct}%</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <span className="flex items-center gap-2.5 text-sm text-white/80">
                  <DollarSign size={14} className="text-gold" />
                  Prix moyen
                </span>
                <span className="text-xs text-white/60 font-medium tabular-nums">
                  {(avgPrice / 1_000_000).toFixed(1)} M FCFA
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={13} className="text-gold" />
              Biens par ville
            </p>
            <div className="space-y-3">
              {byCity.map(([city, count]) => {
                const pct = Math.round((count / maxCity) * 100);
                return (
                  <div key={city} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-white/60 truncate">{city}</span>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-700"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs text-white/40 font-mono tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {}
        <div className="space-y-6">
          {}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <MessageSquare size={14} className="text-purple-400" />
                </span>
                <h3 className="font-display font-semibold text-white text-sm">
                  Messages récents
                </h3>
              </div>
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-gold/20 text-gold px-2 py-1 rounded-full">
                  {unread} non lu{unread > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {recentMsgs.length === 0 ? (
                <p className="text-xs text-white/30 text-center py-6">Aucun message</p>
              ) : (
                recentMsgs.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onNavigate("messages")}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all text-left"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${m.read ? "bg-white/10" : "bg-gold"}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-xs truncate ${m.read ? "text-white/50" : "text-white font-medium"}`}>
                        {m.name}
                      </span>
                      <span className="block text-[10px] text-white/30 truncate">{m.subject}</span>
                    </span>
                    <span className="text-[10px] text-white/25 shrink-0">
                      {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => onNavigate("messages")}
              className="w-full mt-3 text-center text-[11px] font-medium text-gold/70 hover:text-gold transition-colors"
            >
              Gérer les messages →
            </button>
          </div>

          {}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <TrendingUp size={14} className="text-blue-400" />
              </span>
              <h3 className="font-display font-semibold text-white text-sm">
                Top biens par valeur
              </h3>
            </div>
            <div className="space-y-2">
              {topValue.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-all"
                >
                  <span className="w-6 h-6 rounded-lg bg-white/[0.05] text-[10px] font-bold text-white/40 flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/[0.06] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-white font-medium truncate">{p.title}</p>
                    <p className="text-[10px] text-white/30">{p.city}</p>
                  </div>
                  <span className="text-[11px] text-gold font-medium shrink-0 tabular-nums">
                    {formatPrice(p.price, p.priceUnit)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <LayoutDashboard size={14} className="text-emerald-400" />
              </span>
              <h3 className="font-display font-semibold text-white text-sm">
                Actions rapides
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-gold/15 text-gold text-xs font-medium hover:bg-gold/25 transition-all"
              >
                <Plus size={14} /> Ajouter un bien
              </button>
              <button
                onClick={() => setShowComposeModal(true)}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-purple-500/15 text-purple-300 text-xs font-medium hover:bg-purple-500/25 transition-all"
              >
                <Send size={14} /> Nouveau message
              </button>
              <button
                onClick={onAddVehicle}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-cyan-500/15 text-cyan-300 text-xs font-medium hover:bg-cyan-500/25 transition-all"
              >
                <Car size={14} /> Ajouter un véhicule
              </button>
              <button
                onClick={() => onNavigate("promos")}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-blue-500/15 text-blue-300 text-xs font-medium hover:bg-blue-500/25 transition-all"
              >
                <Megaphone size={14} /> Promotions
              </button>
              <button
                onClick={() => onNavigate("reviews")}
                className="flex items-center gap-2 px-3 py-3 rounded-xl bg-white/[0.05] text-white/60 text-xs font-medium hover:bg-white/10 transition-all"
              >
                <Star size={14} /> Avis clients
              </button>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-7 h-7 rounded-lg bg-gold/15 flex items-center justify-center">
              <PieChart size={14} className="text-gold" />
            </span>
            <h3 className="font-display font-semibold text-white text-sm">
              Répartition par catégorie
            </h3>
          </div>
          <div className="space-y-4">
            {byCategory.map(([cat, count]) => {
              const max = byCategory[0][1];
              const pct = Math.round((count / max) * 100);
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white/70">{cat}</span>
                    <span className="text-xs text-white/40 font-mono">{count}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-700 ease-out"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-6">
          <div className="flex items-center gap-2.5 mb-6">
            <span className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <TrendingUp size={14} className="text-blue-400" />
            </span>
            <h3 className="font-display font-semibold text-white text-sm">
              Derniers biens ajoutés
            </h3>
          </div>
          <div className="space-y-2">
            {recent.map((p, i) => (
              <div
                key={p.id}
                className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-all"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="relative shrink-0">
                  <img
                    src={p.image}
                    alt={p.title}
                    className="w-11 h-11 rounded-lg object-cover ring-1 ring-white/[0.06]"
                  />
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-navy ${
                    p.type === "Vente" ? "bg-emerald-500" : "bg-blue-500"
                  }`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium truncate group-hover:text-gold transition-colors">
                    {p.title}
                  </p>
                  <p className="text-[11px] text-white/40">
                    {p.type} · {p.city}
                  </p>
                </div>
                <span className="text-xs text-gold font-medium shrink-0 tabular-nums">
                  {formatPrice(p.price, p.priceUnit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      {showAddModal && (
        <PropertyFormModal
          onClose={() => setShowAddModal(false)}
          onSave={(prop) => {
            createProperty.mutate(prop, {
              onSuccess: () => showToast("success", "Bien ajouté avec succès"),
            });
            setShowAddModal(false);
          }}
        />
      )}
      {showComposeModal && (
        <MessageComposeModal
          onClose={() => setShowComposeModal(false)}
          onSend={(msg) => {
            createMessage.mutate(msg);
            setShowComposeModal(false);
          }}
        />
      )}
    </div>
  );
}


