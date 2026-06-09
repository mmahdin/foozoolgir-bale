import { useEffect, useState, useRef, useCallback } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Send,
  Trash2,
  ArrowRight,
  MessageSquare,
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
      toast.error("خطا در دریافت لیست کاربران");
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

      // Bot sent messages (includes both panel-sent and bot-sent)
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
      {/* Users List */}
      <div
        className={`${
          showChat ? "hidden lg:flex" : "flex"
        } w-full lg:w-80 flex-col border-l border-slate-100 bg-slate-50/50`}
      >
        {/* Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Users */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                  <div className="w-10 h-10 rounded-xl bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-20" />
                    <div className="h-2 bg-slate-200 rounded w-14" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center">
              <Users size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">کاربری یافت نشد</p>
            </div>
          ) : (
            filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => selectUser(user)}
                className={`w-full flex items-center gap-3 p-3 transition text-right ${
                  selectedUser?.id === user.id
                    ? "bg-blue-50 border-l-2 border-blue-500"
                    : "hover:bg-slate-100"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden relative">
                  <img
                    src={getUserPhotoUrl(user.id)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    {(user.first_name || "؟")[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {displayName(user)}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user.username ? `@${user.username}` : `ID: ${user.id}`}
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  {user.message_count > 0 && (
                    <span className="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px]">
                      {user.message_count}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${
        showChat ? "flex" : "hidden lg:flex"
      } flex-1 flex-col min-w-0`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white">
              <button
                onClick={() => setShowChat(false)}
                className="lg:hidden p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <ArrowRight size={18} className="text-slate-600" />
              </button>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden relative">
                <img
                  src={getUserPhotoUrl(selectedUser.id)}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  {(selectedUser.first_name || "؟")[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {displayName(selectedUser)}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedUser.username ? `@${selectedUser.username} · ` : ""}
                  ID: {selectedUser.id}
                </p>
              </div>
              {userDeepLink && (
                <button
                  onClick={() => copyToClipboard(userDeepLink)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-xs"
                >
                  <Link2 size={12} />
                  لینک
                </button>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-slate-50/30">
              {loadingMessages ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-12 rounded-2xl bg-slate-200 animate-pulse ${
                        i % 2 === 0 ? "mr-auto w-48" : "ml-auto w-56"
                      }`}
                    />
                  ))}
                </div>
              ) : chatItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare size={40} className="mb-2 text-slate-300" />
                  <p className="text-sm">هیچ پیامی ثبت نشده</p>
                  <p className="text-xs mt-1">اولین پیام را ارسال کنید</p>
                </div>
              ) : (
                groupedItems.map((group, gi) => (
                  <div key={gi}>
                    {/* Date separator */}
                    <div className="flex items-center justify-center my-3">
                      <span className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100">
                        {group.date}
                      </span>
                    </div>

                    {group.items.map((item, idx) => {
                      if (item.kind === "received") {
                        const msg = item.msg;
                        return (
                          <div key={`r-${msg.message_id}-${idx}`} className="flex items-end gap-2 mb-1.5 animate-fade-in-up">
                            {/* User avatar */}
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden relative">
                              <img
                                src={getUserPhotoUrl(selectedUser.id)}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center">
                                {(selectedUser.first_name || "؟")[0]}
                              </span>
                            </div>
                            {/* Message bubble */}
                            <div className="max-w-[75%] bg-white border border-slate-100 rounded-2xl rounded-br-md px-3.5 py-2 shadow-sm">
                              <p className="text-sm text-slate-800 whitespace-pre-wrap">
                                {msg.text || "—"}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1 text-left" dir="ltr">
                                {formatTime(msg.date)}
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        const msg = item.msg;
                        const isBotMessage = msg.source === "bot";
                        return (
                          <div key={`s-${msg.id}-${idx}`} className="flex items-end gap-2 mb-1.5 justify-end animate-fade-in-up">
                            {/* Message bubble */}
                            <div className={`max-w-[75%] rounded-2xl rounded-bl-md px-3.5 py-2 shadow-sm relative group ${
                              msg.deleted
                                ? "bg-slate-100 border border-slate-200"
                                : isBotMessage
                                  ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                                  : "bg-blue-500 text-white"
                            }`}>
                              {/* Bot message indicator */}
                              {isBotMessage && !msg.deleted && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Bot size={11} className="opacity-80" />
                                  <span className="text-[10px] opacity-80 font-medium">پیام خودکار ربات</span>
                                </div>
                              )}
                              <p className={`text-sm whitespace-pre-wrap ${
                                msg.deleted ? "text-slate-400 line-through" : ""
                              }`}>
                                {msg.text}
                                {msg.deleted && (
                                  <span className="text-xs mr-1"> (حذف شده)</span>
                                )}
                              </p>
                              <div className={`flex items-center gap-1 mt-1 ${isBotMessage ? 'justify-start' : 'justify-end'}`}>
                                <span className={`text-[10px] ${
                                  msg.deleted ? "text-slate-400" : isBotMessage ? "text-white/70" : "text-blue-100"
                                }`} dir="ltr">
                                  {formatTime(msg.sent_at)}
                                </span>
                                {msg.deleted ? (
                                  <span className="text-xs">🗑️</span>
                                ) : (
                                  <Check size={12} className={isBotMessage ? "text-white/70" : "text-blue-100"} />
                                )}
                              </div>
                              {/* Delete button */}
                              {!msg.deleted && (
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  disabled={deletingId === msg.id}
                                  className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition p-1 bg-white rounded-full shadow border border-slate-200 text-red-500 hover:bg-red-50 disabled:opacity-50"
                                  title="حذف پیام"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                            {/* Bot avatar for bot messages, regular for panel messages */}
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                              isBotMessage
                                ? "bg-gradient-to-br from-violet-500 to-purple-600"
                                : "bg-gradient-to-br from-blue-400 to-blue-600"
                            }`}>
                              {isBotMessage ? <Bot size={14} /> : <Send size={12} />}
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
            <div className="p-3 border-t border-slate-100 bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !messageText.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {sending ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Users size={48} className="mb-3 text-slate-300" />
            <p className="text-sm">یک کاربر را انتخاب کنید</p>
          </div>
        )}
      </div>
    </div>
  );
}
