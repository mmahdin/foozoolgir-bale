import { useEffect, useState } from "react";
import { Link2, Plus, Trash2, RefreshCw, Copy, Users as UsersIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchLinks,
  createLink,
  deleteLink,
  fetchLinkVisitors,
  BaleLink,
  BaleUser,
} from "../api";

export default function LinksPage() {
  const [links, setLinks] = useState<BaleLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Visitors modal
  const [visitorsData, setVisitorsData] = useState<{
    link_name: string;
    click_count: number;
    visitors: BaleUser[];
  } | null>(null);
  const [loadingVisitors, setLoadingVisitors] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchLinks();
      setLinks(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "خطا در دریافت لینک‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!formName.trim()) {
      toast.error("نام لینک را وارد کنید");
      return;
    }
    setCreating(true);
    try {
      await createLink(formName.trim(), formLabel.trim());
      toast.success("لینک ساخته شد ✅");
      setFormName("");
      setFormLabel("");
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "خطا در ساخت لینک");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`آیا از حذف لینک "${name}" مطمئن هستید؟`)) return;
    try {
      await deleteLink(name);
      toast.success("لینک حذف شد");
      load();
    } catch {
      toast.error("خطا در حذف لینک");
    }
  };

  const handleViewVisitors = async (name: string) => {
    setLoadingVisitors(true);
    setVisitorsData(null);
    try {
      const data = await fetchLinkVisitors(name);
      setVisitorsData(data);
    } catch {
      toast.error("خطا در دریافت بازدیدکنندگان");
    } finally {
      setLoadingVisitors(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("کپی شد!");
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const displayName = (user: BaleUser) =>
    [user.first_name, user.last_name].filter(Boolean).join(" ") || `کاربر ${user.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-800">لینک‌ها</h1>
          </div>
          <p className="text-slate-500 text-sm">
            مدیریت لینک‌های اختصاصی ربات — هر لینک یک توکن منحصربه‌فرد دارد
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
            لینک جدید
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-slate-700">ساخت لینک جدید</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">نام لینک (انگلیسی)</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="مثال: my_link"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">برچسب (نمایشی)</label>
              <input
                type="text"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="مثال: لینک من"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm disabled:opacity-50"
            >
              {creating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
              ساخت
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-600 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm">
        💡 نحوه عملکرد لینک‌ها: وقتی لینک اختصاصی یک کاربر (مثلاً جواد) توسط شخص دیگری (مثلاً رضا) باز می‌شود، ربات به رضا می‌گوید «به جواد می‌گم که می‌خواستی پروفایلش رو چک کنی» و به جواد اطلاع می‌دهد که «رضا پروفایلت رو دید».
      </div>

      {/* Links List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-32 animate-pulse" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Link2 size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">هنوز لینکی ساخته نشده</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
          >
            + ساخت اولین لینک
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <div
              key={link.name}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 size={16} className="text-blue-500" />
                    <span className="font-semibold text-slate-800">{link.name}</span>
                    {link.label && link.label !== link.name && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">
                        {link.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg flex-1 truncate font-mono">
                      {link.deep_link}
                    </code>
                    <button
                      onClick={() => copyToClipboard(link.deep_link)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                    >
                      <Copy size={14} className="text-slate-400" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MousePointer /> {link.click_count} کلیک
                    </span>
                    <span className="flex items-center gap-1">
                      <UsersIcon size={12} /> {link.visitors?.length || 0} بازدیدکننده
                    </span>
                    <span>ساخته شده: {formatDate(link.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(link.visitors?.length || 0) > 0 && (
                    <button
                      onClick={() => handleViewVisitors(link.name)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-xs"
                    >
                      <UsersIcon size={12} />
                      بازدیدکنندگان
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(link.name)}
                    className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Visitors Modal */}
      {(visitorsData || loadingVisitors) && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setVisitorsData(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[70vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">بازدیدکنندگان</h3>
              <button
                onClick={() => setVisitorsData(null)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {loadingVisitors ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : visitorsData?.visitors?.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-8">هیچ بازدیدکننده‌ای ثبت نشده</p>
              ) : (
                <div className="space-y-2">
                  {visitorsData?.visitors?.map((user: BaleUser) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
                        {(user.first_name || "؟")[0]}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{displayName(user)}</div>
                        {user.username && (
                          <div className="text-xs text-slate-400">@{user.username}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MousePointer() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  );
}
