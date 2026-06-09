import { useEffect, useState } from "react";
import { Star, RefreshCw, Save, Trash2, Plus, Search } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchSpecialMessages,
  setSpecialMessage,
  deleteSpecialMessage,
  fetchBotMessages,
  fetchUsers,
  BaleUser,
  BotMessage,
  SpecialMessageEntry,
} from "../api";

export default function SpecialMessagesPage() {
  const [entries, setEntries] = useState<SpecialMessageEntry[]>([]);
  const [botMessages, setBotMessages] = useState<BotMessage[]>([]);
  const [users, setUsers] = useState<BaleUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [formUserId, setFormUserId] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formText, setFormText] = useState("");
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [entriesData, botMsgsData, usersData] = await Promise.all([
        fetchSpecialMessages(),
        fetchBotMessages(),
        fetchUsers(),
      ]);
      setEntries(entriesData);
      setBotMessages(botMsgsData);
      setUsers(usersData);
    } catch {
      toast.error("خطا در دریافت اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const displayName = (user: BaleUser) =>
    [user.first_name, user.last_name].filter(Boolean).join(" ") || `کاربر ${user.id}`;

  const filteredUsers = users.filter(
    (u) =>
      u.first_name.includes(userSearch) ||
      u.last_name.includes(userSearch) ||
      u.username?.includes(userSearch) ||
      String(u.id).includes(userSearch)
  );

  const handleSave = async () => {
    if (!formUserId.trim() || !formKey.trim() || !formText.trim()) {
      toast.error("تمام فیلدها را پر کنید");
      return;
    }
    setSaving(true);
    try {
      await setSpecialMessage(Number(formUserId), formKey, formText);
      toast.success("ذخیره شد ✅");
      setFormUserId("");
      setFormKey("");
      setFormText("");
      setShowForm(false);
      load();
    } catch {
      toast.error("خطا در ذخیره");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Star size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">پیام‌های ویژه</h1>
          </div>
          <p className="text-slate-500 text-sm">برای هر کاربر می‌توانید پیام‌های سفارشی تعریف کنید</p>
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
            پیام جدید
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">تعریف پیام ویژه</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">کاربر مورد نظر *</label>
              <div className="relative">
                <div className="relative mb-2">
                  <Search size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="جستجو بین کاربران..."
                    className="w-full pr-8 pl-3 py-2 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                {userSearch && (
                  <div className="bg-white rounded-xl border border-amber-200 max-h-32 overflow-y-auto mb-2">
                    {filteredUsers.slice(0, 10).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setFormUserId(String(u.id));
                          setUserSearch("");
                        }}
                        className="w-full text-right px-3 py-2 text-sm hover:bg-amber-50 text-slate-700"
                      >
                        {displayName(u)}{" "}
                        <span className="text-xs text-slate-400">({u.id})</span>
                      </button>
                    ))}
                    {filteredUsers.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-400">کاربری پیدا نشد</p>
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
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">متن پیام ویژه *</label>
            <textarea
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-amber-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
              placeholder="متن سفارشی را وارد کنید..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
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
          <p className="text-slate-500">هیچ پیام ویژه‌ای تعریف نشده</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const user = entry.user;
            const msgKeys = Object.keys(entry.messages);
            return (
              <div
                key={entry.user_id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {user ? (user.first_name || "؟")[0] : "?"}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {user ? displayName(user) : `کاربر ${entry.user_id}`}
                    </div>
                    <div className="text-xs text-slate-400">ID: {entry.user_id}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {msgKeys.map((key) => (
                    <div
                      key={key}
                      className="flex items-start justify-between gap-3 bg-amber-50 rounded-xl p-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-amber-700 mb-1">{key}</div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                          {entry.messages[key]}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.user_id, key)}
                        className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-400 hover:text-red-500 transition flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
