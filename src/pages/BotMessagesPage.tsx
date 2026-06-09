import { useEffect, useState } from "react";
import { FileText, RefreshCw, Save, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { fetchBotMessages, updateBotMessage, resetBotMessage, BotMessage } from "../api";

export default function BotMessagesPage() {
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirtyMap, setDirtyMap] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setDirtyMap({});
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

  const isDirty = (key: string) => key in dirtyMap;

  const getText = (key: string, original: string) =>
    isDirty(key) ? dirtyMap[key] : original;

  const handleChange = (key: string, text: string) => {
    setDirtyMap((prev) => ({ ...prev, [key]: text }));
  };

  const handleSave = async (key: string) => {
    const text = dirtyMap[key];
    if (text === undefined) return;
    setSavingKey(key);
    try {
      await updateBotMessage(key, text);
      toast.success("ذخیره شد ✅");
      setDirtyMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      load();
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setSavingKey(null);
    }
  };

  const handleReset = async (key: string) => {
    if (!confirm("متن به حالت پیش‌فرض برگردد؟")) return;
    setSavingKey(key);
    try {
      await resetBotMessage(key);
      toast.success("بازنشانی شد");
      setDirtyMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      load();
    } catch {
      toast.error("خطا در بازنشانی");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">متون ربات</h1>
          </div>
          <p className="text-slate-500 text-sm">مدیریت متن‌های پیش‌فرض ربات</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          بارگذاری مجدد
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
              className={`bg-white rounded-2xl border shadow-sm p-5 space-y-3 transition ${
                isDirty(msg.key) ? "border-amber-300" : "border-slate-100"
              }`}
            >
              {/* Title & Description */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-800">{msg.title}</h3>
                  {isDirty(msg.key) && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">
                      ویرایش نشده
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">{msg.description}</p>
                {msg.variables.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {msg.variables.map((v) => (
                      <span
                        key={v}
                        className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg font-mono"
                      >
                        {`{${v}}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Textarea */}
              <textarea
                value={getText(msg.key, msg.text)}
                onChange={(e) => handleChange(msg.key, e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y font-mono"
                dir="auto"
              />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(msg.key)}
                  disabled={!isDirty(msg.key) || savingKey === msg.key}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm disabled:opacity-50"
                >
                  {savingKey === msg.key ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <Save size={13} />
                  )}
                  ذخیره
                </button>
                <button
                  onClick={() => handleReset(msg.key)}
                  disabled={savingKey === msg.key}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm disabled:opacity-50"
                >
                  <RotateCcw size={13} />
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
