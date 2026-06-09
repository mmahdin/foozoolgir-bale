import { useEffect, useState } from "react";
import { Star, Plus, Trash2, Save, RefreshCw, Info, X, Search } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchSpecialMessages, setSpecialMessage, deleteSpecialMessage,
  fetchBotMessages, fetchUsers, SpecialMessageEntry, BotMessage, BaleUser
} from "../api";

const KEY_LABELS: Record<string, string> = {
  welcome_with_link: "خوش‌آمدگویی (با کلیک روی لینک)",
  welcome_direct: "خوش‌آمدگویی (ورود مستقیم)",
  message_received: "تأییدیه دریافت پیام",
  notify_owner: "اطلاع‌رسانی به صاحب لینک",
  getlink_response: "پاسخ دستور /getlink",
};

export default function SpecialMessagesPage() {
  const [entries, setEntries] = useState<SpecialMessageEntry[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [users, setUsers] = useState<BaleUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formKey, setFormKey] = useState("welcome_with_link");
  const [formText, setFormText] = useState("");
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [specialData, botData, usersData] = await Promise.all([
        fetchSpecialMessages(),
        fetchBotMessages(),
        fetchUsers(),
      ]);
      setEntries(specialData);
      setBotMessages(botData);
      setUsers(usersData);
    } catch {
      toast.error("خطا در بارگذاری اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // When key changes, prefill with default bot message
  useEffect(() => {
    if (showForm) {
      const defaultMsg = botMessages.find((m) => m.key === formKey);
      if (defaultMsg && !formText) {
        setFormText(defaultMsg.text);
      }
    }
  }, [formKey, showForm]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUserId.trim() || !formText.trim()) {
      toast.error("شناسه کاربر و متن الزامی است");
      return;
    }
    const userId = parseInt(formUserId.trim());
    if (isNaN(userId)) {
      toast.error("شناسه کاربر باید عدد باشد");
      return;
    }
    setSaving(true);
    try {
      await setSpecialMessage(userId, formKey, formText.trim());
      toast.success("پیام ویژه ذخیره شد ✅");
      setFormUserId("");
      setFormText("");
      setShowForm(false);
      setUserSearch("");
      await load();
    } catch {
      toast.error("خطا در ذخیره پیام ویژه");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number, key: string) => {
    if (!confirm("این پیام ویژه حذف می‌شود. مطمئنید؟")) return;
    try {
      await deleteSpecialMessage(userId, key);
      toast.success("حذف شد");
      await load();
    } catch {
      toast.error("خطا در حذف");
    }
  };

  const getDefaultText = (key: string) => {
    return botMessages.find((m) => m.key === key)?.text || "";
  };

  const displayName = (user: BaleUser | null) => {
    if (!user) return "کاربر ناشناس";
    return [user.first_name, user.last_name].filter(Boolean).join(" ") || `کاربر ${user.id}`;
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      String(u.id).includes(q)
    );
  });

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
            برای هر کاربر می‌توانید پیام‌های سفارشی تعریف کنید
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
            onClick={() => { setShowForm(!showForm); setFormText(""); setUserSearch(""); }}
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
          <strong>نحوه کار:</strong> وقتی شخصی روی لینک یک کاربر کلیک کند، ربات ابتدا پیام ویژه آن کاربر را بررسی می‌کند. اگر پیام ویژه‌ای تعریف شده باشد، همان ارسال می‌شود؛ در غیر این صورت پیام عمومی ربات فرستاده می‌شود.
          <br />
          شناسه کاربر را از <strong>آیدی عددی</strong> یا <strong>یوزرنیم</strong> کاربر وارد کنید.
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
                  کاربر مورد نظر *
                </label>
                {/* User search/select */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="جستجو بین کاربران..."
                      className="w-full pr-8 pl-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  {userSearch && (
                    <div className="bg-white border border-amber-200 rounded-xl max-h-40 overflow-y-auto">
                      {filteredUsers.slice(0, 10).map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setFormUserId(String(u.id));
                            setUserSearch(`${[u.first_name, u.last_name].filter(Boolean).join(" ")} (${u.id})`);
                          }}
                          className="w-full text-right px-3 py-2 hover:bg-amber-50 transition text-sm flex items-center gap-2"
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(u.first_name || "؟")[0]}
                          </div>
                          <div>
                            <div className="text-slate-800 font-medium">{[u.first_name, u.last_name].filter(Boolean).join(" ") || `کاربر ${u.id}`}</div>
                            <div className="text-xs text-slate-400">{u.username ? `@${u.username} · ` : ""}ID: {u.id}</div>
                          </div>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <p className="text-center text-slate-400 py-3 text-sm">کاربری پیدا نشد</p>
                      )}
                    </div>
                  )}
                  <input
                    type="number"
                    value={formUserId}
                    onChange={(e) => setFormUserId(e.target.value)}
                    placeholder="یا مستقیم آیدی عددی وارد کنید: 123456789"
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">
                  نوع پیام *
                </label>
                <select
                  value={formKey}
                  onChange={(e) => {
                    setFormKey(e.target.value);
                    setFormText(getDefaultText(e.target.value));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {botMessages.map((m) => (
                    <option key={m.key} value={m.key}>
                      {KEY_LABELS[m.key] || m.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-amber-700 mt-1">
                  {botMessages.find(m => m.key === formKey)?.description || ""}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-amber-800 mb-1">
                متن پیام ویژه *
              </label>
              <textarea
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                rows={4}
                placeholder="متن پیامی که ربات برای این کاربر می‌فرستد..."
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                required
              />
              <p className="text-xs text-amber-600 mt-1">
                متغیرهای قابل استفاده: {botMessages.find(m => m.key === formKey)?.variables.map(v => `{${v}}`).join(", ") || "—"}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !formUserId.trim() || !formText.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition text-sm disabled:opacity-50"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                ذخیره پیام ویژه
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm"
              >
                انصراف
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Star size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">هیچ پیام ویژه‌ای تعریف نشده</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-amber-600 text-sm hover:underline"
          >
            اولین پیام ویژه را بسازید
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              {/* User Info */}
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {entry.user ? (entry.user.first_name || "؟")[0] : "؟"}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{displayName(entry.user)}</div>
                  <div className="text-xs text-slate-400">
                    {entry.user?.username ? `@${entry.user.username} · ` : ""}
                    ID: {entry.user_id}
                  </div>
                </div>
                <div className="mr-auto text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                  {Object.keys(entry.messages).length} پیام ویژه
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-3">
                {Object.entries(entry.messages).map(([key, text]) => (
                  <div key={key} className="bg-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        {KEY_LABELS[key] || key}
                      </span>
                      <button
                        onClick={() => handleDelete(entry.user_id, key)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition"
                      >
                        <Trash2 size={12} />
                        حذف
                      </button>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
