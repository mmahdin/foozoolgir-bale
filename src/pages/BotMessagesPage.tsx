import { useEffect, useState } from "react";
import { MessageSquareText, Save, RotateCcw, Info } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchBotMessages,
  updateBotMessage,
  resetBotMessage,
  BotMessage,
} from "../api";

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
      // مقداردهی اولیه drafts
      const initial: Record<string, string> = {};
      data.forEach((m) => (initial[m.key] = m.text));
      setDrafts(initial);
    } catch {
      toast.error("خطا در بارگذاری متون ربات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquareText size={22} />
          متون ربات
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          پیام‌هایی که ربات به کاربران می‌فرستد را ویرایش کنید
        </p>
      </div>

      {/* راهنما */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-sm text-blue-700">
        <Info size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">راهنمای استفاده از متغیرها</p>
          <p className="text-blue-600 text-xs leading-relaxed">
            در متن پیام‌ها می‌توانید از متغیرهای داینامیک استفاده کنید.
            مثلاً <code className="bg-blue-100 px-1 rounded">{"{first_name}"}</code> با نام کاربر جایگزین می‌شود.
            متغیرهای مجاز هر پیام در زیر آن نوشته شده‌اند.
          </p>
        </div>
      </div>

      {/* لیست پیام‌ها */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3"
            >
              <div className="h-5 bg-slate-100 rounded-lg animate-pulse w-1/3" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
              <div className="h-28 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.key}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4"
            >
              {/* عنوان و توضیح */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                    {msg.title}
                    {isDirty(msg.key) && (
                      <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                        ویرایش نشده
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{msg.description}</p>
                </div>
                {/* متغیرهای مجاز */}
                {msg.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {msg.variables.map((v) => (
                      <code
                        key={v}
                        className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono"
                      >
                        {`{${v}}`}
                      </code>
                    ))}
                  </div>
                )}
              </div>

              {/* textarea */}
              <textarea
                value={drafts[msg.key] ?? msg.text}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [msg.key]: e.target.value }))
                }
                rows={5}
                dir="auto"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y font-inherit"
                placeholder="متن پیام را وارد کنید..."
              />

              {/* دکمه‌ها */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => handleReset(msg.key)}
                  disabled={resetting[msg.key]}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl text-slate-500 hover:bg-slate-100 transition disabled:opacity-50"
                >
                  <RotateCcw size={14} className={resetting[msg.key] ? "animate-spin" : ""} />
                  بازگشت به پیش‌فرض
                </button>
                <button
                  onClick={() => handleSave(msg.key)}
                  disabled={saving[msg.key] || !isDirty(msg.key)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
                >
                  <Save size={14} />
                  {saving[msg.key] ? "در حال ذخیره..." : "ذخیره"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
