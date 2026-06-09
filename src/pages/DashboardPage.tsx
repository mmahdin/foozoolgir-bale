import { useEffect, useState } from "react";
import {
  Users, Link2, MessageSquare, MousePointerClick,
  Activity, Send, CheckCircle
} from "lucide-react";
import { fetchStats, Stats } from "../api";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch(() => setError("خطا در اتصال به سرور"))
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        {
          label: "تعداد کاربران",
          value: stats.total_users,
          icon: <Users size={22} />,
          color: "bg-blue-50 text-blue-600",
          border: "border-blue-100",
        },
        {
          label: "لینک‌های اختصاصی",
          value: stats.total_links,
          icon: <Link2 size={22} />,
          color: "bg-violet-50 text-violet-600",
          border: "border-violet-100",
        },
        {
          label: "پیام‌های دریافتی",
          value: stats.total_messages,
          icon: <MessageSquare size={22} />,
          color: "bg-amber-50 text-amber-600",
          border: "border-amber-100",
        },
        {
          label: "کل کلیک‌ها",
          value: stats.total_clicks,
          icon: <MousePointerClick size={22} />,
          color: "bg-rose-50 text-rose-600",
          border: "border-rose-100",
        },
        {
          label: "پیام‌های ارسالی از ربات",
          value: stats.total_sent_messages,
          icon: <Send size={22} />,
          color: "bg-sky-50 text-sky-600",
          border: "border-sky-100",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">داشبورد</h1>
        <p className="text-slate-500 text-sm mt-1">
          {stats
            ? stats.bot_token_set
              ? `ربات @${stats.bot_username || "—"} فعال است`
              : "⚠️ توکن ربات تنظیم نشده"
            : "در حال بارگذاری..."}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          ❌ {error} — بررسی کنید که سرور روی پورت ۸۰۰۰ اجرا شده باشد.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-100 p-5 h-28 animate-pulse"
              />
            ))
          : cards.map((card) => (
              <div
                key={card.label}
                className={`bg-white rounded-2xl border ${card.border} p-5 flex items-center gap-4 shadow-sm`}
              >
                <div className={`rounded-xl p-3 ${card.color}`}>
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
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-slate-500" />
            <h2 className="font-semibold text-slate-700">وضعیت ربات</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between bg-slate-50 rounded-xl px-4 py-3">
              <span className="text-slate-500">یوزرنیم</span>
              <span className="font-medium text-slate-700 font-mono">
                @{stats.bot_username || "—"}
              </span>
            </div>
            <div className="flex justify-between bg-slate-50 rounded-xl px-4 py-3">
              <span className="text-slate-500">توکن</span>
              <span
                className={`font-medium ${stats.bot_token_set ? "text-emerald-600" : "text-red-500"}`}
              >
                {stats.bot_token_set ? "✅ تنظیم شده" : "❌ تنظیم نشده"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Guide */}
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 border border-blue-100 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-700 mb-3">🚀 راهنمای سریع</h3>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mt-0.5">1.</span>
            <span>
              کاربران می‌توانند دستور <code className="bg-white px-1 py-0.5 rounded text-blue-700">/getlink</code> را به ربات بفرستند تا لینک اختصاصی‌شان را دریافت کنند
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mt-0.5">2.</span>
            <span>
              وقتی کسی روی لینک اختصاصی یک نفر کلیک کند، ربات هر دو طرف را مطلع می‌کند
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mt-0.5">3.</span>
            <span>
              از صفحه «لینک‌ها» می‌توانید لینک‌های اختصاصی بسازید و مدیریت کنید
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-500 font-bold mt-0.5">4.</span>
            <span>
              از صفحه «پیام‌های ویژه» می‌توانید برای هر کاربر پیام سفارشی‌سازی شده تنظیم کنید
            </span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <span>
              در صفحه «کاربران» می‌توانید مکالمه کامل چت با هر کاربر را مشاهده کنید
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
