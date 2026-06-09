import { useEffect, useState } from "react";
import { Settings, Save, RefreshCw, Eye, EyeOff, Info } from "lucide-react";
import toast from "react-hot-toast";
import { fetchSettings, updateSettings, setWebhook } from "../api";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [settingWebhook, setSettingWebhook] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchSettings();
      setSettings(data);
    } catch {
      // Settings might not be available
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success("تنظیمات ذخیره شد ✅");
    } catch {
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const handleSetWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.error("آدرس webhook را وارد کنید");
      return;
    }
    setSettingWebhook(true);
    try {
      await setWebhook(webhookUrl.trim());
      toast.success("Webhook با موفقیت تنظیم شد ✅");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در تنظیم webhook");
    } finally {
      setSettingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-800">تنظیمات</h1>
        </div>
        <p className="text-slate-500 text-sm">تنظیمات ربات بله</p>
      </div>

      {/* Bot Token */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">توکن ربات</h2>
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={settings.bot_token || ""}
            onChange={(e) => setSettings((s) => ({ ...s, bot_token: e.target.value }))}
            placeholder="توکن ربات بله را اینجا وارد کنید"
            className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
          />
          <button
            onClick={() => setShowToken(!showToken)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
          >
            {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <p className="text-xs text-slate-400">توکن را از @BotFather در بله دریافت کنید</p>
      </div>

      {/* Bot Username */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">یوزرنیم ربات</h2>
        <input
          type="text"
          value={settings.bot_username || ""}
          onChange={(e) => setSettings((s) => ({ ...s, bot_username: e.target.value }))}
          placeholder="مثال: mybot"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="text-xs text-slate-400">یوزرنیم ربات برای ساخت لینک‌های عمیق (deep link) استفاده می‌شود</p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm shadow-sm disabled:opacity-50"
      >
        {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
        ذخیره تنظیمات
      </button>

      {/* Webhook Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">تنظیم Webhook</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2">
          <Info size={15} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            اگر می‌خواهید به جای polling از webhook استفاده کنید، آدرس public سرور خود را وارد کنید
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSetWebhook}
            disabled={settingWebhook || !webhookUrl.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition text-sm disabled:opacity-50"
          >
            {settingWebhook ? <RefreshCw size={14} className="animate-spin" /> : null}
            تنظیم
          </button>
        </div>
      </div>

      {/* Raw Settings */}
      {Object.keys(settings).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-semibold text-slate-700 mb-3">سایر تنظیمات</h2>
          <div className="space-y-3">
            {Object.entries(settings)
              .filter(([key]) => !["bot_token", "bot_username"].includes(key))
              .map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-500 mb-1 font-mono">{key}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
