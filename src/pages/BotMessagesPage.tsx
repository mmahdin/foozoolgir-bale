import { useEffect, useState } from "react";
import { MessageSquare, RefreshCw, Save, RotateCcw, Info } from "lucide-react";
import toast from "react-hot-toast";
import { fetchBotMessages, updateBotMessage, resetBotMessage, BotMessage } from "../api";

export default function BotMessagesPage() {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [resetting, setResetting] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBotMessages();
      setMessages(data);
      const initial: Record<string, string> = {};
      data.forEach((m) => (initial[m.key] = m.text));
      setDrafts(initial);
    } catch {
      toast.error("خطا در بارگذاری متون ربات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (key: string) => {
    const text = drafts[key];
    if (!text?.trim()) {
      toast.error("متن پیام نمی‌تواند خالی باشد");
      return;
    }
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await updateBotMessage(key, text);
      setMessages((prev) =>
        prev.map((m) => (m.key === key ? { ...m, text } : m))
      );
      toast.success("پیام با موفقیت ذخیره شد ✅");
    } catch {
      toast.error("خطا در ذخیره پیام");
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const handleReset = async (key: string) => {
    if (!confirm("متن به پیش‌فرض اولیه برمی‌گردد. مطمئنید؟")) return;
    setResetting((r) => ({ ...r, [key]: true }));
    try {
      const updated = await resetBotMessage(key);
      setMessages((prev) =>
        prev.map((m) => (m.key === key ? updated : m))
      );
      setDrafts((d) => ({ ...d, [key]: updated.text }));
      toast.success("پیام به حالت پیش‌فرض بازگشت");
    } catch {
      toast.error("خطا در بازگشت به پیش‌فرض");
    } finally {
      setResetting((r) => ({ ...r, [key]: false }));
    }
  };

  const isDirty = (key: string) => {
    const msg = messages.find((m) => m.key === key);
    return msg && drafts[key] !== msg.text;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">متون ربات</h1>
          </div>
          <p className="text-slate-500 text-sm">
            پیام‌هایی که ربات به کاربران می‌فرستد را ویرایش کنید
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

      {/* Guide */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
        <Info size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-700">
          <strong>راهنما:</strong> در متن پیام‌ها می‌توانید از متغیرها استفاده کنید.
          مثلاً <code className="bg-amber-100 px-1 rounded">{"{first_name}"}</code> با نام کاربر جایگزین می‌شود.
          متغیرهای مجاز هر پیام در زیر آن نوشته شده‌اند.
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.key} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              {/* Title & Description */}
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{msg.title}</h3>
                    {isDirty(msg.key) && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">
                        ویرایش نشده
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs">{msg.description}</p>
                  {msg.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.variables.map((v) => (
                        <code key={v} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">
                          {`{${v}}`}
                        </code>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReset(msg.key)}
                    disabled={resetting[msg.key]}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    <RotateCcw size={12} className={resetting[msg.key] ? "animate-spin" : ""} />
                    پیش‌فرض
                  </button>
                  <button
                    onClick={() => handleSave(msg.key)}
                    disabled={saving[msg.key] || !isDirty(msg.key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    <Save size={12} />
                    {saving[msg.key] ? "ذخیره..." : "ذخیره"}
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={drafts[msg.key] || ""}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [msg.key]: e.target.value }))
                }
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y font-mono leading-relaxed"
                dir="rtl"
              />

              {/* Preview */}
              {drafts[msg.key] && (
                <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-3 border border-slate-100">
                  <div className="text-xs text-slate-400 mb-1">پیش‌نمایش:</div>
                  <div className="text-slate-700 text-sm whitespace-pre-wrap">{drafts[msg.key]}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
