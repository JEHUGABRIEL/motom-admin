// Helpers partagés pour les promos à durée limitée (promo_ends_at)

export function isPromoExpired(
  promoEndsAt: string | null | undefined,
  now: number = Date.now()
): boolean {
  if (!promoEndsAt) return false;
  const d = new Date(promoEndsAt).getTime();
  return Number.isFinite(d) && d <= now;
}

export function isPromoActive(
  item: { promo: boolean; promoEndsAt?: string | null },
  now: number = Date.now()
): boolean {
  return Boolean(item.promo) && !isPromoExpired(item.promoEndsAt, now);
}

/** Formate une date de fin de promo (ex. « 15/09/2026 ») selon la langue. */
export function formatPromoEnd(value: string, lang: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export type PromoCountdown = { days: number; hours: number; minutes: number };

/**
 * Temps restant avant la fin d'une promo, arrondi à la minute.
 * Retourne null si la promo n'a pas de date de fin ou si elle est déjà échue.
 */
export function promoCountdown(
  promoEndsAt: string | null | undefined,
  now: number = Date.now()
): PromoCountdown | null {
  if (!promoEndsAt) return null;
  const end = new Date(promoEndsAt).getTime();
  if (!Number.isFinite(end)) return null;
  const ms = end - now;
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
  };
}

/** Convertit une valeur datetime-local (« 2026-09-15T14:30 ») en ISO UTC, ou null. */
export function promoEndsAtToIso(value: string | undefined | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Valeur datetime-local à partir d'une date ISO (pour pré-remplir un input). */
export function isoToDatetimeLocal(value: string | undefined | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
