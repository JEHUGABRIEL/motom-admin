import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, CheckSquare, Edit3, Eye, Megaphone, Pause, Play, Plus, Trash2, X } from "lucide-react";
import { formatPrice, type Property } from "../data/properties";
import { formatVehiclePrice, type Vehicle } from "../data/vehicles";
import { type Faq, type Service, useCreateFaq, useCreateService, useDeleteFaq, useDeleteService, useFaqs, useProperties, useServices, useUpdateFaq, useUpdateProperty, useUpdateService, useUpdateVehicle, useVehicles } from "../lib/api";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/toast-context";
import { formatPromoEnd, isPromoExpired } from "../lib/promo";
import { PropertyDetailsModal } from "../admin/properties";
import { VehicleDetailsModal } from "../admin/vehicles";

export function ServicesList() {
  const { data: list = [] } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = (id: string) => {
    deleteService.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null);
        showToast("success", "Service supprimé avec succès");
      },
    });
  };

  const toggleActive = (s: Service) => {
    updateService.mutate({ ...s, active: !s.active });
  };

  return (
    <div>
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-fade-up ${
          toast.type === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="font-display font-bold text-white text-2xl">Gestion des services</h2>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-5 py-2.5 rounded-xl transition-all">
          <Plus size={16} />
          Ajouter un service
        </button>
      </div>

      <p className="text-xs text-white/30 mb-4">{list.length} service{list.length > 1 ? "s" : ""} — les services actifs s'affichent sur la page Services du site.</p>

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Service</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Points</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Statut</th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-white text-sm font-medium">{s.title}</p>
                    <p className="text-[11px] text-white/30 max-w-xs truncate">{s.text}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-xs text-white/50">{s.points.length} point{s.points.length > 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(s)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        s.active ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.active ? "bg-emerald-400" : "bg-white/25"}`} />
                      {s.active ? "Actif" : "Inactif"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingId(s.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(s.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-white/30 text-sm">Aucun service pour le moment</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingId) && (
        <ServiceFormModal
          service={editingId ? list.find((s) => s.id === editingId) : undefined}
          onClose={() => { setShowAddModal(false); setEditingId(null); }}
          onSave={(s) => {
            if (editingId) {
              updateService.mutate(s, { onSuccess: () => showToast("success", "Service modifié avec succès") });
            } else {
              createService.mutate(s, { onSuccess: () => showToast("success", "Service ajouté avec succès") });
            }
            setShowAddModal(false);
            setEditingId(null);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-sm w-full border-white/10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-white/50 mb-6">Cette action est irréversible. Voulez-vous vraiment supprimer ce service ?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export function FaqsList() {
  const { data: list = [] } = useFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = (id: string) => {
    deleteFaq.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null);
        showToast("success", "Question supprimée avec succès");
      },
    });
  };

  const toggleActive = (f: Faq) => {
    updateFaq.mutate({ id: f.id, active: !f.active });
  };

  return (
    <div>
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-medium ${
            toast.type === "success"
              ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
              : "bg-red-950 border-red-500/40 text-red-300"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="font-display font-bold text-white text-2xl">Questions fréquentes</h2>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-5 py-2.5 rounded-xl transition-all">
          <Plus size={16} />
          Ajouter une question
        </button>
      </div>

      <p className="text-xs text-white/30 mb-4">{list.length} question{list.length > 1 ? "s" : ""} — les questions actives s'affichent dans la section FAQ de la page d'accueil.</p>

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Question</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Réponse</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Statut</th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-white text-sm font-medium max-w-md">{f.question}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-xs text-white/50 max-w-md line-clamp-2">{f.answer}</p>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(f)}
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        f.active ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25" : "bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${f.active ? "bg-emerald-400" : "bg-white/25"}`} />
                      {f.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditingId(f.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(f.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-white/30 text-sm">Aucune question pour le moment</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingId) && (
        <FaqFormModal
          faq={editingId ? list.find((f) => f.id === editingId) : undefined}
          onClose={() => { setShowAddModal(false); setEditingId(null); }}
          onSave={(f) => {
            if (editingId) {
              updateFaq.mutate(f, { onSuccess: () => showToast("success", "Question modifiée avec succès") });
            } else {
              createFaq.mutate(f, { onSuccess: () => showToast("success", "Question ajoutée avec succès") });
            }
            setShowAddModal(false);
            setEditingId(null);
          }}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-sm w-full border-white/10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">Confirmer la suppression</h3>
              <p className="text-sm text-white/50 mb-6">Cette action est irréversible. Voulez-vous vraiment supprimer cette question ?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-all">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export function FaqFormModal({
  faq,
  onClose,
  onSave,
}: {
  faq?: Faq;
  onClose: () => void;
  onSave: (faq: Faq) => void;
}) {
  const [form, setForm] = useState({
    question: faq?.question || "",
    answer: faq?.answer || "",
    active: faq?.active !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = faq?.id || `faq-${Date.now()}`;
    onSave({ id, question: form.question, answer: form.answer, position: faq?.position ?? 0, active: form.active });
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-navy-light/60 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all";
  const labelCls = "text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-xl w-full border-white/10 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-white text-lg">
            {faq ? "Modifier la question" : "Ajouter une question"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Question *</label>
            <input required value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Réponse *</label>
            <textarea required rows={5} value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} className={`${inputCls} resize-none`} />
          </div>
          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-gold/40 transition-all">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.active}
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                form.active ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent"
              }`}
            >
              <CheckSquare size={13} />
            </button>
            <span className="text-sm text-white/70">Question visible sur le site public</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
            <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-medium bg-gold text-navy hover:bg-gold-light transition-all">
              {faq ? "Enregistrer les modifications" : "Ajouter la question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export function ServiceFormModal({
  service,
  onClose,
  onSave,
}: {
  service?: Service;
  onClose: () => void;
  onSave: (service: Service) => void;
}) {
  const [form, setForm] = useState({
    title: service?.title || "",
    text: service?.text || "",
    points: service?.points?.join(", ") || "",
    active: service?.active !== false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const points = form.points.split(",").map((x) => x.trim()).filter(Boolean);
    const id = service?.id || `svc-${Date.now()}`;
    onSave({ id, title: form.title, text: form.text, points, active: form.active });
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-navy-light/60 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all";
  const labelCls = "text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-xl w-full border-white/10 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-white text-lg">
            {service ? "Modifier le service" : "Ajouter un service"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Titre</label>
            <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea required rows={3} value={form.text} onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={labelCls}>Points forts (séparés par des virgules)</label>
            <input value={form.points} onChange={(e) => setForm((f) => ({ ...f, points: e.target.value }))} placeholder="Estimation gratuite, Suivi notarié..." className={inputCls} />
          </div>
          <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-gold/40 transition-all">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.active}
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                form.active ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent"
              }`}
            >
              <CheckSquare size={13} />
            </button>
            <span className="text-sm text-white/70">Service visible sur le site public</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
            <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-medium bg-gold text-navy hover:bg-gold-light transition-all">
              {service ? "Enregistrer les modifications" : "Ajouter le service"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export function PromosList() {
  const { data: properties = [] } = useProperties();
  const { data: vehicles = [] } = useVehicles();
  const updateProperty = useUpdateProperty();
  const updateVehicle = useUpdateVehicle();
  const { success, error: notifyError } = useToast();

  const [removeConfirm, setRemoveConfirm] = useState<{
    kind: "property" | "vehicle";
    id: string;
    title: string;
  } | null>(null);
  const [detailsId, setDetailsId] = useState<{ kind: "property" | "vehicle"; id: string } | null>(null);

  const promos = useMemo(() => {
    const props = properties
      .filter((p) => p.promo)
      .map((p) => ({
        kind: "property" as const,
        id: p.id,
        title: p.title,
        image: p.image,
        price: formatPrice(p.price, p.priceUnit),
        type: p.type,
        paused: Boolean(p.promoPaused),
        promoEndsAt: p.promoEndsAt ?? null,
        item: p as Property,
      }));
    const vehs = vehicles
      .filter((v) => v.promo)
      .map((v) => ({
        kind: "vehicle" as const,
        id: v.id,
        title: v.name,
        image: v.image,
        price: formatVehiclePrice(v.price, v.priceUnit),
        type: v.type,
        paused: Boolean(v.promoPaused),
        promoEndsAt: v.promoEndsAt ?? null,
        item: v as Vehicle,
      }));
    return [...props, ...vehs];
  }, [properties, vehicles]);

  const detailsProp = detailsId?.kind === "property" ? (properties.find((p) => p.id === detailsId.id) ?? null) : null;
  const detailsVehicle = detailsId?.kind === "vehicle" ? (vehicles.find((v) => v.id === detailsId.id) ?? null) : null;

  const handleTogglePause = (p: (typeof promos)[number]) => {
    const body = { promoPaused: !p.paused };
    try {
      if (p.kind === "property") {
        updateProperty.mutate({ id: p.id, ...body }, {
          onSuccess: () => success(p.paused ? `« ${p.title} » reprend la promotion` : `« ${p.title} » mis en pause`),
        });
      } else {
        updateVehicle.mutate({ id: p.id, ...body }, {
          onSuccess: () => success(p.paused ? `« ${p.title} » reprend la promotion` : `« ${p.title} » mis en pause`),
        });
      }
    } catch {
      notifyError("Erreur lors de la mise à jour de la promotion");
    }
  };

  const handleRemove = () => {
    if (!removeConfirm) return;
    const { kind, id } = removeConfirm;
    const body = { promo: false };
    try {
      if (kind === "property") {
        updateProperty.mutate({ id, ...body }, {
          onSuccess: () => success(`« ${removeConfirm.title} » retiré des promotions`),
        });
      } else {
        updateVehicle.mutate({ id, ...body }, {
          onSuccess: () => success(`« ${removeConfirm.title} » retiré des promotions`),
        });
      }
      setRemoveConfirm(null);
    } catch {
      notifyError("Erreur lors du retrait de la promotion");
    }
  };

  
  
  if (detailsProp) {
    return (
      <PropertyDetailsModal
        property={detailsProp}
        onClose={() => setDetailsId(null)}
        onEdit={() => setDetailsId(null)}
        onDelete={() => setDetailsId(null)}
      />
    );
  }
  if (detailsVehicle) {
    return (
      <VehicleDetailsModal
        vehicle={detailsVehicle}
        onClose={() => setDetailsId(null)}
        onEdit={() => setDetailsId(null)}
        onDelete={() => setDetailsId(null)}
      />
    );
  }

  const promoCount = promos.length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display font-bold text-white text-2xl">
            Promotions
          </h2>
          <p className="text-xs text-white/30 mt-1">
            {promoCount} élément{promoCount > 1 ? "s" : ""} en promo — affiché{promoCount > 1 ? "s" : ""} dans le bandeau du site public.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold bg-gold/15 text-gold px-4 py-2 rounded-xl">
          <Megaphone size={14} />
          {promoCount} promo{promoCount > 1 ? "s" : ""} active{promoCount > 1 ? "s" : ""}
        </span>
      </div>

      {promoCount === 0 ? (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center">
          <Megaphone size={32} className="mx-auto text-white/20 mb-4" />
          <p className="text-sm text-white/40">
            Aucune promotion active. Ouvrez un bien ou un véhicule et cochez
            « Mettre en promo » pour qu'il apparaisse ici et dans le bandeau public.
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Élément</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Type</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Transaction</th>
                  <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Prix</th>
                  <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden lg:table-cell">Statut</th>
                  <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={`${p.kind}-${p.id}`} className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${p.paused ? "opacity-60" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.image} alt={p.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <p className="text-white text-sm font-medium truncate max-w-[220px]">{p.title}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                        p.kind === "property" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"
                      }`}>
                        {p.kind === "property" ? "Bien" : "Véhicule"}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-xs text-white/50">{p.type}</span>
                    </td>
                    <td className="px-5 py-4 text-right text-gold text-sm font-medium">{p.price}</td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg ${
                        p.paused ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.paused ? "bg-amber-400" : "bg-emerald-400"}`} />
                        {p.paused ? "En pause" : "Active"}
                      </span>
                      {p.promoEndsAt && !isPromoExpired(p.promoEndsAt) && (
                        <span className="block mt-1.5 text-[11px] text-white/40">
                          Fin le {formatPromoEnd(p.promoEndsAt, "fr")}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailsId({ kind: p.kind, id: p.id })}
                          title="Voir les détails"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleTogglePause(p)}
                          title={p.paused ? "Reprendre la promotion" : "Mettre en pause"}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            p.paused
                              ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                              : "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                          }`}
                        >
                          {p.paused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                        <button
                          onClick={() => setRemoveConfirm({ kind: p.kind, id: p.id, title: p.title })}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                          title="Retirer la promo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      
      <ConfirmDialog
        open={!!removeConfirm}
        title="Retirer la promotion"
        message={
          removeConfirm
            ? `Voulez-vous vraiment retirer « ${removeConfirm.title} » des promotions ? Il ne sera plus affiché dans le bandeau public.`
            : ""
        }
        confirmLabel="Retirer la promo"
        variant="danger"
        onConfirm={handleRemove}
        onCancel={() => setRemoveConfirm(null)}
      />
    </div>
  );
}


