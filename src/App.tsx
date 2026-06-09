import { useState } from "react";
import { Toaster } from "react-hot-toast";
import {
  LayoutDashboard,
  Link2,
  Users,
  MessageSquare,
  Settings,
  Bot,
  Menu,
  X,
  MessageSquareText,
} from "lucide-react";
import DashboardPage from "./pages/DashboardPage";
import LinksPage from "./pages/LinksPage";
import UsersPage from "./pages/UsersPage";
import MessagesPage from "./pages/MessagesPage";
import SettingsPage from "./pages/SettingsPage";
import BotMessagesPage from "./pages/BotMessagesPage";

type Page = "dashboard" | "links" | "users" | "messages" | "bot-messages" | "settings";

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "داشبورد", icon: <LayoutDashboard size={18} /> },
  { id: "links", label: "لینک‌های اختصاصی", icon: <Link2 size={18} /> },
  { id: "users", label: "کاربران", icon: <Users size={18} /> },
  { id: "messages", label: "پیام‌ها", icon: <MessageSquare size={18} /> },
  { id: "bot-messages", label: "متون ربات", icon: <MessageSquareText size={18} /> },
  { id: "settings", label: "تنظیمات", icon: <Settings size={18} /> },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage />;
      case "links":
        return <LinksPage />;
      case "users":
        return <UsersPage />;
      case "messages":
        return <MessagesPage />;
      case "bot-messages":
        return <BotMessagesPage />;
      case "settings":
        return <SettingsPage />;
    }
  };

  const navigate = (p: Page) => {
    setPage(p);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" dir="rtl">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            direction: "rtl",
            fontFamily: "inherit",
            borderRadius: "12px",
            fontSize: "14px",
          },
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-64 z-40 bg-white border-l border-slate-200 shadow-xl
          flex flex-col transition-transform duration-300
          lg:relative lg:translate-x-0 lg:shadow-none
          ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 text-sm leading-tight">مدیریت ربات بله</p>
            <p className="text-xs text-slate-400">Bale Bot Manager</p>
          </div>
          <button
            className="mr-auto p-1 rounded-lg hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${page === item.id
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }
              `}
            >
              <span className={page === item.id ? "text-blue-600" : "text-slate-400"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-600 text-center">
            <p className="font-medium">ربات بله</p>
            <p className="text-blue-400 mt-0.5">Powered by Bale API</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:mr-0">
        {/* Top Bar (mobile) */}
        <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <Menu size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">مدیریت ربات بله</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-5xl w-full mx-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
