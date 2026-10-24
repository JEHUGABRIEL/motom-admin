import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatPrice, type Property } from "../data/properties";
import { formatVehiclePrice, type Vehicle } from "../data/vehicles";
import type {
  AdminRow,
  LoginEvent,
  Review as AdminReview,
} from "../admin/types";

const API = ""; 



async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  return res.json();
}



export const queryKeys = {
  properties: {
    all: ["properties"] as const,
    byId: (id: string) => ["properties", id] as const,
    featured: ["properties", "featured"] as const,
    byType: (type: string) => ["properties", "type", type] as const,
  },
  messages: {
    all: ["messages"] as const,
    byFilter: (f: string) => ["messages", "filter", f] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    admin: ["reviews", "admin"] as const,
  },
  admins: {
    all: ["admins"] as const,
  },
  loginEvents: ["login-events"] as const,
  vehicles: {
    all: ["vehicles"] as const,
    byId: (id: string) => ["vehicles", id] as const,
    byType: (type: string) => ["vehicles", "type", type] as const,
  },
  services: {
    all: ["services"] as const,
  },
  faqs: {
    all: ["faqs"] as const,
  },
};



export function useProperties() {
  return useQuery({
    queryKey: queryKeys.properties.all,
    queryFn: () => apiFetch<Property[]>("/api/properties"),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.properties.byId(id ?? ""),
    queryFn: () => apiFetch<Property>(`/api/properties/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: queryKeys.properties.featured,
    queryFn: () =>
      apiFetch<Property[]>("/api/properties").then((list) =>
        list.filter((p) => p.featured)
      ),
    staleTime: 1000 * 60 * 10,
  });
}

export function usePropertiesByType(type: string) {
  return useQuery({
    queryKey: queryKeys.properties.byType(type),
    queryFn: () =>
      apiFetch<Property[]>(`/api/properties?type=${encodeURIComponent(type)}`),
    staleTime: 1000 * 60 * 5,
  });
}



export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prop: Partial<Property>) =>
      apiFetch<{ success: boolean; id: string }>("/api/properties", {
        method: "POST",
        body: JSON.stringify(prop),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.all }),
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prop: Partial<Property>) =>
      apiFetch<{ success: boolean }>(`/api/properties/${prop.id}`, {
        method: "PUT",
        body: JSON.stringify(prop),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.all }),
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/properties/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.properties.all }),
  });
}



export function useVehicles(type?: string) {
  return useQuery({
    queryKey: type ? queryKeys.vehicles.byType(type) : queryKeys.vehicles.all,
    queryFn: () =>
      apiFetch<Vehicle[]>(
        type ? `/api/vehicles?type=${encodeURIComponent(type)}` : "/api/vehicles"
      ),
    staleTime: 1000 * 60 * 5,
  });
}



export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.vehicles.byId(id ?? ""),
    queryFn: () => apiFetch<Vehicle>(`/api/vehicles/${id}`),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}



export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: Partial<Vehicle>) =>
      apiFetch<{ success: boolean; id: string }>("/api/vehicles", {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: Partial<Vehicle>) =>
      apiFetch<{ success: boolean }>(`/api/vehicles/${v.id}`, {
        method: "PUT",
        body: JSON.stringify(v),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/vehicles/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.vehicles.all }),
  });
}



export type Stats = {
  properties: { total: number; sale: number; rental: number; value: number };
  vehicles: { total: number; sale: number; rental: number; featured: number };
  reviews: { total: number; approved: number; pending: number };
  messages: { total: number; unread: number };
};



export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<Stats>("/api/admins/stats"),
    staleTime: 1000 * 60,
  });
}

export type AuditStatus = "success" | "failure";

export type AuditEvent = {
  id: string;
  createdAt: string;
  actor: {
    id: string | null;
    email: string;
    username: string | null;
    role: string | null;
  } | null;
  action: string;
  entityType: string;
  entityId: string | null;
  status: AuditStatus;
  ip: string;
  userAgent: string;
  metadata: Record<string, unknown>;
};

export type AuditFilters = {
  page: number;
  pageSize: number;
  q?: string;
  entityType?: string;
  status?: AuditStatus | "all";
  days?: number;
};

export type AuditLogResponse = {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: [
      "audit",
      filters.page,
      filters.pageSize,
      filters.q ?? "",
      filters.entityType ?? "",
      filters.status ?? "all",
      filters.days ?? 7,
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(filters.page),
        pageSize: String(filters.pageSize),
      });
      if (filters.q) params.set("q", filters.q);
      if (filters.entityType) params.set("entityType", filters.entityType);
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      if (filters.days !== undefined) params.set("days", String(filters.days));
      return apiFetch<AuditLogResponse>(`/api/audit?${params.toString()}`);
    },
    staleTime: 1000 * 15,
    placeholderData: (previousData) => previousData,
  });
}

export type AuditExport = {
  exportedAt: string;
  total: number;
  events: AuditEvent[];
};

/**
 * Récupère tous les événements correspondant aux filtres, page par page,
 * pour produire un export JSON complet (plafonné à `maxEvents`).
 */
export async function exportAuditLog(
  filters: Omit<AuditFilters, "page" | "pageSize"> = {},
  maxEvents = 5000
): Promise<AuditExport> {
  const pageSize = 100;
  const events: AuditEvent[] = [];
  let total = 0;

  for (let page = 1; page <= Math.ceil(maxEvents / pageSize); page += 1) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (filters.q) params.set("q", filters.q);
    if (filters.entityType) params.set("entityType", filters.entityType);
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.days !== undefined) params.set("days", String(filters.days));

    const data = await apiFetch<AuditLogResponse>(`/api/audit?${params.toString()}`);
    events.push(...data.events);
    total = data.total;

    if (data.events.length < pageSize || events.length >= total) break;
  }

  return {
    exportedAt: new Date().toISOString(),
    total,
    events: events.slice(0, maxEvents),
  };
}

export type AuditImportResult = {
  success: boolean;
  imported: number;
  skipped: number;
  invalid: number;
};

export function useImportAuditLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (events: unknown[]) =>
      apiFetch<AuditImportResult>("/api/audit", {
        method: "POST",
        body: JSON.stringify({ events }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audit"] }),
  });
}

export type AuditPurgeResult = {
  success: boolean;
  deleted: number;
  olderThanDays: number;
};

export function usePurgeAuditLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (beforeDays: number) =>
      apiFetch<AuditPurgeResult>(
        `/api/audit?beforeDays=${encodeURIComponent(String(beforeDays))}`,
        { method: "DELETE" }
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["audit"] }),
  });
}



export type Service = {
  id: string;
  title: string;
  text: string;
  points: string[];
  active: boolean;
  created_at?: string;
};

export function useServices() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: () => apiFetch<Service[]>("/api/services?all=1"),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicServices() {
  return useQuery({
    queryKey: queryKeys.services.all,
    queryFn: () => apiFetch<Service[]>("/api/services"),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Partial<Service>) =>
      apiFetch<{ success: boolean; id: string }>("/api/services", {
        method: "POST",
        body: JSON.stringify(s),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.services.all }),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Partial<Service>) =>
      apiFetch<{ success: boolean }>(`/api/services/${s.id}`, {
        method: "PUT",
        body: JSON.stringify(s),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.services.all }),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/services/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.services.all }),
  });
}

export type Faq = {
  id: string;
  question: string;
  answer: string;
  position: number;
  active: boolean;
  created_at?: string;
};

export function useFaqs() {
  return useQuery({
    queryKey: queryKeys.faqs.all,
    queryFn: () => apiFetch<Faq[]>("/api/faqs?all=1"),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePublicFaqs() {
  return useQuery({
    queryKey: queryKeys.faqs.all,
    queryFn: () => apiFetch<Faq[]>("/api/faqs"),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: Partial<Faq>) =>
      apiFetch<{ success: boolean; id: string }>("/api/faqs", {
        method: "POST",
        body: JSON.stringify(f),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.faqs.all }),
  });
}

export function useUpdateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: Partial<Faq>) =>
      apiFetch<{ success: boolean }>(`/api/faqs/${f.id}`, {
        method: "PUT",
        body: JSON.stringify(f),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.faqs.all }),
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/faqs/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.faqs.all }),
  });
}



export type Review = {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  comment: string;
  created_at?: string;
};

export function useReviews() {
  return useQuery({
    queryKey: queryKeys.reviews.all,
    queryFn: () => apiFetch<Review[]>("/api/reviews"),
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });
}

export type Message = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
};

export function useMessages(
  filter: "all" | "unread" = "all",
  options?: { refetchInterval?: number },
) {
  return useQuery({
    queryKey: queryKeys.messages.byFilter(filter),
    queryFn: () =>
      apiFetch<Message[]>(
        filter === "unread"
          ? "/api/messages?filter=unread"
          : "/api/messages"
      ),
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    ...options,
  });
}

export function useCreateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (msg: Omit<Message, "id" | "read" | "created_at">) =>
      apiFetch<{ success: boolean; id: string }>("/api/messages", {
        method: "POST",
        body: JSON.stringify(msg),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages.all }),
  });
}

export function useUpdateMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; read: boolean }) =>
      apiFetch<{ success: boolean }>(`/api/messages/${args.id}`, {
        method: "PUT",
        body: JSON.stringify({ read: args.read }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages.all }),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/messages/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages.all }),
  });
}



// ---- Comptes admin (back-office) ----

export function useAdmins() {
  return useQuery({
    queryKey: queryKeys.admins.all,
    queryFn: () =>
      apiFetch<{ admins: AdminRow[] }>("/api/admins").then((r) => r.admins ?? []),
    staleTime: 1000 * 60,
  });
}

export type AdminInviteResult = {
  success: boolean;
  inviteUrl: string;
  emailSent: boolean;
};

export function useInviteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<AdminInviteResult>("/api/admins", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admins.all }),
  });
}

export function useUpdateAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; status: "active" | "blocked" }) =>
      apiFetch<{ success: boolean }>(`/api/admins/${args.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: args.status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admins.all }),
  });
}

export function useDeleteAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/admins/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admins.all }),
  });
}

export type AdminResetResult = {
  success: boolean;
  resetUrl: string;
  emailSent: boolean;
};

export function useResetAdminPassword() {
  return useMutation({
    mutationFn: (adminId: string) =>
      apiFetch<AdminResetResult>("/api/admins/reset", {
        method: "POST",
        body: JSON.stringify({ adminId }),
      }),
  });
}

export function useLoginEvents() {
  return useQuery({
    queryKey: queryKeys.loginEvents,
    queryFn: () =>
      apiFetch<{ events: LoginEvent[] }>("/api/admins/login-events").then(
        (r) => r.events ?? []
      ),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30,
  });
}

// ---- Modération des avis (back-office) ----

export function useAdminReviews() {
  return useQuery({
    queryKey: queryKeys.reviews.admin,
    queryFn: () => apiFetch<AdminReview[]>("/api/reviews"),
    staleTime: 1000 * 30,
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { author: string; rating: number; comment: string }) => {
      const created = await apiFetch<{ id: string }>("/api/reviews", {
        method: "POST",
        body: JSON.stringify(input),
      });
      try {
        await apiFetch(`/api/reviews/${created.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "approved" }),
        });
      } catch {
        throw new Error("Avis enregistré mais non publié : validez-le dans la liste.");
      }
      return created;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.reviews.all }),
  });
}

export function useSetReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { id: string; status: "approved" | "rejected" }) =>
      apiFetch<{ success: boolean }>(`/api/reviews/${args.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: args.status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reviews.all }),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/api/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reviews.all }),
  });
}



export { formatPrice, formatVehiclePrice };
export type { Property, Vehicle };
