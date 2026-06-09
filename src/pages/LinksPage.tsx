import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, ExternalLink, Users, MousePointerClick, Link2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { fetchLinks, createLink, deleteLink, BaleLink } from "../api";

export default function LinksPage() {
  const [links, setLinks] = useState<BaleLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // فرم ساخت لینک
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
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

  useEffect(() => {
    load();
  }, []);

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
      const msg = err?.response?.data?.detail || "خطا در ساخت لینک";
      toast.error(msg);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">لینک‌های اختصاصی</h1>
          <p className="text-slate-500 text-sm mt-1">
            هر لینک به ربات شما متصل است و مشخص می‌کند کاربر از کجا آمده
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
                <p className="text-xs text-blue-500 mt-1">
                  فقط حروف انگلیسی، اعداد، خط‌تیره و زیرخط
                </p>
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Links List */}
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
          <p className="text-slate-400 text-sm mt-1">
            با کلیک روی «لینک جدید» اولین لینک خود را بسازید
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link) => (
            <LinkCard
              key={link.name}
              link={link}
              onCopy={copyLink}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold text-slate-700 mb-3">📌 نحوه استفاده</h3>
        <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
          <li>یک لینک اختصاصی بسازید (مثلاً برای لینک بایو اینستاگرام)</li>
          <li>لینک تولیدشده را کپی کنید و در بایو یا هر جایی قرار دهید</li>
          <li>هر کاربری که روی آن کلیک کند وارد ربات شما می‌شود</li>
          <li>ربات شما می‌داند این کاربر از کدام لینک آمده</li>
          <li>اطلاعات کاربر (نام، یوزرنیم، عکس) ذخیره می‌شود</li>
        </ol>
      </div>
    </div>
  );
}

function LinkCard({
  link,
  onCopy,
  onDelete,
}: {
  link: BaleLink;
  onCopy: (url: string) => void;
  onDelete: (name: string) => void;
}) {
  const createdDate = new Date(link.created_at).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800 text-base">{link.label}</span>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">
              {link.name}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-mono break-all">
              {link.deep_link}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">ساخته شده: {createdDate}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onCopy(link.deep_link)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition text-sm"
            title="کپی لینک"
          >
            <Copy size={14} />
            کپی
          </button>
          <a
            href={link.deep_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition text-sm"
            title="باز کردن لینک"
          >
            <ExternalLink size={14} />
            باز کن
          </a>
          <button
            onClick={() => onDelete(link.name)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition text-sm"
            title="حذف لینک"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <MousePointerClick size={15} className="text-orange-400" />
          <span className="font-semibold text-slate-700">{link.click_count}</span>
          کلیک
        </div>
        <div className="flex items-center gap-1.5 text-sm text-slate-500">
          <Users size={15} className="text-violet-400" />
          <span className="font-semibold text-slate-700">{link.visitors.length}</span>
          کاربر منحصربه‌فرد
        </div>
      </div>
    </div>
  );
}
