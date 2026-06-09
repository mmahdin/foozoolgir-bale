import { useEffect, useState } from "react";
import { Search, MessageSquare, RefreshCw, Filter } from "lucide-react";
import { fetchAllMessages, BaleMessage, BaleUser } from "../api";

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

interface MessageWithUser extends BaleMessage {
  user?: BaleUser;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllMessages();
      setMessages(data.messages);
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("fa-IR", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return iso; }
  };

  const displayName = (user?: BaleUser) => {
    if (!user) return "ناشناس";
    return [user.first_name, user.last_name].filter(Boolean).join(" ") || `کاربر ${user.id}`;
  };

  const filtered = messages.filter((msg) => {
    const q = search.toLowerCase();
    const matchText = msg.text?.toLowerCase().includes(q) ||
      displayName(msg.user).toLowerCase().includes(q) ||
      msg.user?.username?.toLowerCase().includes(q) ||
      String(msg.user_id).includes(q);
    const matchType = filterType === "all" || msg.type === filterType;
    return matchText && matchType;
  });

  const types = Array.from(new Set(messages.map(m => m.type)));

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
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در متن پیام‌ها یا نام کاربر..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm appearance-none cursor-pointer"
          >
            <option value="all">همه انواع</option>
            {types.map((t) => (
              <option key={t} value={t}>{typeLabel[t] || t}</option>
            ))}
          </select>
        </div>
      </div>

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
            {search || filterType !== "all" ? "پیامی با این مشخصات یافت نشد" : "هنوز هیچ پیامی دریافت نشده"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-start gap-3">
              {msg.user && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {displayName(msg.user)[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <span className="font-semibold text-slate-800 text-sm">
                    {displayName(msg.user)}
                  </span>
                  {msg.user?.username && (
                    <span className="text-blue-500 text-xs">@{msg.user.username}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-lg ${typeColor[msg.type] || typeColor.other}`}>
                    {typeLabel[msg.type] || msg.type}
                  </span>
                  <span className="text-slate-400 text-xs">{formatDate(msg.date)}</span>
                </div>
                {msg.text ? (
                  <div className="text-slate-700 text-sm break-words">{msg.text}</div>
                ) : (
                  <div className="text-slate-400 text-sm italic">
                    [{typeLabel[msg.type] || "محتوای غیر متنی"}]
                  </div>
                )}
                {/* Source links */}
                {msg.user?.source_links && msg.user.source_links.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {msg.user.source_links.map((sl) => (
                      <span key={sl} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono">
                        {sl.length > 14 ? sl.slice(0, 14) + "…" : sl}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
