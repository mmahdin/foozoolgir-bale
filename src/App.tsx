import { useState } from "react";
import {
  LayoutDashboard, Link2, Users, MessageSquare,
  MessageCircle, Settings, Star, Menu, X, Bot
} from "lucide-react";
import { Toaster } from "react-hot-toast";

import DashboardPage from "./pages/DashboardPage";
import LinksPage from "./pages/LinksPage";
import UsersPage from "./pages/UsersPage";
import MessagesPage from "./pages/MessagesPage";
import BotMessagesPage from "./pages/BotMessagesPage";
import SpecialMessagesPage from "./pages/SpecialMessagesPage";
import SettingsPage from "./pages/SettingsPage";

type Page = "dashboard" | "links" | "users" | "messages" | "bot-messages" | "special-messages" | "settings";

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "داشبورد", icon: <LayoutDashboard size={18} /> },
  { id: "links", label: "لینک‌ها", icon: <Link2 size={18} /> },
  { id: "users", label: "کاربران", icon: <Users size={18} /> },
  { id: "messages", label: "پیام‌ها", icon: <MessageSquare size={18} /> },
  { id: "bot-messages", label: "متون ربات", icon: <MessageCircle size={18} /> },
  { id: "special-messages", label: "پیام‌های ویژه", icon: <Star size={18} /> },
  { id: "settings", label: "تنظیمات", icon: <Settings size={18} /> },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "links": return <LinksPage />;
      case "users": return <UsersPage />;
      case "messages": return <MessagesPage />;
      case "bot-messages": return <BotMessagesPage />;
      case "special-messages": return <SpecialMessagesPage />;
      case "settings": return <SettingsPage />;
    }
  };

  const navigate = (p: Page) => {
    setPage(p);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans" dir="rtl">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { fontFamily: "inherit", direction: "rtl", textAlign: "right" },
          duration: 3000,
        }}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-64 bg-white border-l border-slate-100 shadow-xl z-40
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-0 lg:static lg:shadow-none
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-md">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm leading-tight">مدیریت ربات بله</div>
            <div className="text-slate-400 text-xs">Bale Bot Manager</div>
          </div>
          {/* Close button (mobile) */}
          <button
            className="lg:hidden mr-auto p-1 hover:bg-slate-100 rounded-lg transition"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition
                  ${page === item.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                  }
                `}
              >
                <span className={page === item.id ? "text-blue-500" : "text-slate-400"}>
                  {item.icon}
                </span>
                {item.label}
                {item.id === "special-messages" && (
                  <span className="mr-auto text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md">ویژه</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <div className="text-xs text-slate-400 text-center">
            نسخه ۲.۰ · ساخته شده با ❤️
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar (Mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-xl transition"
          >
            <Menu size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              {navItems.find((n) => n.id === page)?.label || "داشبورد"}
            </span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
