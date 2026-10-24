import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Mail, MessageSquare, Phone, Reply, Send, Trash2, User, X } from "lucide-react";
import { type Message, useCreateMessage, useDeleteMessage, useMessages, useUpdateMessage } from "../lib/api";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";

export function MessagesSection() {
  const { data: msgs = [] } = useMessages();
  const createMessage = useCreateMessage();
  const updateMessage = useUpdateMessage();
  const deleteMessage = useDeleteMessage();

  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [msgPage, setMsgPage] = useState(1);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [deleteMsgConfirm, setDeleteMsgConfirm] = useState<string | null>(null);
  const MSGS_PER_PAGE = 10;

  const markAsRead = (id: string) => {
    updateMessage.mutate({ id, read: true });
    setSelectedMsg((prev) => prev ? { ...prev, read: true } : null);
  };

  const deleteMsg = (id: string) => {
    deleteMessage.mutate(id);
    if (selectedMsg?.id === id) setSelectedMsg(null);
  };

  const unreadCount = msgs.filter((m) => !m.read).length;
  const filtered = filter === "unread" ? msgs.filter((m) => !m.read) : msgs;

  
  useEffect(() => {
    setMsgPage(1);
  }, [filter]);

  const paginatedMsgs = useMemo(() => {
    const start = (msgPage - 1) * MSGS_PER_PAGE;
    return filtered.slice(start, start + MSGS_PER_PAGE);
  }, [filtered, msgPage]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="font-display font-bold text-white text-2xl">
          Messages{unreadCount > 0 ? ` (${unreadCount} non lu${unreadCount > 1 ? "s" : ""})` : ""}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold/20 text-gold text-xs font-medium hover:bg-gold/30 transition-all"
          >
            <Send size={13} />
            Nouveau
          </button>
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                filter === f
                  ? "bg-gold/20 text-gold"
                  : "bg-white/5 text-white/50 hover:bg-white/10"
              }`}
            >
              {f === "all" ? "Tous" : `Non lus (${unreadCount})`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {}
        <div className="lg:col-span-3 bg-white/[0.04] border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-y-auto max-h-[540px]">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-white/30 text-sm">
                Aucun message
              </div>
            ) : (
              paginatedMsgs.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedMsg(m);
                    if (!m.read) markAsRead(m.id);
                  }}
                  className={`w-full text-left px-5 py-4 border-b border-white/5 flex items-start gap-4 transition-colors hover:bg-white/[0.02] ${
                    selectedMsg?.id === m.id ? "bg-white/[0.04]" : ""
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    m.read ? "bg-transparent" : "bg-gold"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm truncate ${m.read ? "text-white/60" : "text-white font-medium"}`}>
                        {m.name}
                      </span>
                      <span className="text-[10px] text-white/30 shrink-0">
                        {new Date(m.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${m.read ? "text-white/40" : "text-white/70"}`}>
                      {m.subject}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
          {}
          <div className="hidden lg:block border-t border-white/5 px-5 py-3">
            <Pagination
              currentPage={msgPage}
              totalItems={filtered.length}
              perPage={MSGS_PER_PAGE}
              onPageChange={setMsgPage}
            />
          </div>
        </div>

        {}
        <div className="lg:col-span-2">
          {}
          <div className="lg:hidden mb-4">
            <Pagination
              currentPage={msgPage}
              totalItems={filtered.length}
              perPage={MSGS_PER_PAGE}
              onPageChange={setMsgPage}
            />
          </div>
          {selectedMsg ? (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-semibold text-white text-sm">
                  Détail du message
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateMessage.mutate({ id: selectedMsg.id, read: !selectedMsg.read });
                      setSelectedMsg((prev) => prev ? { ...prev, read: !prev.read } : null);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedMsg.read
                        ? "text-white/40 hover:text-gold hover:bg-gold/10"
                        : "text-gold bg-gold/15"
                    }`}
                  >
                    {selectedMsg.read ? "Marquer non lu" : "Lu"}
                  </button>
                  <button
                    onClick={() => setDeleteMsgConfirm(selectedMsg.id)}
                    className="text-white/30 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Nom</p>
                    <p className="text-sm text-white">{selectedMsg.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">E-mail</p>
                    <a href={`mailto:${selectedMsg.email}`} className="text-sm text-gold hover:underline">
                      {selectedMsg.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Téléphone</p>
                    <p className="text-sm text-white">{selectedMsg.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Sujet</p>
                    <p className="text-sm text-white font-medium">{selectedMsg.subject}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays size={15} className="text-gold mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-white/40">Date</p>
                    <p className="text-sm text-white">
                      {new Date(selectedMsg.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs text-white/40 mb-2">Message</p>
                  <p className="text-sm text-white/80 leading-relaxed">{selectedMsg.message}</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <a
                    href={`mailto:${selectedMsg.email}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/20 text-gold text-xs font-medium hover:bg-gold/30 transition-all"
                  >
                    <Mail size={14} />
                    Répondre
                  </a>
                  <button
                    onClick={() => {
                      setShowComposeModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/15 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-all"
                  >
                    <Reply size={14} />
                    Nouveau message
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 flex items-center justify-center h-40">
              <p className="text-sm text-white/30">Sélectionnez un message</p>
            </div>
          )}
        </div>
      </div>
      {}
      <ConfirmDialog
        open={!!deleteMsgConfirm}
        title="Supprimer le message"
        message="Voulez-vous vraiment supprimer ce message ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={() => {
          if (deleteMsgConfirm) deleteMsg(deleteMsgConfirm);
          setDeleteMsgConfirm(null);
        }}
        onCancel={() => setDeleteMsgConfirm(null)}
      />

      {}
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


export function MessageComposeModal({
  onClose,
  onSend,
}: {
  onClose: () => void;
  onSend: (msg: { name: string; email: string; phone: string; subject: string; message: string }) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      subject: form.subject,
      message: form.message,
    };
    onSend(msg);
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-12 overflow-y-auto">
      <div className="bg-gradient-to-b from-navy-light to-navy-dark rounded-2xl border border-gold/20 p-6 max-w-lg w-full border-white/10 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-white text-lg">
            Nouveau message
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Nom
              </label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                Téléphone
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              E-mail
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Sujet
            </label>
            <input
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
              Message
            </label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-gold transition-all resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gold text-navy hover:bg-gold-light transition-all"
            >
              <Send size={14} />
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





