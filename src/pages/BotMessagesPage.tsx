import { useEffect, useState } from "react";
import { FileText, RefreshCw, Save, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { fetchBotMessages, updateBotMessage, resetBotMessage, BotMessage } from "../api";

export default function BotMessagesPage() {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchBotMessages();
      setMessages(data);
    } catch {
      toast.error("خطا در دریافت متون ربات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const isDirty = (key: string) => key in dirty;

  const getCurrentText = (msg: BotMessage) =>
    dirty[msg.key] !== undefined ? dirty[msg.key] : msg.text;

  const handleSave = async (key: string) => {
    const text = dirty[key];
    if (text === undefined) return;
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await updateBotMessage(key, text);
      toast.success("ذخیره شد ✅");
      setDirty((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
      load();
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const handleReset = async (key: string) => {
    if (!confirm("آیا از بازنشانی این متن مطمئن هستید؟")) return;
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await resetBotMessage(key);
      toast.success("بازنشانی شد");
      setDirty((d) => {
        const next = { ...d };
        delete next[key];
        return next;
      });
      load();
    } catch {
      toast.error("خطا در بازنشانی");
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">متون ربات</h1>
          </div>
          <p className="text-slate-500 text-sm">
            متن پیام‌های مختلف ربات را سفارشی‌سازی کنید
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          بارگذاری
        </button>
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
            <div
              key={msg.key}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3"
            >
              {/* Title & Description */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800">{msg.title}</span>
                  {isDirty(msg.key) && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                      ویرایش نشده
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{msg.description}</p>
                {msg.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {msg.variables.map((v) => (
                      <span
                        key={v}
                        className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-mono"
                      >
                        {`{${v}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Textarea */}
              <textarea
                value={getCurrentText(msg)}
                onChange={(e) => setDirty((d) => ({ ...d, [msg.key]: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
              />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(msg.key)}
                  disabled={!isDirty(msg.key) || saving[msg.key]}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-xs disabled:opacity-50"
                >
                  {saving[msg.key] ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Save size={12} />
                  )}
                  ذخیره
                </button>
                <button
                  onClick={() => handleReset(msg.key)}
                  disabled={saving[msg.key]}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-xs disabled:opacity-50"
                >
                  <RotateCcw size={12} />
                  بازنشانی
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
