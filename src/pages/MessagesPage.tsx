import { useEffect, useState } from "react";
import { MessageSquare, RefreshCw, Search } from "lucide-react";
import { fetchUsers, fetchUserMessages, BaleUser, BaleMessage } from "../api";
import Avatar from "../components/Avatar";

interface MessageWithUser extends BaleMessage {
  user?: BaleUser;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const users = await fetchUsers();
      const allMessages: MessageWithUser[] = [];

      await Promise.all(
        users.map(async (user) => {
          try {
            const data = await fetchUserMessages(user.id);
            const msgs = (data.messages as BaleMessage[]).map((m) => ({
              ...m,
              user_id: user.id,
              user,
            }));
            allMessages.push(...msgs);
          } catch {
            // ignore
          }
        })
      );

      // Sort by date descending
      allMessages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMessages(allMessages);
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = messages.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.text?.toLowerCase().includes(q) ||
      m.user?.first_name?.toLowerCase().includes(q) ||
      m.user?.username?.toLowerCase().includes(q)
    );
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fa-IR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const typeLabel: Record<string, string> = {
    text: "متن",
    photo: "عکس",
    video: "ویدیو",
    audio: "صدا",
    voice: "پیام صوتی",
    document: "فایل",
    sticker: "استیکر",
    contact: "مخاطب",
    location: "موقعیت",
    other: "سایر",
  };

  const typeColor: Record<string, string> = {
    text: "bg-blue-100 text-blue-700",
    photo: "bg-emerald-100 text-emerald-700",
    video: "bg-purple-100 text-purple-700",
    audio: "bg-yellow-100 text-yellow-700",
    voice: "bg-orange-100 text-orange-700",
    document: "bg-slate-100 text-slate-600",
    sticker: "bg-pink-100 text-pink-700",
    other: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">پیام‌ها</h1>
          <p className="text-slate-500 text-sm mt-1">
            {messages.length} پیام دریافت‌شده از تمام کاربران
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          بروزرسانی
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در متن پیام‌ها یا نام کاربر..."
          className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Messages */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-24 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <MessageSquare size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {search ? "پیامی با این متن یافت نشد" : "هنوز هیچ پیامی دریافت نشده"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-3"
            >
              {msg.user && (
                <Avatar
                  userId={msg.user.id}
                  firstName={msg.user.first_name}
                  size="sm"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-800 text-sm">
                    {msg.user?.first_name} {msg.user?.last_name}
                  </span>
                  {msg.user?.username && (
                    <span className="text-xs text-blue-400">@{msg.user.username}</span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      typeColor[msg.type] || typeColor.other
                    }`}
                  >
                    {typeLabel[msg.type] || msg.type}
                  </span>
                  <span className="text-xs text-slate-400 mr-auto">{formatDate(msg.date)}</span>
                </div>
                {msg.text ? (
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-3">
                    {msg.text}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 italic">
                    [{typeLabel[msg.type] || "محتوای غیر متنی"}]
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
