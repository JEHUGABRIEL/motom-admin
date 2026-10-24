import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import Pagination from "./Pagination";
import { useToast } from "./toast-context";
import {
  exportAuditLog,
  useAuditLog,
  useImportAuditLog,
  usePurgeAuditLog,
  type AuditEvent,
  type AuditStatus,
} from "../lib/api";

const PAGE_SIZE = 25;

const ENTITY_LABELS: Record<string, string> = {
  auth: "Authentification",
  admin: "Administration",
  property: "Bien immobilier",
  vehicle: "Véhicule",
  service: "Service",
  faq: "FAQ",
  message: "Message",
  review: "Avis",
  media: "Média",
  audit: "Journal d'audit",
};

const ACTION_LABELS: Record<string, string> = {
  "auth.login.success": "Connexion réussie",
  "auth.login.failure": "Échec de connexion",
  "auth.login.locked": "Compte verrouillé",
  "auth.login.blocked": "Connexion refusée",
  "auth.logout": "Déconnexion",
  "auth.mfa.challenge": "Double authentification demandée",
  "auth.mfa.verify.success": "Code MFA validé",
  "auth.mfa.verify.failure": "Code MFA refusé",
  "auth.mfa.recovery.success": "Code de secours utilisé",
  "auth.mfa.recovery.failure": "Code de secours refusé",
  "auth.mfa.setup": "Configuration MFA démarrée",
  "auth.mfa.activate": "MFA activée",
  "auth.mfa.disable": "MFA désactivée",
  "auth.mfa.recovery-codes": "Codes de secours régénérés",
  "admin.invite": "Invitation envoyée",
  "admin.accept": "Invitation acceptée",
  "admin.update": "Profil administrateur modifié",
  "admin.block": "Administrateur bloqué",
  "admin.unblock": "Administrateur débloqué",
  "admin.delete": "Administrateur supprimé",
  "admin.reset.request": "Réinitialisation demandée",
  "admin.reset.accept": "Mot de passe réinitialisé",
  "admin.forgot.request": "Mot de passe oublié",
  "property.create": "Bien créé",
  "property.update": "Bien modifié",
  "property.delete": "Bien supprimé",
  "vehicle.create": "Véhicule créé",
  "vehicle.update": "Véhicule modifié",
  "vehicle.delete": "Véhicule supprimé",
  "service.create": "Service créé",
  "service.update": "Service modifié",
  "service.delete": "Service supprimé",
  "faq.create": "Question créée",
  "faq.update": "Question modifiée",
  "faq.delete": "Question supprimée",
  "message.create": "Message reçu",
  "message.read": "Message lu",
  "message.delete": "Message supprimé",
  "review.create": "Avis déposé",
  "review.approve": "Avis publié",
  "review.reject": "Avis rejeté",
  "review.delete": "Avis supprimé",
  "media.sign": "Signature d'upload",
  "audit.purge": "Journal d'audit purgé",
  "audit.import": "Journal d'audit importé",
};

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function entityLabel(entityType: string): string {
  return ENTITY_LABELS[entityType] ?? entityType;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
}

function readMetadataValue(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const items = value.filter((item) => typeof item === "string");
    if (items.length > 0) return items.join(", ");
  }
  return null;
}

function metadataSummary(event: AuditEvent): string {
  const preferred = [
    "title",
    "name",
    "question",
    "subject",
    "email",
    "fields",
    "reason",
    "status",
  ];
  for (const key of preferred) {
    const value = readMetadataValue(event.metadata[key]);
    if (value) {
      const summary = value.replace(/\s+/g, " ").trim();
      return summary.length > 110 ? `${summary.slice(0, 107)}…` : summary;
    }
  }
  return event.entityId ?? "";
}

function actorLabel(event: AuditEvent): string {
  if (event.actor) {
    return event.actor.username || event.actor.email || event.actor.id || "Administrateur";
  }
  return event.entityType === "auth" ? "Non authentifié" : "Visiteur";
}

function StatusBadge({ status }: { status: AuditStatus }) {
  return status === "success" ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
      <CheckCircle2 size={11} />
      Succès
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">
      <AlertTriangle size={11} />
      Échec
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-white/75">{value}</dd>
    </div>
  );
}

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [entityType, setEntityType] = useState("");
  const [status, setStatus] = useState<AuditStatus | "all">("all");
  const [days, setDays] = useState(7);
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const [dialog, setDialog] = useState<null | "import" | "purge">(null);
  const [exporting, setExporting] = useState(false);
  const [importEvents, setImportEvents] = useState<unknown[] | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [purgeAll, setPurgeAll] = useState(false);
  const [purgeDays, setPurgeDays] = useState(90);
  const [purgeConfirmed, setPurgeConfirmed] = useState(false);
  const toast = useToast();
  const importMutation = useImportAuditLog();
  const purgeMutation = usePurgeAuditLog();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      q: query,
      entityType,
      status,
      days,
    }),
    [page, query, entityType, status, days],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useAuditLog(filters);
  const events = data?.events ?? [];
  const total = data?.total ?? 0;

  const resetFilters = () => {
    setSearch("");
    setQuery("");
    setEntityType("");
    setStatus("all");
    setDays(7);
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const payload = await exportAuditLog({
        q: query || undefined,
        entityType: entityType || undefined,
        status,
        days,
      });
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `journal-audit-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(
        `${payload.events.length} événement${payload.events.length > 1 ? "s" : ""} exporté${
          payload.events.length > 1 ? "s" : ""
        }.`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export impossible.");
    } finally {
      setExporting(false);
    }
  };

  const parseImportFile = async (file: File) => {
    setImportFileName(file.name);
    if (file.size > 8 * 1024 * 1024) {
      setImportEvents(null);
      setImportError("Fichier trop volumineux (8 Mo maximum).");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const events = Array.isArray(parsed)
        ? parsed
        : (parsed as { events?: unknown } | null)?.events;
      if (!Array.isArray(events)) {
        throw new Error("Le fichier doit contenir un tableau « events ».");
      }
      if (events.length === 0) throw new Error("Le fichier ne contient aucun événement.");
      if (events.length > 5000) throw new Error("Import limité à 5 000 événements.");
      setImportEvents(events);
      setImportError("");
    } catch (e) {
      setImportEvents(null);
      setImportError(e instanceof Error ? e.message : "Fichier illisible.");
    }
  };

  const closeDialog = () => {
    setDialog(null);
    setImportEvents(null);
    setImportFileName("");
    setImportError("");
    setPurgeConfirmed(false);
    setPurgeAll(false);
  };

  const submitImport = () => {
    if (!importEvents) return;
    importMutation.mutate(importEvents, {
      onSuccess: (result) => {
        toast.success(
          `Import terminé : ${result.imported} ajouté${
            result.imported > 1 ? "s" : ""
          }, ${result.skipped} déjà présent${result.skipped > 1 ? "s" : ""}, ${result.invalid} invalide${
            result.invalid > 1 ? "s" : ""
          }.`
        );
        closeDialog();
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Import impossible."),
    });
  };

  const submitPurge = () => {
    purgeMutation.mutate(purgeAll ? 0 : purgeDays, {
      onSuccess: (result) => {
        toast.success(
          `${result.deleted} événement${result.deleted > 1 ? "s" : ""} supprimé${
            result.deleted > 1 ? "s" : ""
          }.`
        );
        setPage(1);
        closeDialog();
      },
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Suppression impossible."),
    });
  };

  const selectClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-gold bo-select";

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold text-white sm:text-3xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <ShieldCheck size={21} />
            </span>
            Journal d'audit
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/40">
            Historique des actions sensibles et des modifications effectuées dans l'application.
            Les secrets, mots de passe et jetons ne sont jamais enregistrés.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isLoading && (
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <RefreshCw size={13} className="animate-spin" />
              Actualisation…
            </span>
          )}
          <span className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-2 text-xs text-white/50">
            <span className="font-semibold text-white">{total.toLocaleString("fr-FR")}</span>{" "}
            événement{total > 1 ? "s" : ""}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting || total === 0}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Exporter
            </button>
            <button
              type="button"
              onClick={() => setDialog("import")}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Upload size={14} />
              Importer
            </button>
            <button
              type="button"
              onClick={() => setDialog("purge")}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              <Trash2 size={14} />
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <span className="sr-only">Rechercher</span>
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Acteur, action, identifiant, IP…"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-gold"
            />
          </label>

          <label>
            <span className="sr-only">Type d'événement</span>
            <select
              value={entityType}
              onChange={(event) => {
                setEntityType(event.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">Tous les domaines</option>
              {Object.entries(ENTITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="sr-only">Statut</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AuditStatus | "all");
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="all">Tous les statuts</option>
              <option value="success">Succès</option>
              <option value="failure">Échecs</option>
            </select>
          </label>

          <div className="flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Période</span>
              <select
                value={days}
                onChange={(event) => {
                  setDays(Number(event.target.value));
                  setPage(1);
                }}
                className={selectClass}
              >
                <option value={1}>Dernières 24 h</option>
                <option value={7}>7 derniers jours</option>
                <option value={30}>30 derniers jours</option>
                <option value={90}>90 derniers jours</option>
                <option value={0}>Tout l'historique</option>
              </select>
            </label>
            <button
              type="button"
              onClick={resetFilters}
              title="Réinitialiser les filtres"
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <AlertTriangle size={26} className="text-red-400" />
            <p className="text-sm text-white/60">
              {error instanceof Error ? error.message : "Impossible de charger le journal."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl bg-gold px-4 py-2 text-xs font-semibold text-navy transition-colors hover:bg-gold-light"
            >
              Réessayer
            </button>
          </div>
        ) : isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <Clock size={26} className="text-white/20" />
            <p className="text-sm text-white/40">
              Aucun événement ne correspond à ces filtres.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-gold/80 transition-colors hover:text-gold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Acteur</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Cible</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5">IP</th>
                  <th className="w-10 px-3 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    onClick={() => setSelected(event)}
                    className="cursor-pointer border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.035]"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-white/45">
                      {formatDate(event.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.05] text-white/35">
                          <UserRound size={13} />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[170px] truncate text-xs font-medium text-white/75">
                            {actorLabel(event)}
                          </p>
                          {event.actor?.role && (
                            <p className="text-[10px] capitalize text-white/25">
                              {event.actor.role}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-medium text-white/75">
                        {actionLabel(event.action)}
                      </p>
                      <p className="mt-0.5 max-w-[270px] truncate text-[11px] text-white/30">
                        {metadataSummary(event) || event.action}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-white/50">
                        {entityLabel(event.entityType)}
                      </span>
                      {event.entityId && (
                        <p className="mt-1 max-w-[150px] truncate font-mono text-[10px] text-white/25">
                          {event.entityId}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 font-mono text-[10px] text-white/30">
                      {event.ip || "—"}
                    </td>
                    <td className="px-3 py-3.5">
                      <ChevronRight size={15} className="text-white/20" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        currentPage={page}
        totalItems={total}
        perPage={PAGE_SIZE}
        onPageChange={setPage}
      />

      {selected && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-navy/80 p-4 pt-12 backdrop-blur-sm"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Détail de l'événement"
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-gold/20 bg-gradient-to-b from-navy-light to-navy-dark p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            <div className="mb-6 flex items-start gap-3 pr-8">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                <ShieldCheck size={19} />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-white">
                  {actionLabel(selected.action)}
                </h2>
                <p className="mt-1 text-xs text-white/35">{formatDate(selected.createdAt)}</p>
              </div>
            </div>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <DetailRow label="Acteur" value={actorLabel(selected)} />
              <DetailRow label="Rôle" value={selected.actor?.role ?? ""} />
              <DetailRow
                label="Email"
                value={selected.actor?.email && selected.actor.email !== actorLabel(selected)
                  ? selected.actor.email
                  : ""}
              />
              <DetailRow label="Domaine" value={entityLabel(selected.entityType)} />
              <DetailRow label="Identifiant cible" value={selected.entityId ?? ""} />
              <DetailRow
                label="Statut"
                value={selected.status === "success" ? "Succès" : "Échec"}
              />
              <DetailRow label="Adresse IP" value={selected.ip} />
              <DetailRow label="Action technique" value={selected.action} />
            </dl>

            <div className="mt-6">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                Métadonnées
              </p>
              <pre className="mt-2 max-h-64 overflow-auto rounded-xl border border-white/[0.06] bg-black/20 p-4 text-[11px] leading-relaxed text-white/55">
                {JSON.stringify(selected.metadata ?? {}, null, 2)}
              </pre>
            </div>

            {selected.userAgent && (
              <div className="mt-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  Navigateur / appareil
                </p>
                <p className="mt-1 break-words text-xs text-white/45">{selected.userAgent}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {dialog === "import" && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-navy/80 p-4 pt-12 backdrop-blur-sm"
          onClick={closeDialog}
          role="dialog"
          aria-modal="true"
          aria-label="Importer le journal d'audit"
        >
          <div
            className="relative w-full max-w-xl rounded-2xl border border-gold/20 bg-gradient-to-b from-navy-light to-navy-dark p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeDialog}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <Upload size={18} className="text-gold" />
              Importer un journal
            </h2>
            <p className="mt-2 text-sm text-white/45">
              Fichier JSON produit par l'export du journal (format{" "}
              <code className="text-white/60">{`{ "events": [ … ] }`}</code>). Les événements
              dont l'identifiant existe déjà sont ignorés ; les entrées invalides sont comptabilisées
              séparément.
            </p>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center transition-colors hover:border-gold/40 hover:bg-white/[0.05]">
              <Upload size={22} className="text-white/35" />
              <span className="text-sm font-medium text-white/75">
                {importFileName || "Choisir un fichier .json"}
              </span>
              <span className="text-[11px] text-white/30">5 000 événements maximum · 8 Mo</span>
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void parseImportFile(file);
                }}
              />
            </label>

            {importError && (
              <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {importError}
              </p>
            )}

            {importEvents && (
              <p className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 size={14} className="shrink-0" />
                {importEvents.length.toLocaleString("fr-FR")} événement
                {importEvents.length > 1 ? "s" : ""} prêt{importEvents.length > 1 ? "s" : ""} à être
                importé{importEvents.length > 1 ? "s" : ""}.
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitImport}
                disabled={!importEvents || importMutation.isPending}
                className="flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                {importMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                Importer
              </button>
            </div>
          </div>
        </div>
      )}

      {dialog === "purge" && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-navy/80 p-4 pt-12 backdrop-blur-sm"
          onClick={closeDialog}
          role="dialog"
          aria-modal="true"
          aria-label="Réinitialiser le journal d'audit"
        >
          <div
            className="relative w-full max-w-xl rounded-2xl border border-red-500/25 bg-gradient-to-b from-navy-light to-navy-dark p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeDialog}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <Trash2 size={18} className="text-red-400" />
              Réinitialiser le journal
            </h2>
            <p className="mt-2 text-sm text-white/45">
              La suppression est définitive et n'est pas annulable. Pensez à exporter le journal
              avant toute opération. L'événement de suppression est conservé dans le journal.
            </p>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                  Portée
                </span>
                <select
                  value={purgeAll ? "all" : String(purgeDays)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setPurgeAll(value === "all");
                    if (value !== "all") setPurgeDays(Number(value));
                    setPurgeConfirmed(false);
                  }}
                  className={selectClass}
                >
                  <option value="30">Événements de plus de 30 jours</option>
                  <option value="90">Événements de plus de 90 jours</option>
                  <option value="180">Événements de plus de 180 jours</option>
                  <option value="365">Événements de plus d'un an</option>
                  <option value="all">Tout l'historique</option>
                </select>
              </label>

              <label className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={purgeConfirmed}
                  onChange={(event) => setPurgeConfirmed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-red-500"
                />
                <span className="text-xs leading-relaxed text-white/55">
                  Je confirme la suppression définitive de{" "}
                  {purgeAll ? "tout l'historique" : `tous les événements de plus de ${purgeDays} jours`}.
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submitPurge}
                disabled={!purgeConfirmed || purgeMutation.isPending}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {purgeMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
