import { useEffect, useState } from "react";
import {
  Search, MessageSquare, User, Send, Trash2, X, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchUsers, fetchUserMessages, fetchUserSentMessages,
  sendMessageToUser, deleteSentMessage,
  getUserPhotoUrl, BaleUser, BaleMessage, SentMessage
} from "../api";

export default function UsersPage() {
  const [users, setUsers] = useState<BaleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<BaleUser | null>(null);
  const [userMessages, setUserMessages] = useState<BaleMessage[]>([]);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendText, setSendText] = useState("");
  const [sending, setSending] = useState(false);
  const [showSent, setShowSent] = useState(true);
  const [showReceived, setShowReceived] = useState(true);

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

  const openUser = async (user: BaleUser) => {
    setSelectedUser(user);
    setSendText("");
    setLoadingMessages(true);
    try {
      const [msgData, sentData] = await Promise.all([
        fetchUserMessages(user.id),
        fetchUserSentMessages(user.id),
      ]);
      setUserMessages(msgData.messages);
      setSentMessages(sentData);
    } catch {
      setUserMessages([]);
      setSentMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!sendText.trim() || !selectedUser) return;
    setSending(true);
    try {
      const sent = await sendMessageToUser(selectedUser.id, sendText.trim());
      setSentMessages((prev) => [sent, ...prev]);
      setSendText("");
      toast.success("پیام ارسال شد ✅");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("پیام از چت کاربر هم حذف می‌شود. مطمئنید؟")) return;
    try {
      await deleteSentMessage(entryId);
      setSentMessages((prev) =>
        prev.map((m) => m.id === entryId ? { ...m, deleted: true } : m)
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
          ⚠️ {error}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center gap-4 p-6 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden flex-shrink-0">
                <img
                  src={getUserPhotoUrl(selectedUser.id)}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  className="w-full h-full object-cover"
                  alt=""
                />
                {displayName(selectedUser)[0]}
              </div>
              <div className="flex-1">
                <div className="font-bold text-slate-800 text-lg">
                  {displayName(selectedUser)}
                </div>
                {selectedUser.username && (
                  <div className="text-blue-500 text-sm">@{selectedUser.username}</div>
                )}
                <div className="text-slate-400 text-xs font-mono">ID: {selectedUser.id}</div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-slate-400 text-xs mb-1">اولین مشاهده</div>
                  <div className="font-medium text-slate-700">{formatDate(selectedUser.first_seen)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <div className="text-slate-400 text-xs mb-1">آخرین فعالیت</div>
                  <div className="font-medium text-slate-700">{formatDate(selectedUser.last_seen)}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                  <div className="text-slate-400 text-xs mb-2">منابع ورود</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUser.source_links.length > 0 ? (
                      selectedUser.source_links.map((s) => (
                        <span key={s} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg text-xs font-mono">
                          {s.length > 16 ? s.slice(0, 16) + "…" : s}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs">ورود مستقیم</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Send Message */}
              <div className="border border-blue-200 bg-blue-50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3 font-semibold text-blue-700 text-sm">
                  <Send size={15} />
                  ارسال پیام به {selectedUser.first_name}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={sendText}
                    onChange={(e) => setSendText(e.target.value)}
                    placeholder="متن پیام..."
                    rows={2}
                    className="flex-1 px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !sendText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition disabled:opacity-50 self-end"
                  >
                    {sending ? "..." : "ارسال"}
                  </button>
                </div>
              </div>

              {/* Sent Messages */}
              <div>
                <button
                  onClick={() => setShowSent(!showSent)}
                  className="flex items-center gap-2 w-full text-right font-semibold text-slate-700 text-sm mb-2"
                >
                  <Send size={15} className="text-blue-500" />
                  پیام‌های ارسالی از پنل ({sentMessages.filter(m => !m.deleted).length})
                  {showSent ? <ChevronUp size={15} className="ml-auto" /> : <ChevronDown size={15} className="ml-auto" />}
                </button>
                {showSent && (
                  loadingMessages ? (
                    <div className="text-slate-400 text-sm text-center py-2">در حال بارگذاری...</div>
                  ) : sentMessages.length === 0 ? (
                    <div className="text-slate-400 text-sm text-center py-2">هیچ پیام ارسالی‌ای وجود ندارد</div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sentMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start justify-between gap-2 bg-white border rounded-xl px-3 py-2 text-sm ${msg.deleted ? "opacity-50 border-slate-100" : "border-blue-100"}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`text-slate-700 break-words ${msg.deleted ? "line-through text-slate-400" : ""}`}>
                              {msg.text}
                            </div>
                            <div className="text-slate-400 text-xs mt-1">{formatDate(msg.sent_at)}</div>
                          </div>
                          {!msg.deleted && (
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition flex-shrink-0"
                              title="حذف پیام"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {msg.deleted && (
                            <span className="text-xs text-slate-400 flex-shrink-0">حذف شده</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Received Messages */}
              <div>
                <button
                  onClick={() => setShowReceived(!showReceived)}
                  className="flex items-center gap-2 w-full text-right font-semibold text-slate-700 text-sm mb-2"
                >
                  <MessageSquare size={15} className="text-violet-500" />
                  پیام‌های دریافتی ({userMessages.length})
                  {showReceived ? <ChevronUp size={15} className="ml-auto" /> : <ChevronDown size={15} className="ml-auto" />}
                </button>
                {showReceived && (
                  loadingMessages ? (
                    <div className="text-slate-400 text-sm text-center py-2">در حال بارگذاری...</div>
                  ) : userMessages.length === 0 ? (
                    <div className="text-slate-400 text-sm text-center py-2">هیچ پیامی ثبت نشده</div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {[...userMessages].reverse().map((msg, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl px-3 py-2 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-lg text-xs">
                              {msg.type}
                            </span>
                            <span className="text-slate-400 text-xs">{formatDate(msg.date)}</span>
                          </div>
                          {msg.text && (
                            <div className="text-slate-700 break-words">{msg.text}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading && users.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-20 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <User size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {search ? "کاربری با این مشخصات یافت نشد" : "هنوز هیچ کاربری ثبت نشده"}
          </p>
          {!search && (
            <p className="text-slate-400 text-sm mt-1">
              وقتی کاربری لینک شما را باز کند اینجا نمایش داده می‌شود
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => openUser(user)}
              className="w-full bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:border-blue-200 hover:shadow-sm transition text-right"
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-base overflow-hidden flex-shrink-0">
                <img
                  src={getUserPhotoUrl(user.id)}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  className="w-full h-full object-cover"
                  alt=""
                />
                {displayName(user)[0]}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 truncate">
                  {displayName(user)}
                </div>
                <div className="text-sm text-slate-400 truncate">
                  {user.username ? `@${user.username} · ` : ""}
                  آخرین فعالیت: {formatDate(user.last_seen)}
                </div>
              </div>
              {/* Stats */}
              <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <MessageSquare size={12} />
                  {user.message_count}
                </div>
                {user.source_links.length > 0 && (
                  <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">
                    {user.source_links.length} لینک
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
