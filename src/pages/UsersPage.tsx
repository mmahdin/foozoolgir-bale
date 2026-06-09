import { useEffect, useState, useRef, useCallback } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Send,
  Trash2,
  ArrowRight,
  User as UserIcon,
  Bot,
  Link2,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchUsers,
  fetchUserMessages,
  fetchUserSentMessages,
  sendMessageToUser,
  deleteSentMessage,
  getUserLink,
  BaleUser,
  BaleMessage,
  SentMessage,
  getUserPhotoUrl,
} from "../api";

type ChatItem =
  | { kind: "received"; msg: BaleMessage; dateObj: Date }
  | { kind: "sent"; msg: SentMessage; dateObj: Date };

export default function UsersPage() {
  const [users, setUsers] = useState<BaleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<BaleUser | null>(null);

  // Chat state
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [userDeepLink, setUserDeepLink] = useState<string | null>(null);

  // View state for mobile
  const [showChat, setShowChat] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      toast.error("خطا در دریافت کاربران");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const loadChat = useCallback(async (user: BaleUser) => {
    setLoadingMessages(true);
    setChatItems([]);
    setUserDeepLink(null);
    try {
      const [msgData, sentData] = await Promise.all([
        fetchUserMessages(user.id),
        fetchUserSentMessages(user.id),
      ]);

      const items: ChatItem[] = [];

      // User received messages
      (msgData.messages || []).forEach((m: BaleMessage) => {
        items.push({ kind: "received", msg: m, dateObj: new Date(m.date) });
      });

      // Bot sent messages
      (sentData || []).forEach((m: SentMessage) => {
        items.push({ kind: "sent", msg: m, dateObj: new Date(m.sent_at) });
      });

      // Sort by date ascending
      items.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
      setChatItems(items);

      // Get user deep link
      try {
        const linkData = await getUserLink(user.id);
        setUserDeepLink(linkData.deep_link);
      } catch {}
    } catch {
      toast.error("خطا در دریافت پیام‌ها");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const selectUser = useCallback(
    (user: BaleUser) => {
      setSelectedUser(user);
      setShowChat(true);
      loadChat(user);
    },
    [loadChat]
  );

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatItems, loadingMessages]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedUser) return;
    setSending(true);
    try {
      const sentMsg = await sendMessageToUser(selectedUser.id, messageText.trim());
      setChatItems((prev) => [
        ...prev,
        { kind: "sent", msg: sentMsg, dateObj: new Date(sentMsg.sent_at) },
      ]);
      setMessageText("");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در ارسال پیام");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (entryId: string) => {
    if (!confirm("آیا از حذف این پیام مطمئن هستید؟")) return;
    setDeletingId(entryId);
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
    } catch {
      toast.error("خطا در حذف پیام");
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filtered = users.filter(
    (u) =>
      u.first_name.includes(search) ||
      u.last_name.includes(search) ||
      u.username?.includes(search) ||
      String(u.id).includes(search)
  );

  const displayName = (user: BaleUser) =>
    [user.first_name, user.last_name].filter(Boolean).join(" ") || `کاربر ${user.id}`;

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("کپی شد!");
  };

  // Group chat items by date
  const groupedItems: { date: string; items: ChatItem[] }[] = [];
  let lastDate = "";
  chatItems.forEach((item) => {
    const dateStr = item.dateObj.toLocaleDateString("fa-IR");
    if (dateStr !== lastDate) {
      groupedItems.push({ date: dateStr, items: [] });
      lastDate = dateStr;
    }
    groupedItems[groupedItems.length - 1].items.push(item);
  });

  return (
    <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-8.5rem)] flex rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      {/* Users List Panel */}
      <div
        className={`${
          showChat ? "hidden lg:flex" : "flex"
        } flex-col w-full lg:w-80 xl:w-96 border-l border-slate-200 bg-white`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              <h2 className="font-bold text-slate-800">کاربران</h2>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                {users.length}
              </span>
            </div>
            <button
              onClick={load}
              className="p-2 rounded-lg hover:bg-slate-100 transition"
            >
              <RefreshCw size={15} className={`text-slate-400 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                  <div className="w-11 h-11 bg-slate-100 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-100 rounded w-24" />
                    <div className="h-2 bg-slate-50 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Users size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm">کاربری پیدا نشد</p>
            </div>
          ) : (
            filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => selectUser(user)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-right ${
                  selectedUser?.id === user.id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden relative">
                  <img
                    src={getUserPhotoUrl(user.id)}
                    alt=""
                    className="w-full h-full object-cover absolute inset-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="relative z-10">{(user.first_name || "؟")[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {displayName(user)}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {user.username ? `@${user.username} · ` : ""}
                    {user.message_count > 0 ? `${user.message_count} پیام` : ""}
                  </div>
                </div>
                <div className="text-[10px] text-slate-300 flex-shrink-0">
                  {formatTime(user.last_seen)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div
        className={`${
          showChat ? "flex" : "hidden lg:flex"
        } flex-col flex-1 min-w-0 bg-slate-50`}
      >
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
              <button
                onClick={() => {
                  setShowChat(false);
                  setSelectedUser(null);
                }}
                className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100"
              >
                <ArrowRight size={18} className="text-slate-500" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden relative">
                <img
                  src={getUserPhotoUrl(selectedUser.id)}
                  alt=""
                  className="w-full h-full object-cover absolute inset-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="relative z-10">{(selectedUser.first_name || "؟")[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 text-sm truncate">
                  {displayName(selectedUser)}
                </div>
                <div className="text-xs text-slate-400">
                  {selectedUser.username ? `@${selectedUser.username} · ` : ""}
                  ID: {selectedUser.id}
                </div>
              </div>
              {userDeepLink && (
                <button
                  onClick={() => copyToClipboard(userDeepLink)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-xs"
                >
                  <Link2 size={12} />
                  لینک
                </button>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {loadingMessages ? (
                <div className="space-y-4 py-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                    >
                      <div className="max-w-[70%] h-12 bg-white rounded-2xl animate-pulse w-48" />
                    </div>
                  ))}
                </div>
              ) : chatItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquareIcon />
                  <p className="mt-3 text-sm">هیچ پیامی ثبت نشده</p>
                  <p className="text-xs mt-1">اولین پیام را ارسال کنید</p>
                </div>
              ) : (
                groupedItems.map((group, gi) => (
                  <div key={gi}>
                    {/* Date separator */}
                    <div className="flex items-center justify-center py-3">
                      <span className="text-[11px] text-slate-400 bg-white px-3 py-1 rounded-full shadow-sm">
                        {group.date}
                      </span>
                    </div>

                    {group.items.map((item, idx) => {
                      if (item.kind === "received") {
                        const msg = item.msg;
                        return (
                          <div
                            key={`r-${msg.message_id}-${idx}`}
                            className="flex justify-start mb-1 animate-fade-in-up"
                          >
                            {/* User avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ml-2 mt-1 overflow-hidden relative">
                              <span className="relative z-10">
                                {(selectedUser.first_name || "؟")[0]}
                              </span>
                            </div>
                            {/* Message bubble */}
                            <div className="max-w-[75%] bg-white rounded-2xl rounded-tr-sm shadow-sm px-4 py-2.5">
                              <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                                {msg.text || "—"}
                              </p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] text-slate-300">
                                  {formatTime(msg.date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        const msg = item.msg;
                        return (
                          <div
                            key={`s-${msg.id}-${idx}`}
                            className="flex justify-end mb-1 animate-fade-in-up group"
                          >
                            {/* Message bubble */}
                            <div className="max-w-[75%] relative">
                              <div
                                className={`rounded-2xl rounded-tl-sm px-4 py-2.5 ${
                                  msg.deleted
                                    ? "bg-slate-100 text-slate-400"
                                    : "bg-blue-500 text-white"
                                }`}
                              >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                  {msg.text}
                                  {msg.deleted && (
                                    <span className="text-xs opacity-60"> (حذف شده)</span>
                                  )}
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-1">
                                  <span
                                    className={`text-[10px] ${
                                      msg.deleted ? "text-slate-300" : "text-blue-200"
                                    }`}
                                  >
                                    {formatTime(msg.sent_at)}
                                  </span>
                                  {msg.deleted ? (
                                    <span className="text-[10px] text-slate-300">🗑️</span>
                                  ) : (
                                    <Check size={12} className="text-blue-200" />
                                  )}
                                </div>
                              </div>
                              {/* Delete button */}
                              {!msg.deleted && (
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  disabled={deletingId === msg.id}
                                  className="absolute -left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white shadow-md border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                  title="حذف پیام"
                                >
                                  {deletingId === msg.id ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={12} />
                                  )}
                                </button>
                              )}
                            </div>
                            {/* Bot avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white flex-shrink-0 mr-2 mt-1">
                              <Bot size={14} />
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Send Message Input */}
            <div className="p-3 bg-white border-t border-slate-200">
              <div className="flex items-end gap-2">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="پیام خود را بنویسید..."
                  rows={1}
                  className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none max-h-32"
                  style={{
                    minHeight: "42px",
                    height: "auto",
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = Math.min(target.scrollHeight, 128) + "px";
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !messageText.trim()}
                  className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {sending ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} className="rotate-180" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <UserIcon size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium">یک کاربر انتخاب کنید</p>
            <p className="text-xs mt-1">برای مشاهده تاریخچه چت</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageSquareIcon() {
  return (
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-slate-300"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </div>
  );
}
