import { useEffect, useState } from "react";
import { Users, Link2, MessageSquare, MousePointerClick, Send, RefreshCw } from "lucide-react";
import { fetchStats, Stats } from "../api";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "خطا در دریافت آمار");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cards = stats
    ? [
        {
          icon: <Users size={22} className="text-blue-600" />,
          value: stats.total_users,
          label: "کاربران",
          color: "bg-blue-50",
        },
        {
          icon: <Link2 size={22} className="text-violet-600" />,
          value: stats.total_links,
          label: "لینک‌ها",
          color: "bg-violet-50",
        },
        {
          icon: <MessageSquare size={22} className="text-emerald-600" />,
          value: stats.total_messages,
          label: "پیام‌ها",
          color: "bg-emerald-50",
        },
        {
          icon: <MousePointerClick size={22} className="text-amber-600" />,
          value: stats.total_clicks,
          label: "کلیک‌ها",
          color: "bg-amber-50",
        },
        {
          icon: <Send size={22} className="text-rose-600" />,
          value: stats.total_sent_messages,
          label: "پیام‌های ارسالی",
          color: "bg-rose-50",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">داشبورد</h1>
          <p className="text-slate-500 text-sm">نمای کلی از وضعیت ربات</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          بارگذاری مجدد
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
          ❌ {error} — بررسی کنید که سرور روی پورت ۸۰۰۰ اجرا شده باشد.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 h-28 animate-pulse"
              />
            ))
          : cards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                  {card.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-800">
                    {card.value.toLocaleString("fa-IR")}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
                </div>
              </div>
            ))}
      </div>

      {/* Bot Status */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            🤖 وضعیت ربات
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">یوزرنیم</span>
              <span className="text-slate-800 font-mono bg-slate-50 px-3 py-1 rounded-lg">
                @{stats.bot_username || "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">توکن</span>
              <span className="text-slate-800">
                {stats.bot_token_set ? "✅ تنظیم شده" : "❌ تنظیم نشده"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Guide */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4">🚀 راهنمای سریع</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">۱</span>
            <p className="text-sm text-slate-600">
              کاربران می‌توانند دستور /getlink را به ربات بفرستند تا لینک اختصاصی‌شان را دریافت کنند
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">۲</span>
            <p className="text-sm text-slate-600">
              وقتی کسی روی لینک اختصاصی یک نفر کلیک کند، ربات هر دو طرف را مطلع می‌کند
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">۳</span>
            <p className="text-sm text-slate-600">
              از صفحه «لینک‌ها» می‌توانید لینک‌های اختصاصی بسازید و مدیریت کنید
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">۴</span>
            <p className="text-sm text-slate-600">
              از صفحه «پیام‌های ویژه» می‌توانید برای هر کاربر پیام سفارشی‌سازی شده تنظیم کنید
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">۵</span>
            <p className="text-sm text-slate-600">
              در صفحه «کاربران» می‌توانید مکالمه کامل چت با هر کاربر را مانند تلگرام مشاهده کنید
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
