import { useEffect, useState } from "react";
import { Users, Link2, MessageSquare, MousePointerClick, Bot, RefreshCw } from "lucide-react";
import { fetchStats, Stats } from "../api";
import StatCard from "../components/StatCard";

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
    } catch {
      setError("خطا در اتصال به سرور. مطمئن شوید بک‌اند روی پورت 8000 اجرا است.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">داشبورد</h1>
          <p className="text-slate-500 text-sm mt-1">آمار کلی ربات بله</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          بروزرسانی
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Grid */}
      {loading && !stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-24 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="کاربران ثبت‌شده"
            value={stats.total_users}
            icon={<Users size={22} className="text-white" />}
            color="bg-violet-500"
            subtitle="کاربر منحصربه‌فرد"
          />
          <StatCard
            title="لینک‌های اختصاصی"
            value={stats.total_links}
            icon={<Link2 size={22} className="text-white" />}
            color="bg-blue-500"
            subtitle="لینک ساخته‌شده"
          />
          <StatCard
            title="پیام‌های دریافتی"
            value={stats.total_messages}
            icon={<MessageSquare size={22} className="text-white" />}
            color="bg-emerald-500"
            subtitle="کل پیام‌ها"
          />
          <StatCard
            title="کل کلیک‌ها"
            value={stats.total_clicks}
            icon={<MousePointerClick size={22} className="text-white" />}
            color="bg-orange-500"
            subtitle="روی لینک‌های اختصاصی"
          />
        </div>
      ) : null}

      {/* Bot Status */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Bot size={18} />
            وضعیت ربات
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">یوزرنیم ربات</span>
              <span className="text-sm font-medium text-slate-800">
                {stats.bot_username ? `@${stats.bot_username}` : "تنظیم نشده"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50">
              <span className="text-sm text-slate-500">توکن ربات</span>
              <span className={`text-sm font-medium ${stats.bot_token_set ? "text-emerald-600" : "text-red-500"}`}>
                {stats.bot_token_set ? "✅ تنظیم شده" : "❌ تنظیم نشده"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-500">حالت دریافت آپدیت</span>
              <span className="text-sm font-medium text-blue-600">Long Polling</span>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide */}
      {stats && !stats.bot_token_set && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-800 mb-3">🚀 راهنمای راه‌اندازی</h3>
          <ol className="text-sm text-amber-700 space-y-2 list-decimal list-inside">
            <li>در بله، با <strong>@botfather</strong> صحبت کنید و ربات بسازید</li>
            <li>توکن دریافتی را در فایل <code className="bg-amber-100 px-1 rounded">backend/.env</code> قرار دهید</li>
            <li>یوزرنیم ربات را هم در همان فایل وارد کنید</li>
            <li>سرور را دوباره اجرا کنید: <code className="bg-amber-100 px-1 rounded">python main.py</code></li>
          </ol>
        </div>
      )}
    </div>
  );
}
