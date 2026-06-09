import { useEffect, useState } from "react";
import { Settings, Globe, Trash2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { fetchBotInfo, fetchStats, Stats } from "../api";
import axios from "axios";

const BASE_URL = "http://localhost:8000";

export default function SettingsPage() {
  const [botInfo, setBotInfo] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [deletingWebhook, setDeletingWebhook] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [info, s] = await Promise.all([fetchBotInfo(), fetchStats()]);
      setBotInfo(info?.result);
      setStats(s);
    } catch (err: any) {
      if (err?.response?.status !== 400) {
        // ignore 400 (token not set)
      }
      const s = await fetchStats().catch(() => null);
      if (s) setStats(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSetWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;
    setSettingWebhook(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/bot/set-webhook`, {
        webhook_url: webhookUrl.trim()
      });
      if (res.data?.ok || res.data?.result) {
        toast.success("Webhook با موفقیت تنظیم شد ✅");
      } else {
        toast.error(`خطا: ${res.data?.description || "نامشخص"}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در تنظیم webhook");
    } finally {
      setSettingWebhook(false);
    }
  };

  const handleDeleteWebhook = async () => {
    if (!confirm("Webhook حذف می‌شود و ربات به حالت polling برمی‌گردد. مطمئنید؟")) return;
    setDeletingWebhook(true);
    try {
      await axios.post(`${BASE_URL}/api/bot/delete-webhook`);
      toast.success("Webhook حذف شد");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در حذف webhook");
    } finally {
      setDeletingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings size={22} className="text-slate-600" />
            <h1 className="text-2xl font-bold text-slate-800">تنظیمات</h1>
          </div>
          <p className="text-slate-500 text-sm">پیکربندی ربات و سرور</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Bot Status */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          {stats?.bot_token_set ? (
            <CheckCircle size={18} className="text-emerald-500" />
          ) : (
            <AlertCircle size={18} className="text-red-500" />
          )}
          وضعیت ربات
        </h2>

        {loading ? (
          <div className="h-24 animate-pulse bg-slate-50 rounded-xl" />
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 flex justify-between">
                <span className="text-slate-500">توکن ربات</span>
                <span className={stats?.bot_token_set ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                  {stats?.bot_token_set ? "✅ تنظیم شده" : "❌ تنظیم نشده"}
                </span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 flex justify-between">
                <span className="text-slate-500">یوزرنیم</span>
                <span className="text-slate-700 font-mono">@{stats?.bot_username || "—"}</span>
              </div>
              {botInfo && (
                <>
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between">
                    <span className="text-slate-500">نام ربات</span>
                    <span className="text-slate-700">{botInfo.first_name}</span>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 flex justify-between">
                    <span className="text-slate-500">آیدی ربات</span>
                    <span className="text-slate-700 font-mono">{botInfo.id}</span>
                  </div>
                </>
              )}
            </div>

            {!stats?.bot_token_set && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                <strong>⚠️ توکن تنظیم نشده:</strong> فایل <code>.env</code> را در پوشه backend بسازید و
                <code>BOT_TOKEN</code> و <code>BOT_USERNAME</code> را اضافه کنید.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Webhook Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <Globe size={18} className="text-blue-500" />
          تنظیم Webhook
        </h2>
        <p className="text-slate-400 text-xs mb-4">
          اگر سرور شما HTTPS دارد می‌توانید webhook را تنظیم کنید. در غیر این صورت ربات از polling استفاده می‌کند.
        </p>
        <form onSubmit={handleSetWebhook} className="space-y-3">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-domain.com/webhook"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={settingWebhook || !webhookUrl.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {settingWebhook ? "در حال تنظیم..." : "تنظیم Webhook"}
            </button>
            <button
              type="button"
              onClick={handleDeleteWebhook}
              disabled={deletingWebhook}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm hover:bg-red-100 transition disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deletingWebhook ? "در حال حذف..." : "حذف Webhook"}
            </button>
          </div>
        </form>
      </div>

      {/* .env guide */}
      <div className="bg-slate-800 rounded-2xl p-5 text-sm font-mono text-slate-200">
        <div className="text-slate-400 text-xs mb-3">📄 backend/.env</div>
        <div className="space-y-1">
          <div><span className="text-emerald-400">BOT_TOKEN</span>=<span className="text-amber-300">توکن_ربات_شما</span></div>
          <div><span className="text-emerald-400">BOT_USERNAME</span>=<span className="text-amber-300">یوزرنیم_ربات</span></div>
          <div><span className="text-emerald-400">PORT</span>=<span className="text-amber-300">8000</span></div>
        </div>
      </div>
    </div>
  );
}
