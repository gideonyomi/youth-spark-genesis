import { ReactNode } from "react";
import { Navigate, NavLink, Outlet, useNavigate } from "react-router-dom";
import logo from "@/assets/blhm-logo.png";

import { useAuth } from "@/hooks/useAuth";
import {
  HandHeart, MessageSquareQuote, ClipboardList, Mail, AtSign,
  Settings, Home, Info, UserCircle, Sparkles, Building2, CalendarDays,
  History, Users, Radio, Star, LogOut, Loader2, Menu, UserCog, IdCard, ClipboardCheck, MessagesSquare
} from "lucide-react";
import { useState } from "react";

// `roles` controls which staff roles see this link. Missing = visible to all staff.
type Item = { to: string; label: string; icon: any; roles?: ("admin" | "editor" | "support")[] };
type Section = { section: string; items: Item[] };

const nav: Section[] = [
  { section: "Inbox", items: [
    { to: "/admin/inbox/prayer", label: "Prayer Requests", icon: HandHeart },
    { to: "/admin/inbox/testimonies", label: "Testimonies", icon: MessageSquareQuote },
    { to: "/admin/inbox/registrations", label: "Event Registrations", icon: ClipboardList },
    { to: "/admin/inbox/contact", label: "Contact Messages", icon: Mail },
    { to: "/admin/inbox/newsletter", label: "Newsletter", icon: AtSign },
    { to: "/admin/badges/generate", label: "Generate Badges", icon: IdCard, roles: ["admin"] },
  ]},
  { section: "Evaluations", items: [
    { to: "/admin/evaluations/forms", label: "Evaluation Forms", icon: ClipboardCheck, roles: ["admin", "editor"] },
    { to: "/admin/evaluations/submissions", label: "Submissions", icon: MessagesSquare },
  ]},
  { section: "Team", items: [
    { to: "/admin/team/users", label: "Admins & Editors", icon: UserCog, roles: ["admin"] },
    { to: "/admin/team/approvals", label: "Pending Approvals", icon: HandHeart, roles: ["admin"] },
  ]},
  { section: "Content", items: [
    { to: "/admin/content/settings", label: "Site Settings", icon: Settings, roles: ["admin", "editor"] },
    { to: "/admin/content/hero", label: "Home Page", icon: Home, roles: ["admin", "editor"] },
    { to: "/admin/content/about", label: "About", icon: Info, roles: ["admin", "editor"] },
    { to: "/admin/content/overseer", label: "General Overseer", icon: UserCircle, roles: ["admin", "editor"] },
    { to: "/admin/content/programs", label: "Programs", icon: Sparkles, roles: ["admin", "editor"] },
    { to: "/admin/content/ministries", label: "Ministries", icon: Building2, roles: ["admin", "editor"] },
    { to: "/admin/content/events", label: "Events", icon: CalendarDays, roles: ["admin", "editor"] },
    { to: "/admin/content/history", label: "History", icon: History, roles: ["admin", "editor"] },
    { to: "/admin/content/leadership", label: "Leadership", icon: Users, roles: ["admin", "editor"] },
    { to: "/admin/content/livestream", label: "Live Stream", icon: Radio, roles: ["admin", "editor"] },
    { to: "/admin/content/featured-testimonies", label: "Featured Testimonies", icon: Star, roles: ["admin", "editor"] },
    { to: "/admin/content/badges", label: "Badge Templates", icon: IdCard, roles: ["admin"] },
  ]},
];

const AdminLayout = ({ children }: { children?: ReactNode }) => {
  const { user, isStaff, isAdmin, isEditor, isSupport, pendingStatus, loading, signOut } = useAuth();
  const role: "admin" | "editor" | "support" | null = isAdmin ? "admin" : isEditor ? "editor" : isSupport ? "support" : null;
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isStaff) {
    const msg =
      pendingStatus === "pending" ? "Your account is awaiting approval by an administrator. You'll get access as soon as it's reviewed."
      : pendingStatus === "rejected" ? "Your access request was declined. Please contact an administrator."
      : pendingStatus === "suspended" ? "Your account has been suspended. Please contact an administrator."
      : "This account does not have admin/editor permissions.";
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div className="max-w-sm">
          <h2 className="font-serif text-xl mb-2">{pendingStatus === "pending" ? "Awaiting approval" : "No admin access"}</h2>
          <p className="text-muted-foreground mb-4">{msg}</p>
          <button onClick={async () => { await signOut(); navigate("/admin/login"); }} className="text-sm underline">Sign out</button>
        </div>
      </div>
    );
  }

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
          {nav.map((sec) => {
            const items = sec.items.filter((it) => !it.roles || (role && it.roles.includes(role)));
            if (!items.length) return null;
            return (
              <div key={sec.section}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-2">{sec.section}</p>
                <div className="space-y-0.5">
                  {items.map((it) => (
                    <NavLink key={it.to} to={it.to} onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground/80"}`
                      }>
                      <it.icon className="w-4 h-4" />{it.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
        <div className="px-3 pb-2">
          {role && (
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">
              Signed in as <span className="text-foreground font-semibold">{role}</span>
            </p>
          )}
        </div>
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
