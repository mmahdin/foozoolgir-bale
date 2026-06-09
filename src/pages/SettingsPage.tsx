import { useEffect, useState } from "react";
import { Settings, Bot, Webhook, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { fetchBotInfo } from "../api";

export default function SettingsPage() {
  const [botInfo, setBotInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [deletingWebhook, setDeletingWebhook] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBotInfo();
      setBotInfo(data);
    } catch {
      setBotInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSetWebhook = async () => {
    if (!webhookUrl.trim()) {
      toast.error("آدرس webhook را وارد کنید");
      return;
    }
    setSettingWebhook(true);
    try {
      await axios.post("http://localhost:8000/api/bot/set-webhook", {
        webhook_url: webhookUrl.trim(),
      });
      toast.success("Webhook با موفقیت تنظیم شد");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در تنظیم webhook");
    } finally {
      setSettingWebhook(false);
    }
  };

  const handleDeleteWebhook = async () => {
    setDeletingWebhook(true);
    try {
      await axios.post("http://localhost:8000/api/bot/delete-webhook");
      toast.success("Webhook حذف شد - Long Polling فعال است");
    } catch {
      toast.error("خطا در حذف webhook");
    } finally {
      setDeletingWebhook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings size={22} />
          تنظیمات
        </h1>
        <p className="text-slate-500 text-sm mt-1">مدیریت ربات و تنظیمات webhook</p>
      </div>

      {/* Bot Info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Bot size={18} />
          اطلاعات ربات
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : botInfo?.ok ? (
          <div className="space-y-3">
            {[
              { label: "نام ربات", value: botInfo.result?.first_name },
              { label: "یوزرنیم", value: `@${botInfo.result?.username}` },
              { label: "شناسه (ID)", value: botInfo.result?.id },
              { label: "Can Join Groups", value: botInfo.result?.can_join_groups ? "✅ بله" : "❌ خیر" },
              { label: "Can Read All Messages", value: botInfo.result?.can_read_all_group_messages ? "✅ بله" : "❌ خیر" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className="text-sm font-medium text-slate-800">{item.value || "—"}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-red-50 rounded-xl p-4 text-red-600 text-sm">
            ❌ نمی‌توان به API بله متصل شد. مطمئن شوید توکن صحیح است و سرور اجرا است.
          </div>
        )}

        <button
          onClick={load}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition text-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          بروزرسانی
        </button>
      </div>

      {/* Webhook Settings */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Webhook size={18} />
          تنظیمات Webhook
        </h2>

        <div className="bg-blue-50 rounded-xl p-4 text-blue-700 text-sm mb-4">
          <p className="font-medium mb-1">📡 حالت فعلی: Long Polling</p>
          <p className="text-blue-600 text-xs">
            بدون تنظیم webhook، ربات به‌صورت خودکار با Long Polling آپدیت دریافت می‌کند.
            اگر سرور عمومی دارید می‌توانید webhook تنظیم کنید.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              آدرس Webhook
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-slate-400 mt-1">
              فقط درگاه‌های 443 و 88 پشتیبانی می‌شوند
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSetWebhook}
              disabled={settingWebhook}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition disabled:opacity-50"
            >
              {settingWebhook ? "در حال تنظیم..." : "تنظیم Webhook"}
            </button>
            <button
              onClick={handleDeleteWebhook}
              disabled={deletingWebhook}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm hover:bg-red-100 transition disabled:opacity-50"
            >
              {deletingWebhook ? "در حال حذف..." : "حذف Webhook"}
            </button>
          </div>
        </div>
      </div>

      {/* Data Location */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="font-semibold text-slate-700 mb-4">📁 محل ذخیره‌سازی داده‌ها</h2>
        <div className="space-y-2 text-sm">
          {[
            { path: "backend/data/links.json", desc: "لینک‌های اختصاصی" },
            { path: "backend/data/users/", desc: "اطلاعات کاربران (هر کاربر یک فایل)" },
            { path: "backend/data/messages/", desc: "پیام‌های کاربران" },
            { path: "backend/data/profile_photos/", desc: "عکس‌های پروفایل دانلودشده" },
          ].map((item) => (
            <div key={item.path} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
              <code className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-mono flex-shrink-0">
                {item.path}
              </code>
              <span className="text-slate-500">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
