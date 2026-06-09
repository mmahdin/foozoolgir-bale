import { useEffect, useState } from "react";
import { Users, Search, MessageSquare, Calendar, Link2, RefreshCw, X, ChevronRight } from "lucide-react";
import { fetchUsers, fetchUserMessages, BaleUser, BaleMessage } from "../api";
import Avatar from "../components/Avatar";

export default function UsersPage() {
  const [users, setUsers] = useState<BaleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<BaleUser | null>(null);
  const [userMessages, setUserMessages] = useState<BaleMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openUser = async (user: BaleUser) => {
    setSelectedUser(user);
    setLoadingMessages(true);
    try {
      const data = await fetchUserMessages(user.id);
      setUserMessages(data.messages);
    } catch {
      setUserMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      String(u.id).includes(q)
    );
  });

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">کاربران</h1>
          <p className="text-slate-500 text-sm mt-1">
            {users.length} کاربر ثبت‌شده در ربات
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition text-sm shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          بروزرسانی
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="جستجو در نام، یوزرنیم یا آیدی..."
          className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center gap-4">
              <Avatar userId={selectedUser.id} firstName={selectedUser.first_name} size="lg" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 text-lg">
                  {selectedUser.first_name} {selectedUser.last_name}
                </h3>
                {selectedUser.username && (
                  <p className="text-blue-500 text-sm">@{selectedUser.username}</p>
                )}
                <p className="text-slate-400 text-xs mt-0.5">ID: {selectedUser.id}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-5 border-b border-slate-100 grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">اولین مشاهده</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(selectedUser.first_seen)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">آخرین فعالیت</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(selectedUser.last_seen)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 col-span-2">
                <p className="text-xs text-slate-400 mb-1">منابع ورود (لینک‌های اختصاصی)</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedUser.source_links.length > 0 ? (
                    selectedUser.source_links.map((s) => (
                      <span key={s} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">ورود مستقیم (بدون لینک)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 border-b border-slate-100">
                <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                  <MessageSquare size={15} />
                  پیام‌ها ({selectedUser.message_count})
                </h4>
              </div>
              {loadingMessages ? (
                <div className="p-6 text-center text-slate-400 text-sm">در حال بارگذاری...</div>
              ) : userMessages.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-sm">هیچ پیامی ثبت نشده</div>
              ) : (
                <div className="p-4 space-y-2">
                  {userMessages.slice().reverse().map((msg, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          msg.type === "text" ? "bg-blue-100 text-blue-700" :
                          msg.type === "photo" ? "bg-emerald-100 text-emerald-700" :
                          "bg-slate-200 text-slate-600"
                        }`}>
                          {msg.type}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(msg.date)}</span>
                      </div>
                      {msg.text && (
                        <p className="text-sm text-slate-700 mt-1 leading-relaxed">{msg.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading && users.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-4 h-20 animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            {search ? "کاربری با این مشخصات یافت نشد" : "هنوز هیچ کاربری ثبت نشده"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {!search && "وقتی کاربری لینک شما را باز کند اینجا نمایش داده می‌شود"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <button
              key={user.id}
              onClick={() => openUser(user)}
              className="w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:border-blue-200 hover:shadow-md transition text-right"
            >
              <Avatar userId={user.id} firstName={user.first_name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-800 text-sm">
                    {user.first_name} {user.last_name}
                  </span>
                  {user.username && (
                    <span className="text-xs text-blue-400">@{user.username}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageSquare size={11} />
                    {user.message_count} پیام
                  </span>
                  {user.source_links.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-blue-400">
                      <Link2 size={11} />
                      {user.source_links[0]}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar size={11} />
                    {formatDate(user.last_seen)}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 flex-shrink-0 rotate-180" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
