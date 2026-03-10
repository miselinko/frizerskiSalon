import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Scissors,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/admin/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/rezervacije",  icon: CalendarCheck,   label: "Rezervacije" },
  { to: "/admin/frizeri",      icon: Users,           label: "Frizeri" },
  { to: "/admin/usluge",       icon: Scissors,        label: "Usluge" },
  { to: "/admin/podesavanja",  icon: Settings,        label: "Podešavanja" },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  return (
    <aside className="flex flex-col h-full bg-surface-900 border-r border-border w-64">
      <div className="flex items-center justify-between px-5 h-16 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center">
            <Scissors size={14} className="text-white" />
          </div>
          <span className="font-display font-bold text-white">Admin Panel</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-500 hover:text-white md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-accent-500/10 text-accent-400 border border-accent-500/20"
                  : "text-gray-400 hover:text-white hover:bg-surface-800"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <div className="text-xs text-gray-600 mb-3 truncate">{admin?.email}</div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          <LogOut size={15} />
          Odjavi se
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <Sidebar onClose={() => setSidebarOpen(false)} />
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden flex items-center h-16 px-4 border-b border-border bg-surface-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 border border-border text-gray-400 hover:text-white mr-3 transition-colors"
          >
            <Menu size={18} />
          </button>
          <span className="font-display font-semibold text-white">Admin Panel</span>
        </div>

        <main className="flex-1 overflow-y-auto p-6 bg-surface-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
