import { useState } from "react";
import {
  LayoutDashboard,
  Link2,
  Users,
  MessageSquare,
  FileText,
  Star,
  Settings,
  Menu,
  Bot,
} from "lucide-react";
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
  { id: "bot-messages", label: "متون ربات", icon: <FileText size={18} /> },
  { id: "special-messages", label: "پیام‌های ویژه", icon: <Star size={18} /> },
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
      case "special-messages":
        return <SpecialMessagesPage />;
      case "settings":
        return <SettingsPage />;
    }
  };

  const navigate = (p: Page) => {
    setPage(p);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 right-0 z-50 w-64 bg-white border-l border-slate-200 shadow-lg lg:shadow-none transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm">فوزولگیر بله</h1>
              <p className="text-xs text-slate-400">مدیریت ربات</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                page === item.id
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar (Mobile) */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition"
          >
            <Menu size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-blue-600" />
            <span className="font-semibold text-slate-800 text-sm">
              {navItems.find((n) => n.id === page)?.label || "داشبورد"}
            </span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
