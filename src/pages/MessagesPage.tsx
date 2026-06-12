import { useEffect, useState } from "react";
import { MessageSquare, RefreshCw, User, Image, Video } from "lucide-react";
import { fetchUsers, fetchUserMessages, BaleUser, BaleMessage, getUserPhotoUrl } from "../api";

export default function MessagesPage() {
  const [allMessages, setAllMessages] = useState<(BaleMessage & { user?: BaleUser })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const usersData = await fetchUsers();
      const msgs: (BaleMessage & { user?: BaleUser })[] = [];
      for (const user of usersData.slice(0, 20)) {
        try {
          const data = await fetchUserMessages(user.id);
          (data.messages || []).forEach((m: BaleMessage) => {
            msgs.push({ ...m, user });
          });
        } catch {
          // skip
        }
      }
      msgs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAllMessages(msgs.slice(0, 100));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("fa-IR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const displayName = (user: BaleUser) =>
    [user.first_name, user.last_name].filter(Boolean).join(" ") || `کاربر ${user.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">پیام‌ها</h1>
          </div>
          <p className="text-slate-500 text-sm">
            آخرین پیام‌های دریافتی از کاربران (نمایش تا ۱۰۰ پیام)
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          بارگذاری مجدد
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : allMessages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">هیچ پیامی پیدا نشد</p>
        </div>
      ) : (
        <div className="space-y-2">
          {allMessages.map((msg, idx) => (
            <div
              key={`${msg.message_id}-${idx}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                {msg.user ? (
                  <>
                    <img
                      src={getUserPhotoUrl(msg.user.id)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {(msg.user.first_name || "؟")[0]}
                  </>
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-slate-800 text-sm">
                    {msg.user ? displayName(msg.user) : `کاربر ${msg.user_id}`}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(msg.date)}</span>
                </div>
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.media_type === "photo" && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      <Image size={12} /> عکس
                    </span>
                  )}
                  {msg.media_type === "video" && (
                    <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                      <Video size={12} /> ویدئو
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-3">
                  {msg.text || (msg.media_type ? `[${msg.media_type === "photo" ? "عکس" : "ویدئو"}]` : "—")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
