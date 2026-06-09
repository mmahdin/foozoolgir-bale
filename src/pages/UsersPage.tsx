import { useEffect, useRef, useState } from "react";
import {
  Search, User, Send, Trash2, X, RefreshCw, MessageCircle
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchUsers, fetchUserMessages, fetchUserSentMessages,
  sendMessageToUser, deleteSentMessage,
  getUserPhotoUrl, BaleUser, BaleMessage, SentMessage
} from "../api";

// ─── ChatItem type ────────────────────────────────────────
type ChatItem =
  | { kind: "received"; msg: BaleMessage }
  | { kind: "sent"; msg: SentMessage };

export default function UsersPage() {
  const [users, setUsers] = useState<BaleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<BaleUser | null>(null);
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendText, setSendText] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatItems]);

  const openUser = async (user: BaleUser) => {
    setSelectedUser(user);
    setSendText("");
    setLoadingMessages(true);
    try {
      const [msgData, sentData] = await Promise.all([
        fetchUserMessages(user.id),
        fetchUserSentMessages(user.id),
      ]);

      const received: ChatItem[] = (msgData.messages || []).map((msg: BaleMessage) => ({
        kind: "received",
        msg,
      }));
      const sent: ChatItem[] = (sentData || []).map((msg: SentMessage) => ({
        kind: "sent",
        msg,
      }));

      // Merge and sort by date
      const all: ChatItem[] = [...received, ...sent].sort((a, b) => {
        const dateA =
          a.kind === "received"
            ? new Date(a.msg.date).getTime()
            : new Date((a.msg as SentMessage).sent_at).getTime();
        const dateB =
          b.kind === "received"
            ? new Date(b.msg.date).getTime()
            : new Date((b.msg as SentMessage).sent_at).getTime();
        return dateA - dateB;
      });

      setChatItems(all);
    } catch {
      setChatItems([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!sendText.trim() || !selectedUser) return;
    setSending(true);
    try {
      const sent = await sendMessageToUser(selectedUser.id, sendText.trim());
      const newItem: ChatItem = { kind: "sent", msg: sent };
      setChatItems((prev) => [...prev, newItem]);
      setSendText("");
      toast.success("پیام ارسال شد ✅");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("پیام از طرف ربات حذف می‌شود. مطمئنید؟")) return;
    try {
      await deleteSentMessage(entryId);
      setChatItems((prev) =>
        prev.map((item) =>
          item.kind === "sent" && item.msg.id === entryId
            ? { ...item, msg: { ...item.msg, deleted: true } }
            : item
        )
      );
      toast.success("پیام حذف شد");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در حذف پیام");
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      String(u.id).includes(q)
    );
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("fa-IR", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("fa-IR", {
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return ""; }
  };

  const displayName = (user: BaleUser) =>
    [user.first_name, user.last_name].filter(Boolean).join(" ") || `کاربر ${user.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">کاربران</h1>
          <p className="text-slate-500 text-sm mt-1">
            {users.length} کاربر ثبت‌شده در ربات
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در نام، یوزرنیم یا آیدی..."
          className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* User List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-16 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <User size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">کاربری پیدا نشد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => openUser(user)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:border-blue-200 hover:shadow-md transition text-right"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                <img
                  src={getUserPhotoUrl(user.id)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {(user.first_name || "؟")[0]}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <div className="font-semibold text-slate-800">{displayName(user)}</div>
                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  {user.username && <span>@{user.username}</span>}
                  <span>ID: {user.id}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <MessageCircle size={12} />
                  {user.message_count}
                </div>
                <div className="text-xs text-slate-400 mt-1">{formatDate(user.last_seen).split("،")[0]}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* User Chat Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-4 p-5 border-b border-slate-100 flex-shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                <img
                  src={getUserPhotoUrl(selectedUser.id)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {(selectedUser.first_name || "؟")[0]}
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-800">{displayName(selectedUser)}</div>
                <div className="text-xs text-slate-400">
                  {selectedUser.username ? `@${selectedUser.username} · ` : ""}
                  ID: {selectedUser.id}
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)}>
                <X size={20} className="text-slate-400 hover:text-slate-600 transition" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {loadingMessages ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-12 rounded-2xl animate-pulse ${i % 2 === 0 ? "bg-slate-200 mr-12" : "bg-blue-100 ml-12"}`}
                    />
                  ))}
                </div>
              ) : chatItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <MessageCircle size={36} className="mx-auto mb-2 opacity-50" />
                  <p>هیچ پیامی ثبت نشده</p>
                </div>
              ) : (
                <>
                  {chatItems.map((item, idx) => {
                    if (item.kind === "received") {
                      const msg = item.msg;
                      return (
                        <div key={`r-${msg.message_id}-${idx}`} className="flex items-end gap-2">
                          {/* User avatar */}
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(selectedUser.first_name || "؟")[0]}
                          </div>
                          <div className="max-w-[72%]">
                            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{msg.text || "—"}</p>
                            </div>
                            <div className="text-xs text-slate-400 mt-1 mr-1">{formatTime(msg.date)}</div>
                          </div>
                        </div>
                      );
                    } else {
                      const msg = item.msg as SentMessage;
                      return (
                        <div key={`s-${msg.id}-${idx}`} className="flex items-end gap-2 flex-row-reverse">
                          {/* Bot avatar */}
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white flex-shrink-0">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="2" y="4" width="20" height="16" rx="2"/>
                              <path d="M9 11h6M9 15h4"/>
                              <circle cx="8" cy="8" r="1" fill="currentColor"/>
                              <circle cx="16" cy="8" r="1" fill="currentColor"/>
                            </svg>
                          </div>
                          <div className="max-w-[72%]">
                            <div className={`rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm ${msg.deleted ? "bg-slate-100 border border-slate-200" : "bg-blue-600"}`}>
                              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${msg.deleted ? "text-slate-400 line-through" : "text-white"}`}>
                                {msg.text}
                                {msg.deleted && " (حذف شده)"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1 ml-1 justify-end">
                              <span className="text-xs text-slate-400">{formatTime(msg.sent_at)}</span>
                              {!msg.deleted && (
                                <button
                                  onClick={() => handleDelete(msg.id)}
                                  className="text-xs text-red-400 hover:text-red-600 transition flex items-center gap-0.5"
                                  title="حذف پیام ربات"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Send Message */}
            <div className="p-4 border-t border-slate-100 bg-white flex-shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={sendText}
                  onChange={(e) => setSendText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="پیام ربات را بنویسید... (Enter = ارسال، Shift+Enter = خط جدید)"
                  rows={2}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !sendText.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm disabled:opacity-50 flex-shrink-0"
                >
                  {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">پیام‌های ربات (آبی) قابل حذف هستند</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
