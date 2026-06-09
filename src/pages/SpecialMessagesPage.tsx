import { useEffect, useState } from "react";
import { Star, Plus, Trash2, Save, RefreshCw, Info, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchSpecialMessages, setSpecialMessage, deleteSpecialMessage,
  fetchBotMessages, SpecialMessageEntry, BotMessage
} from "../api";

const KEY_LABELS: Record<string, string> = {
  welcome_with_link: "خوشامدگویی (با لینک اختصاصی)",
  welcome_direct: "خوشامدگویی (ورود مستقیم)",
  message_received: "تأییدیه دریافت پیام",
  notify_owner: "اطلاع‌رسانی به صاحب لینک",
  getlink_response: "پاسخ دستور /getlink",
};

export default function SpecialMessagesPage() {
  const [entries, setEntries] = useState<SpecialMessageEntry[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [formId, setFormId] = useState("");
  const [formKey, setFormKey] = useState("welcome_with_link");
  const [formText, setFormText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [specialData, botData] = await Promise.all([
        fetchSpecialMessages(),
        fetchBotMessages(),
      ]);
      setEntries(specialData);
      setBotMessages(botData);
      if (botData.length > 0 && !formKey) {
        setFormKey(botData[0].key);
      }
    } catch {
      toast.error("خطا در بارگذاری اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formText.trim()) {
      toast.error("شناسه و متن الزامی است");
      return;
    }
    setSaving(true);
    try {
      await setSpecialMessage(formId.trim(), formKey, formText.trim());
      toast.success("پیام ویژه ذخیره شد ✅");
      setFormId("");
      setFormText("");
      setShowForm(false);
      await load();
    } catch {
      toast.error("خطا در ذخیره پیام");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (identifier: string, key: string) => {
    if (!confirm("این پیام ویژه حذف می‌شود. مطمئنید؟")) return;
    try {
      await deleteSpecialMessage(identifier, key);
      toast.success("حذف شد");
      await load();
    } catch {
      toast.error("خطا در حذف");
    }
  };

  const getDefaultText = (key: string) => {
    return botMessages.find(m => m.key === key)?.text || "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star size={22} className="text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-800">پیام‌های ویژه</h1>
          </div>
          <p className="text-slate-500 text-sm">
            برای کاربران خاص (مثل mahdi) متن سفارشی تعیین کنید
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition text-sm shadow-sm"
          >
            <Plus size={16} />
            پیام ویژه جدید
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
        <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <strong>نحوه کار:</strong> وقتی برای یک کاربر پیام ویژه تنظیم کنید،
          ربات به جای پیام پیش‌فرض، همین متن سفارشی را برای آن کاربر ارسال می‌کند.
          شناسه می‌تواند <strong>آیدی عددی</strong> یا <strong>یوزرنیم</strong> کاربر باشد.
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-amber-800">افزودن پیام ویژه</h3>
            <button onClick={() => setShowForm(false)}>
              <X size={18} className="text-amber-600" />
            </button>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">
                  شناسه کاربر *
                </label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="مثال: 12345678 یا mahdi"
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
                <p className="text-xs text-amber-600 mt-1">آیدی عددی بله یا یوزرنیم (بدون @)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">
                  نوع پیام *
                </label>
                <select
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  {botMessages.map((m) => (
                    <option key={m.key} value={m.key}>{m.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Default text hint */}
            {formKey && (
              <div className="bg-white rounded-xl border border-amber-100 p-3 text-xs">
                <div className="text-slate-400 mb-1">متن پیش‌فرض:</div>
                <div className="text-slate-600 font-mono whitespace-pre-wrap">{getDefaultText(formKey)}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">
                متن سفارشی *
              </label>
              <textarea
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="متن پیامی که ربات به این کاربر می‌فرستد..."
                rows={4}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y font-mono"
                dir="rtl"
                required
              />
              <p className="text-xs text-amber-600 mt-1">
                می‌توانید از متغیرها استفاده کنید: {"{first_name}"}, {"{owner_name}"}, {"{visitor_name}"} و غیره
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm hover:bg-amber-600 transition disabled:opacity-50"
              >
                <Save size={15} />
                {saving ? "در حال ذخیره..." : "ذخیره"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 h-32 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Star size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">هنوز پیام ویژه‌ای تنظیم نشده</p>
          <p className="text-slate-400 text-sm mt-1">
            با کلیک روی «پیام ویژه جدید» برای یک کاربر خاص متن سفارشی بسازید
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const name = entry.user
              ? [entry.user.first_name, entry.user.last_name].filter(Boolean).join(" ") || `کاربر ${entry.identifier}`
              : entry.identifier;
            return (
              <div key={entry.identifier} className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                {/* User Header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                    {name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{name}</div>
                    <div className="text-xs text-slate-400 font-mono">
                      شناسه: {entry.identifier}
                      {entry.user?.username ? ` · @${entry.user.username}` : ""}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-3">
                  {Object.entries(entry.messages).map(([key, text]) => (
                    <div key={key} className="bg-slate-50 rounded-xl p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-500 mb-1">
                          {KEY_LABELS[key] || key}
                        </div>
                        <div className="text-sm text-slate-700 whitespace-pre-wrap break-words font-mono">
                          {text}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.identifier, key)}
                        className="p-1.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-lg transition flex-shrink-0"
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add more for this user */}
                <button
                  onClick={() => {
                    setFormId(entry.identifier);
                    setShowForm(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 transition"
                >
                  <Plus size={13} />
                  افزودن پیام دیگر برای این کاربر
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
