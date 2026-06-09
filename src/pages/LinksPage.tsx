import { useEffect, useState } from "react";
import {
  Plus, Trash2, Copy, Users, MousePointerClick,
  Link2, RefreshCw, UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchLinks, createLink, deleteLink, fetchLinkVisitors,
  fetchPersonalLinks, fetchPersonalLinkVisitors,
  BaleLink, BaleUser, PersonalLink
} from "../api";

type Tab = "public" | "personal";

export default function LinksPage() {
  const [tab, setTab] = useState<Tab>("public");

  // Public Links
  const [links, setLinks] = useState<BaleLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);

  // Personal Links
  const [personalLinks, setPersonalLinks] = useState<PersonalLink[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

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

  const loadPersonalLinks = async () => {
    setLoadingPersonal(true);
    try {
      const data = await fetchPersonalLinks();
      setPersonalLinks(data);
    } catch {
      // ignore
    } finally {
      setLoadingPersonal(false);
    }
  };

  useEffect(() => { loadLinks(); loadPersonalLinks(); }, []);

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

  const showVisitors = async (name: string, type: "public" | "personal") => {
    setLoadingVisitors(true);
    setVisitorsData(null);
    try {
      let data;
      if (type === "public") {
        data = await fetchLinkVisitors(name);
      } else {
        data = await fetchPersonalLinkVisitors(name);
      }
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
            مدیریت لینک‌های اختصاصی و شخصی
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { loadLinks(); loadPersonalLinks(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          {tab === "public" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition text-sm shadow-sm"
            >
              <Plus size={16} />
              لینک جدید
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100">
        <button
          onClick={() => setTab("public")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
            tab === "public"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <Link2 size={15} />
          لینک‌های عمومی ({links.length})
        </button>
        <button
          onClick={() => setTab("personal")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
            tab === "personal"
              ? "border-violet-500 text-violet-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          <UserCheck size={15} />
          لینک‌های شخصی ({personalLinks.length})
        </button>
      </div>

      {/* Visitors Modal */}
      {(visitorsData || loadingVisitors) && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setVisitorsData(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">بازدیدکنندگان</h3>
              <button
                onClick={() => setVisitorsData(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >✕</button>
            </div>
            <div className="p-5">
              {loadingVisitors ? (
                <div className="text-center text-slate-400 py-8">در حال بارگذاری...</div>
              ) : visitorsData?.visitors?.length === 0 ? (
                <div className="text-center text-slate-400 py-8">هنوز بازدیدکننده‌ای ندارد</div>
              ) : (
                <div className="space-y-3">
                  {visitorsData?.visitors?.map((user: BaleUser) => (
                    <div key={user.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {displayName(user)[0]}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800 text-sm">{displayName(user)}</div>
                        {user.username && <div className="text-blue-500 text-xs">@{user.username}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Public Links Tab */}
      {tab === "public" && (
        <>
          {showForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h3 className="font-semibold text-blue-800 mb-4">ساخت لینک جدید</h3>
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      شناسه لینک *
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="مثال: mahdi یا bio_link"
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      pattern="[a-zA-Z0-9_\-]+"
                      required
                    />
                    <p className="text-xs text-blue-500 mt-1">فقط حروف انگلیسی، اعداد، خط‌تیره و زیرخط</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      برچسب نمایشی (اختیاری)
                    </label>
                    <input
                      type="text"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="مثال: لینک بایو اینستاگرام"
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {creating ? "در حال ساخت..." : "ساختن لینک"}
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}

          {loading && links.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 h-28 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : links.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Link2 size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">هنوز لینکی نساخته‌اید</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-800">{link.label}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-mono">
                          {link.name}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 font-mono truncate">{link.deep_link}</div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MousePointerClick size={12} />
                          {link.click_count} کلیک
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {link.visitors.length} بازدیدکننده
                        </span>
                        <span>ساخته: {formatDate(link.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => showVisitors(link.name, "public")}
                        className="p-2 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100 transition"
                        title="بازدیدکنندگان"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        onClick={() => copyLink(link.deep_link)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition"
                        title="کپی لینک"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(link.name)}
                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition"
                        title="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Personal Links Tab */}
      {tab === "personal" && (
        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 text-sm text-violet-700">
            <strong>لینک‌های شخصی</strong> با دستور <code className="bg-white px-1 rounded">/getlink</code> توسط کاربران ساخته می‌شوند.
            هر لینک یک UUID منحصربه‌فرد دارد که قابل حدس نیست.
          </div>

          {loadingPersonal ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 h-20 animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : personalLinks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <UserCheck size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">هنوز هیچ کاربری لینک شخصی نگرفته</p>
              <p className="text-slate-400 text-sm mt-1">
                کاربران با فرستادن <code>/getlink</code> به ربات لینک اختصاصی خود را دریافت می‌کنند
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {personalLinks.map((pl) => {
                const name = pl.user
                  ? [pl.user.first_name, pl.user.last_name].filter(Boolean).join(" ") || `کاربر ${pl.user_id}`
                  : `کاربر ${pl.user_id}`;
                return (
                  <div key={pl.token} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {name[0]}
                          </div>
                          <span className="font-semibold text-slate-800">{name}</span>
                          {pl.user?.username && (
                            <span className="text-blue-500 text-sm">@{pl.user.username}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-mono truncate mt-1">
                          {pl.deep_link}
                        </div>
                        <div className="text-xs text-slate-300 font-mono mt-0.5">
                          token: {pl.token}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => showVisitors(pl.token, "personal")}
                          className="p-2 bg-violet-50 text-violet-600 rounded-xl hover:bg-violet-100 transition"
                          title="بازدیدکنندگان"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          onClick={() => copyLink(pl.deep_link)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition"
                          title="کپی لینک"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* How it works */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-700 mb-3">📌 نحوه استفاده از لینک‌های شخصی</h3>
        <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
          <li>کاربر دستور <code>/getlink</code> به ربات می‌فرستد</li>
          <li>ربات یک لینک منحصربه‌فرد (UUID) به کاربر می‌دهد</li>
          <li>کاربر لینک را در بایو خود قرار می‌دهد</li>
          <li>هر کسی روی لینک کلیک کند، به بازدیدکننده پیام می‌رود که «به صاحب لینک اطلاع می‌دم»</li>
          <li>صاحب لینک هم پیام دریافت می‌کند که «فلانی پروفایلت رو دید»</li>
        </ol>
      </div>
    </div>
  );
}
