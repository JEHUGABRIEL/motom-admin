import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft as ArrowLeftIcon, ArrowRight as ArrowRightIcon, CheckCircle2, CheckSquare, Edit3, Eye, Link as LinkIcon, Megaphone, Plus, Sparkles, Star, Trash2, Upload, X } from "lucide-react";
import { formatVehiclePrice, type Vehicle } from "../data/vehicles";
import { useCreateVehicle, useDeleteVehicle, useUpdateVehicle, useVehicles } from "../lib/api";
import Pagination from "../components/Pagination";
import { useToast } from "../components/toast-context";
import { loadCloudinaryWidgetScript, openSignedUploadWidget } from "../lib/cloudinary";
import { formatPromoEnd, isoToDatetimeLocal, isPromoExpired, promoEndsAtToIso } from "../lib/promo";
import { DetailsPageShell, DetailsRow } from "../admin/shared";
import { formatDate } from "./format";

export function VehiclesList({
  defaultType = "all",
  autoOpenAdd = false,
  onAutoAddHandled,
}: {
  defaultType?: "all" | "Vente" | "Location";
  autoOpenAdd?: boolean;
  onAutoAddHandled?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Vente" | "Location">(defaultType);
  const [showAddModal, setShowAddModal] = useState(autoOpenAdd);

  const autoAddHandledRef = useRef(false);
  useEffect(() => {
    if (!autoOpenAdd || autoAddHandledRef.current) return;
    autoAddHandledRef.current = true;
    setShowAddModal(true);
    onAutoAddHandled?.();
  }, [autoOpenAdd, onAutoAddHandled]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const { data: list = [] } = useVehicles();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const deleteVehicle = useDeleteVehicle();

  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 5;

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => {
    return list.filter((v) => {
      if (typeFilter !== "all" && v.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          v.name.toLowerCase().includes(q) ||
          v.brand.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [list, typeFilter, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, currentPage]);

  const handleDelete = (id: string) => {
    deleteVehicle.mutate(id, {
      onSuccess: () => {
        setDeleteConfirm(null);
        showToast("success", "Véhicule supprimé avec succès");
      },
    });
  };

  const detailsVehicle = detailsId ? list.find((v) => v.id === detailsId) ?? null : null;
  if (detailsVehicle) {
    return (
      <VehicleDetailsModal
        vehicle={detailsVehicle}
        onClose={() => setDetailsId(null)}
        onEdit={() => {
          setEditingId(detailsId);
          setDetailsId(null);
        }}
        onDelete={() => {
          setDeleteConfirm(detailsId);
          setDetailsId(null);
        }}
      />
    );
  }

  return (
    <div>
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="font-display font-bold text-white text-2xl">
          Gestion des véhicules
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-gold hover:bg-gold-light text-navy font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
        >
          <Plus size={16} />
          Ajouter un véhicule
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, marque ou ville..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all"
        />
        <div className="flex gap-1.5">
          {(["all", "Vente", "Location"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                typeFilter === t
                  ? "bg-gold/20 text-gold"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {t === "all" ? "Tous" : t}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-white/30 mb-4">
        {filtered.length} véhicule{filtered.length > 1 ? "s" : ""} sur {list.length}
      </p>

      <div className="bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Véhicule</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Type</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden md:table-cell">Catégorie</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden lg:table-cell">Promo</th>
                <th className="text-left text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4 hidden xl:table-cell">Ajouté le</th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Prix</th>
                <th className="text-right text-[11px] font-semibold text-white/40 uppercase tracking-wider px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((v) => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={v.image} alt={v.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate max-w-[200px]">{v.name}</p>
                        <p className="text-[11px] text-white/30">{v.brand} — {v.year}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                      v.type === "Vente" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"
                    }`}>
                      {v.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/60 text-sm hidden md:table-cell">{v.category}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {v.promo ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-gold/20 text-gold">
                        <Sparkles size={12} /> Promo
                      </span>
                    ) : (
                      <span className="text-xs text-white/25">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-white/40 text-xs hidden xl:table-cell">
                    {v.created_at ? formatDate(v.created_at) : "—"}
                  </td>
                  <td className="px-5 py-4 text-right text-gold text-sm font-medium">
                    {formatVehiclePrice(v.price, v.priceUnit)}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDetailsId(v.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all"
                        title="Voir les détails"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => setEditingId(v.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-gold hover:bg-gold/10 transition-all"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(v.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/30 text-sm">Aucun véhicule trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={filtered.length}
        perPage={PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {(showAddModal || editingId) && (
        <VehicleFormModal
          vehicle={editingId ? list.find((v) => v.id === editingId) : undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingId(null);
          }}
          onSave={(v) => {
            if (editingId) {
              updateVehicle.mutate(v, { onSuccess: () => showToast("success", "Véhicule modifié avec succès") });
            } else {
              createVehicle.mutate(v, { onSuccess: () => showToast("success", "Véhicule ajouté avec succès") });
            }
            setShowAddModal(false);
            setEditingId(null);
          }}
        />
      )}      {deleteConfirm && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-sm w-full border-white/10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-red-400/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} className="text-red-400" />
              </div>
              <h3 className="font-display font-semibold text-white text-lg mb-2">
                Confirmer la suppression
              </h3>
              <p className="text-sm text-white/50 mb-6">
                Cette action est irréversible. Voulez-vous vraiment supprimer ce véhicule ?
              </p>
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


export function VehicleFormModal({
  vehicle,
  onClose,
  onSave,
}: {
  vehicle?: Vehicle;
  onClose: () => void;
  onSave: (vehicle: Vehicle) => void;
}) {
  const [form, setForm] = useState({
    name: vehicle?.name || "",
    brand: vehicle?.brand || "",
    type: vehicle?.type || ("Location" as const),
    category: vehicle?.category || ("SUV / 4x4" as const),
    year: vehicle?.year || new Date().getFullYear(),
    seats: vehicle?.seats || 5,
    transmission: vehicle?.transmission || ("Automatique" as const),
    fuel: vehicle?.fuel || ("Diesel" as const),
    mileage: vehicle?.mileage?.toString() || "",
    price: vehicle?.price || 0,
    city: vehicle?.city || "Bangui",
    description: vehicle?.description || "",
    features: vehicle?.features.join(", ") || "",
    withDriver: vehicle?.withDriver || false,
    available: vehicle?.available !== false,
    promo: vehicle?.promo || false,
    featured: vehicle?.featured || false,
    promoEndsAt: isoToDatetimeLocal(vehicle?.promoEndsAt),
    gallery: vehicle?.gallery?.length ? vehicle.gallery : vehicle?.image ? [vehicle.image] : [],
  });
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadCloudinaryWidgetScript();
  }, []);

  const openCloudinaryUpload = async () => {
    if (!window.cloudinary) {
      alert("Le widget Cloudinary n'est pas encore chargé. Réessayez dans un instant.");
      return;
    }
    setUploading(true);
    try {
      await openSignedUploadWidget((url) => {
        setForm((f) => {
          const gallery = f.gallery.includes(url) ? f.gallery : [...f.gallery, url];
          return { ...f, gallery };
        });
      });
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      alert("Impossible d'initialiser l'upload (session expirée ?).");
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    const url = prompt("Collez l'URL de l'image (https://…)");
    if (!url || !url.trim()) return;
    setForm((f) => {
      const gallery = f.gallery.includes(url.trim()) ? f.gallery : [...f.gallery, url.trim()];
      return { ...f, gallery };
    });
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((u) => u !== url) }));
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    setForm((f) => {
      const gallery = [...f.gallery];
      const target = index + dir;
      if (target < 0 || target >= gallery.length) return f;
      [gallery[index], gallery[target]] = [gallery[target], gallery[index]];
      return { ...f, gallery };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mainImage = form.gallery[0];
    if (!mainImage) {
      setFormError("Une photo est obligatoire pour publier ce véhicule. Ajoutez au moins une image.");
      return;
    }
    setFormError("");
    const features = form.features.split(",").map((x) => x.trim()).filter(Boolean);
    const id = vehicle?.id || `admin-${Date.now()}`;
    const newVehicle: Vehicle = {
      id,
      name: form.name,
      brand: form.brand,
      type: form.type,
      category: form.category,
      year: form.year,
      seats: form.seats,
      transmission: form.transmission,
      fuel: form.fuel,
      mileage: form.mileage ? Number(form.mileage) : undefined,
      price: form.price,
      priceUnit: form.type === "Location" ? "FCFA/jour" : "FCFA",
      city: form.city,
      featured: form.featured,
      promo: form.promo,
      promoEndsAt: form.promo ? promoEndsAtToIso(form.promoEndsAt) : null,
      available: form.available,
      withDriver: form.withDriver,
      image: mainImage,
      gallery: form.gallery.length ? form.gallery : [mainImage],
      description: form.description,
      features,
    };
    onSave(newVehicle);
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl bg-navy-light/60 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all";
  const labelCls = "text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-8 max-w-2xl w-full border-white/10 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-white text-lg">
            {vehicle ? "Modifier le véhicule" : "Ajouter un véhicule"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
        <p className="text-[11px] text-white/30 mb-5">
          <span className="text-gold">*</span> champs obligatoires
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nom <span className="text-gold">*</span></label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Marque <span className="text-gold">*</span></label>
              <input required value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "Vente" | "Location" }))} className={`${inputCls} bo-select`}>
                <option value="Location">Location</option>
                <option value="Vente">Vente</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Catégorie</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Vehicle["category"] }))} className={`${inputCls} bo-select`}>
                {["SUV / 4x4", "Pick-up", "Berline", "Citadine", "Minibus", "Utilitaire"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Année</label>
              <input type="number" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Places</label>
              <input type="number" value={form.seats} onChange={(e) => setForm((f) => ({ ...f, seats: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Boîte</label>
              <select value={form.transmission} onChange={(e) => setForm((f) => ({ ...f, transmission: e.target.value as "Automatique" | "Manuelle" }))} className={`${inputCls} bo-select`}>
                <option value="Automatique">Automatique</option>
                <option value="Manuelle">Manuelle</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Carburant</label>
              <select value={form.fuel} onChange={(e) => setForm((f) => ({ ...f, fuel: e.target.value as "Diesel" | "Essence" }))} className={`${inputCls} bo-select`}>
                <option value="Diesel">Diesel</option>
                <option value="Essence">Essence</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Kilométrage (km)</label>
              <input type="number" value={form.mileage} onChange={(e) => setForm((f) => ({ ...f, mileage: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Prix (FCFA) <span className="text-gold">*</span></label>
              <input type="number" required value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Ville <span className="text-gold">*</span></label>
            <input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className={labelCls}>Équipements (séparés par des virgules)</label>
            <input value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} placeholder="Climatisation, GPS, Bluetooth..." className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-gold/40 transition-all">
              <button
                type="button"
                role="checkbox"
                aria-checked={form.withDriver}
                onClick={() => setForm((f) => ({ ...f, withDriver: !f.withDriver }))}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  form.withDriver ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent"
                }`}
              >
                <CheckSquare size={13} />
              </button>
              <span className="text-sm text-white/70">Avec chauffeur</span>
            </label>
            <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-gold/40 transition-all">
              <button
                type="button"
                role="checkbox"
                aria-checked={form.available}
                onClick={() => setForm((f) => ({ ...f, available: !f.available }))}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  form.available ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent"
                }`}
              >
                <CheckSquare size={13} />
              </button>
              <span className="text-sm text-white/70">Disponible</span>
            </label>
          </div>

          <div>
            <label className={labelCls}>Photos <span className="text-gold">*</span> ({form.gallery.length}) — la première est l'image principale</label>
            <div className="flex flex-wrap gap-2 mb-3">
              <button type="button" onClick={openCloudinaryUpload} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/20 text-gold text-sm font-medium hover:bg-gold/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                <Upload size={15} />
                {uploading ? "..." : "Ajouter des photos"}
              </button>
              <button type="button" onClick={addImageUrl}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm font-medium hover:bg-white/10 transition-all">
                <LinkIcon size={15} />
                Coller une URL
              </button>
            </div>
            {form.gallery.length === 0 ? (
              <p className="text-xs text-white/25">Aucune photo. Ajoutez-en via Cloudinary ou par URL — un véhicule peut avoir une ou plusieurs images.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {form.gallery.map((url, i) => (
                  <div key={url} className="relative group aspect-[4/3] rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wide bg-gold text-navy px-1.5 py-0.5 rounded-md">Principale</span>
                    )}
                    <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/40 transition-all" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0}
                        className="w-7 h-7 rounded-lg bg-white/90 text-navy flex items-center justify-center hover:bg-gold transition-colors disabled:opacity-30" title="Déplacer avant">
                        <ArrowLeftIcon size={13} />
                      </button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.gallery.length - 1}
                        className="w-7 h-7 rounded-lg bg-white/90 text-navy flex items-center justify-center hover:bg-gold transition-colors disabled:opacity-30" title="Déplacer après">
                        <ArrowRightIcon size={13} />
                      </button>
                      <button type="button" onClick={() => removeImage(url)}
                        className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors" title="Supprimer">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.featured}
              onClick={() => setForm((f) => ({ ...f, featured: !f.featured }))}
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                form.featured ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent hover:border-gold"
              }`}
            >
              <CheckSquare size={15} />
            </button>
            <div>
              <p className="text-sm font-semibold text-white">Mettre ce véhicule en vedette</p>
              <p className="text-xs text-white/50">Il apparaîtra dans la section « en vedette » de l'accueil.</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gold/10 border border-gold/25">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={form.promo}
                onClick={() => setForm((f) => ({ ...f, promo: !f.promo }))}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                  form.promo ? "bg-gold border-gold text-navy" : "border-white/30 text-transparent hover:border-gold"
                }`}
              >
                <CheckSquare size={15} />
              </button>
              <div>
                <p className="text-sm font-semibold text-gold">Mettre ce véhicule en promo</p>
                <p className="text-xs text-white/50">Il apparaîtra dans le bandeau promo du site public.</p>
              </div>
            </div>
            {form.promo && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide bg-gold text-navy px-2.5 py-1 rounded-lg shrink-0">
                <Megaphone size={12} /> Promo
              </span>
            )}
          </div>
          {form.promo && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Fin de la promo (facultatif)
              </label>
              <input
                type="datetime-local"
                value={form.promoEndsAt}
                onChange={(e) => setForm((f) => ({ ...f, promoEndsAt: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all [color-scheme:dark]"
              />
              <p className="text-[11px] text-white/30 mt-1.5">
                Laissez vide pour une promo sans limite de durée. Une fois la date passée, la
                promo sera désactivée automatiquement.
              </p>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/25 text-red-400 text-xs rounded-xl px-4 py-3">
              <AlertCircle size={15} />
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all">Annuler</button>
            <button type="submit" className="flex-[2] px-4 py-2.5 rounded-xl text-sm font-medium bg-gold text-navy hover:bg-gold-light transition-all">
              {vehicle ? "Enregistrer les modifications" : "Ajouter le véhicule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



export function VehicleDetailsModal({ vehicle, onClose, onEdit, onDelete }: { vehicle: Vehicle | null; onClose: () => void; onEdit?: () => void; onDelete?: () => void }) {
  const updateVehicle = useUpdateVehicle();
  const { success, error: notifyError } = useToast();
  if (!vehicle) return null;
  const handleTogglePromo = () => {
    const enable = !vehicle.promo;
    updateVehicle.mutate(
      { id: vehicle.id, promo: enable, promoPaused: false },
      {
        onSuccess: () => success(enable ? `« ${vehicle.name} » mis en promo` : `« ${vehicle.name} » retiré des promos`),
        onError: () => notifyError("Impossible de modifier la promotion"),
      }
    );
  };
  return (
    <DetailsPageShell
      title="Détails du véhicule"
      onClose={onClose}
      onEdit={onEdit}
      onDelete={onDelete}
      onTogglePromo={handleTogglePromo}
      isPromo={vehicle.promo}
      promoPaused={vehicle.promoPaused}
    >
      {vehicle.image && (
        <img src={vehicle.image} alt={vehicle.name} className="w-full h-60 object-cover rounded-xl mb-6" />
      )}
      <h4 className="font-display font-semibold text-white text-xl mb-1">{vehicle.name}</h4>
      <p className="text-xs text-white/40 mb-5">Identifiant : {vehicle.id}</p>
      <DetailsRow label="Marque">{vehicle.brand}</DetailsRow>
      <DetailsRow label="Type">{vehicle.type}</DetailsRow>
      <DetailsRow label="Catégorie">{vehicle.category}</DetailsRow>
      <DetailsRow label="Année">{vehicle.year}</DetailsRow>
      <DetailsRow label="Places">{vehicle.seats}</DetailsRow>
      <DetailsRow label="Transmission">{vehicle.transmission}</DetailsRow>
      <DetailsRow label="Carburant">{vehicle.fuel}</DetailsRow>
      {vehicle.mileage != null && <DetailsRow label="Kilométrage">{vehicle.mileage.toLocaleString("fr-FR")} km</DetailsRow>}
      <DetailsRow label="Ville">{vehicle.city}</DetailsRow>
      <DetailsRow label="Prix">{formatVehiclePrice(vehicle.price, vehicle.priceUnit)}</DetailsRow>
      <DetailsRow label="Avec chauffeur">{vehicle.withDriver ? "Oui" : "Non"}</DetailsRow>
      <DetailsRow label="Statut">
        <span className="flex flex-wrap items-center justify-end gap-2">
          {vehicle.featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold/20 text-gold">
              <Star size={11} /> En vedette
            </span>
          )}
          {vehicle.promo && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gold/20 text-gold">
              <Megaphone size={11} /> Promo
              {vehicle.promoEndsAt && !isPromoExpired(vehicle.promoEndsAt) &&
                ` — jusqu'au ${formatPromoEnd(vehicle.promoEndsAt, "fr")}`}
            </span>
          )}
          {vehicle.available ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 size={11} /> Disponible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400">
              <X size={11} /> Indisponible
            </span>
          )}
        </span>
      </DetailsRow>
      <DetailsRow label="Ajouté le">
        {vehicle.created_at ? formatDate(vehicle.created_at) : "—"}
      </DetailsRow>
      <DetailsRow label="Description">
        <span className="block text-left text-white/70 text-sm leading-relaxed">{vehicle.description || "—"}</span>
      </DetailsRow>
      <DetailsRow label="Équipements">
        <span className="flex flex-wrap gap-1.5 justify-end">
          {vehicle.features.length > 0 ? (
            vehicle.features.map((f) => (
              <span key={f} className="text-[11px] px-2 py-1 rounded-lg bg-white/10 text-white/70">{f}</span>
            ))
          ) : (
            "—"
          )}
        </span>
      </DetailsRow>
      {vehicle.gallery.length > 0 && (
        <div className="mt-5">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Galerie ({vehicle.gallery.length})</p>
          <div className="grid grid-cols-4 gap-2">
            {vehicle.gallery.map((src) => (
              <img key={src} src={src} alt="" className="w-full h-16 object-cover rounded-lg" />
            ))}
          </div>
        </div>
      )}
    </DetailsPageShell>
  );
}
