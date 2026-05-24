import { ReactNode } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "@/assets/blhm-logo.png";

import { useAuth } from "@/hooks/useAuth";
import {
  Inbox, HandHeart, MessageSquareQuote, ClipboardList, Mail, AtSign,
  Settings, Home, Info, UserCircle, Sparkles, Building2, CalendarDays,
  History, Users, Radio, Star, LogOut, Loader2, Menu
} from "lucide-react";
import { useState } from "react";

const nav = [
  { section: "Inbox", items: [
    { to: "/admin/inbox/prayer", label: "Prayer Requests", icon: HandHeart },
    { to: "/admin/inbox/testimonies", label: "Testimonies", icon: MessageSquareQuote },
    { to: "/admin/inbox/registrations", label: "Event Registrations", icon: ClipboardList },
    { to: "/admin/inbox/contact", label: "Contact Messages", icon: Mail },
    { to: "/admin/inbox/newsletter", label: "Newsletter", icon: AtSign },
  ]},
  { section: "Content", items: [
    { to: "/admin/content/settings", label: "Site Settings", icon: Settings },
    { to: "/admin/content/hero", label: "Hero", icon: Home },
    { to: "/admin/content/about", label: "About", icon: Info },
    { to: "/admin/content/overseer", label: "General Overseer", icon: UserCircle },
    { to: "/admin/content/programs", label: "Programs", icon: Sparkles },
    { to: "/admin/content/ministries", label: "Ministries", icon: Building2 },
    { to: "/admin/content/events", label: "Events", icon: CalendarDays },
    { to: "/admin/content/history", label: "History", icon: History },
    { to: "/admin/content/leadership", label: "Leadership", icon: Users },
    { to: "/admin/content/livestream", label: "Live Stream", icon: Radio },
    { to: "/admin/content/featured-testimonies", label: "Featured Testimonies", icon: Star },
  ]},
];

const AdminLayout = ({ children }: { children?: ReactNode }) => {
  const { user, isStaff, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isStaff) return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <h2 className="font-serif text-xl mb-2">No admin access</h2>
        <p className="text-muted-foreground mb-4">This account does not have admin/editor permissions.</p>
        <button onClick={async () => { await signOut(); navigate("/admin/login"); }} className="text-sm underline">Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted/20">
      <aside className={`${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static z-40 w-72 h-screen md:h-auto md:min-h-screen bg-card border-r border-border flex flex-col transition-transform`}>
        <div className="p-5 border-b border-border flex items-center gap-3">
          <img src={logo} alt="BLHM logo" className="w-10 h-10 object-contain" />
          <div>
            <p className="font-serif font-bold text-lg leading-tight">BLHMYOUTH</p>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>
        </div>


        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {nav.map((sec) => (
            <div key={sec.section}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">{sec.section}</p>
              <div className="space-y-0.5">
                {sec.items.map((it) => (
                  <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground/80"}`
                    }>
                    <it.icon className="w-4 h-4" />{it.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground px-3 mb-2 truncate">{user.email}</p>
          <button onClick={async () => { await signOut(); navigate("/admin/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted">
            <LogOut className="w-4 h-4" />Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden sticky top-0 bg-card border-b border-border p-3 flex items-center gap-3 z-30">
          <button onClick={() => setOpen(!open)} className="p-2 rounded-md hover:bg-muted"><Menu className="w-5 h-5" /></button>
          <p className="font-serif font-semibold">Admin</p>
        </header>
        <div className="p-5 md:p-8 max-w-5xl">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
