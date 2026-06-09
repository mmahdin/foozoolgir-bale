import { useEffect, useState } from "react";
import { Star, Plus, Trash2, RefreshCw, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchSpecialMessages,
  setSpecialMessage,
  deleteSpecialMessage,
  fetchUsers,
  fetchBotMessages,
  BaleUser,
  BotMessage,
  SpecialMessageEntry,
} from "../api";

export default function SpecialMessagesPage() {
  const [entries, setEntries] = useState<SpecialMessageEntry[]>([]);
  const [users, setUsers] = useState<BaleUser[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formUserId, setFormUserId] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formText, setFormText] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [entriesData, usersData, botMsgsData] = await Promise.all([
        fetchSpecialMessages(),
        fetchUsers(),
        fetchBotMessages(),
      ]);
      setEntries(entriesData);
      setUsers(usersData);
      setBotMessages(botMsgsData);
    } catch {
      toast.error("خطا در دریافت داده‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!formUserId.trim() || !formKey.trim() || !formText.trim()) {
      toast.error("همه فیلدها الزامی است");
      return;
    }
    setSaving(true);
    try {
      await setSpecialMessage(Number(formUserId), formKey, formText);
      toast.success("پیام ویژه ذخیره شد ✅");
      setFormUserId("");
      setFormKey("");
      setFormText("");
      setUserSearch("");
      setShowForm(false);
      load();
    } catch {
      toast.error("خطا در ذخیره پیام ویژه");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number, key: string) => {
    if (!confirm("آیا از حذف این پیام ویژه مطمئن هستید؟")) return;
    try {
      await deleteSpecialMessage(userId, key);
      toast.success("حذف شد");
      load();
    } catch {
      toast.error("خطا در حذف");
    }
  };

  const displayName = (user: BaleUser) =>
    [user.first_name, user.last_name].filter(Boolean).join(" ") || `کاربر ${user.id}`;

  const filteredUsers = users.filter(
    (u) =>
      u.first_name.includes(userSearch) ||
      u.last_name.includes(userSearch) ||
      u.username?.includes(userSearch) ||
      String(u.id).includes(userSearch)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">پیام‌های ویژه</h1>
          </div>
          <p className="text-slate-500 text-sm">
            تنظیم پیام سفارشی برای هر کاربر — جایگزین پیام پیش‌فرض ربات
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            بارگذاری
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm shadow-sm"
          >
            <Plus size={15} />
            پیام ویژه جدید
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-700 text-sm">
        💡 پیام‌های ویژه به شما اجازه می‌دهند برای هر کاربر یک متن سفارشی تنظیم کنید. وقتی کاربر پیامی دریافت کند، به جای متن پیش‌فرض، متن ویژه نمایش داده می‌شود.
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">افزودن پیام ویژه</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            {/* User selection */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">کاربر مورد نظر *</label>
              <div className="space-y-2">
                <div className="relative">
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
                        onClick={() => {
                          setFormUserId(String(u.id));
                          setUserSearch(displayName(u));
                        }}
                        className="w-full text-right px-3 py-2 hover:bg-amber-50 text-sm transition"
                      >
                        {displayName(u)}{" "}
                        <span className="text-slate-400 text-xs">
                          {u.username ? `@${u.username}` : `ID: ${u.id}`}
                        </span>
                      </button>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="text-sm text-slate-400 p-3">کاربری پیدا نشد</p>
                    )}
                  </div>
                )}
                <input
                  type="text"
                  value={formUserId}
                  onChange={(e) => setFormUserId(e.target.value)}
                  placeholder="یا مستقیم آیدی عددی وارد کنید: 123456789"
                  className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>
            </div>

            {/* Key selection */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">نوع پیام *</label>
              <select
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">انتخاب کنید...</option>
                {botMessages.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                {botMessages.find((m) => m.key === formKey)?.description || ""}
              </p>
            </div>

            {/* Text */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">متن پیام ویژه *</label>
              <textarea
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                dir="auto"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition text-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              ذخیره
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Star size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">هنوز پیام ویژه‌ای تنظیم نشده</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.user_id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {entry.user
                      ? (entry.user.first_name || "؟")[0]
                      : "U"}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {entry.user ? displayName(entry.user) : `کاربر ${entry.user_id}`}
                    </p>
                    <p className="text-xs text-slate-400">ID: {entry.user_id}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {Object.entries(entry.messages).map(([key, text]) => (
                  <div
                    key={key}
                    className="flex items-start gap-3 bg-slate-50 rounded-xl p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-blue-600 mb-1">{key}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{text}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.user_id, key)}
                      className="text-red-400 hover:text-red-600 transition flex-shrink-0"
                      title="حذف"
                    >
                      <Trash2 size={14} />
                    </button>
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
