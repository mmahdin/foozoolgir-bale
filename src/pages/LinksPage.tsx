import { useEffect, useState } from "react";
import {
  Plus, Trash2, Copy, MousePointerClick,
  Link2, RefreshCw, Users, ExternalLink, X
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchLinks, createLink, deleteLink, fetchLinkVisitors,
  BaleLink, BaleUser
} from "../api";

export default function LinksPage() {
  const [links, setLinks] = useState<BaleLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);

  // Visitors modal
  const [visitorsData, setVisitorsData] = useState<any>(null);
  const [loadingVisitors, setLoadingVisitors] = useState(false);

  const loadLinks = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchLinks();
      setLinks(data);
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLinks(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const link = await createLink(newName.trim(), newLabel.trim());
      setLinks((prev) => [...prev, link]);
      setNewName("");
      setNewLabel("");
      setShowForm(false);
      toast.success(`لینک "${newName}" با موفقیت ساخته شد!`);
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
      setLinks((prev) => prev.filter((l) => l.name !== name));
      toast.success(`لینک "${name}" حذف شد`);
    } catch {
      toast.error("خطا در حذف لینک");
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("لینک کپی شد!");
  };

  const showVisitors = async (name: string) => {
    setLoadingVisitors(true);
    setVisitorsData(null);
    try {
      const data = await fetchLinkVisitors(name);
      setVisitorsData(data);
    } catch {
      toast.error("خطا در بارگذاری بازدیدکنندگان");
    } finally {
      setLoadingVisitors(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric", month: "short", day: "numeric"
      });
    } catch { return iso; }
  };

  const displayName = (user: BaleUser) =>
    [user.first_name, user.last_name].filter(Boolean).join(" ") || `کاربر ${user.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">لینک‌ها</h1>
          <p className="text-slate-500 text-sm mt-1">
            مدیریت لینک‌های اختصاصی ربات — هر لینک یک توکن منحصربه‌فرد دارد
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadLinks}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm shadow-sm"
          >
            <Plus size={16} />
            لینک جدید
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-800">افزودن لینک جدید</h3>
            <button onClick={() => setShowForm(false)}>
              <X size={18} className="text-blue-600" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  نام لینک (slug) *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: mahdi یا javad-2024"
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <p className="text-xs text-blue-600 mt-1">فقط حروف انگلیسی، اعداد، خط تیره و زیرخط</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  برچسب (اختیاری)
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="توضیح کوتاه برای این لینک"
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm disabled:opacity-50"
              >
                {creating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                ایجاد لینک
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800">
        <strong>💡 نحوه عملکرد لینک‌ها:</strong> وقتی لینک اختصاصی یک کاربر (مثلاً جواد) توسط شخص دیگری (مثلاً رضا) باز می‌شود، ربات به رضا می‌گوید <em>«به جواد می‌گم که می‌خواستی پروفایلش رو چک کنی»</em> و به جواد اطلاع می‌دهد که <em>«رضا پروفایلت رو دید»</em>.
      </div>

      {/* Links List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Link2 size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">هنوز لینکی ساخته نشده</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-3 text-blue-600 text-sm hover:underline"
          >
            اولین لینک را بسازید
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
                    <Link2 size={16} className="text-blue-500 flex-shrink-0" />
                    <span className="font-semibold text-slate-800 font-mono">{link.name}</span>
                    {link.label && link.label !== link.name && (
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">
                        {link.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-2">
                    <a
                      href={link.deep_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 flex items-center gap-1 hover:underline truncate max-w-xs"
                    >
                      <ExternalLink size={12} />
                      {link.deep_link}
                    </a>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MousePointerClick size={12} />
                      {link.click_count} کلیک
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {link.visitors?.length || 0} بازدیدکننده
                    </span>
                    <span>ساخته شده: {formatDate(link.created_at)}</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => copyLink(link.deep_link)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-xs"
                    title="کپی لینک"
                  >
                    <Copy size={13} />
                    کپی
                  </button>
                  {(link.visitors?.length || 0) > 0 && (
                    <button
                      onClick={() => showVisitors(link.name)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition text-xs"
                    >
                      <Users size={13} />
                      بازدیدکنندگان
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(link.name)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition text-xs"
                  >
                    <Trash2 size={13} />
                    حذف
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setVisitorsData(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">بازدیدکنندگان لینک</h3>
              <button onClick={() => setVisitorsData(null)}>
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              {loadingVisitors ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : visitorsData?.visitors?.length === 0 ? (
                <p className="text-slate-500 text-center py-6">هیچ بازدیدکننده‌ای ثبت نشده</p>
              ) : (
                <div className="space-y-2">
                  {visitorsData?.visitors?.map((user: BaleUser) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(user.first_name || "؟")[0]}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{displayName(user)}</div>
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
