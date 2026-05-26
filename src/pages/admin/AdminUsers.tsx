import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Shield, ShieldCheck, RefreshCw, UserCog } from "lucide-react";
import { format } from "date-fns";

type AdminUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

const Badge = ({ role }: { role: string }) => (
  <span
    className={`inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
      role === "admin" ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary/15 text-secondary border border-secondary/25"
    }`}
  >
    {role === "admin" ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
    {role}
  </span>
);

const Toggle = ({ on, disabled, onChange, label }: { on: boolean; disabled?: boolean; onChange: (v: boolean) => void; label: string }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
      on ? "bg-primary" : "bg-muted-foreground/25"
    }`}
  >
    <span className={`inline-block h-5 w-5 rounded-full bg-card shadow transform transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

const AdminUsers = () => {
  const { user, isStaff } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [callerId, setCallerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const callerIsAdmin = !!users.find((u) => u.id === callerId && u.roles.includes("admin"));

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "list" } });
    setLoading(false);
    if (error) return toast.error(error.message || "Could not load admins");
    if ((data as any)?.error) return toast.error((data as any).error);
    setUsers((data as any).users ?? []);
    setCallerId((data as any).callerId ?? null);
  };

  useEffect(() => { if (isStaff) load(); }, [isStaff]);

  const toggle = async (u: AdminUser, role: "admin" | "editor", enabled: boolean) => {
    const key = u.id + ":" + role;
    setBusyKey(key);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "toggle", user_id: u.id, role, enabled },
    });
    setBusyKey(null);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || error?.message || "Failed");
    toast.success(`${enabled ? "Granted" : "Revoked"} ${role}`);
    load();
    if (selected?.id === u.id) {
      setSelected({
        ...u,
        roles: enabled ? Array.from(new Set([...u.roles, role])) : u.roles.filter((r) => r !== role),
      });
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold flex items-center gap-2"><UserCog className="w-6 h-6" /> Admins & Editors</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Everyone with backend access. {callerIsAdmin ? "Toggle roles to grant or revoke privileges." : "Only admins can change roles."}
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 text-sm border border-border px-3 py-2 rounded-md hover:bg-muted">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <Loader2 className="animate-spin" />
      ) : !users.length ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No admin or editor accounts yet.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium">Roles</th>
                  <th className="text-left px-4 py-3 font-medium">Admin</th>
                  <th className="text-left px-4 py-3 font-medium">Editor</th>
                  <th className="text-left px-4 py-3 font-medium">Last sign-in</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isAdmin = u.roles.includes("admin");
                  const isEditor = u.roles.includes("editor");
                  const isSelf = u.id === callerId;
                  const adminDisabled = !callerIsAdmin || busyKey === `${u.id}:admin` || (isSelf && isAdmin);
                  const editorDisabled = !callerIsAdmin || busyKey === `${u.id}:editor`;
                  return (
                    <tr key={u.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(u)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-sm">
                            {(u.email ?? "?").slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{u.email}{isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</p>
                            <p className="text-xs text-muted-foreground">Joined {format(new Date(u.created_at), "MMM d, yyyy")}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.length ? u.roles.map((r) => <Badge key={r} role={r} />) : <span className="text-xs text-muted-foreground">none</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Toggle on={isAdmin} disabled={adminDisabled} onChange={(v) => toggle(u, "admin", v)} label="Toggle admin" />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Toggle on={isEditor} disabled={editorDisabled} onChange={(v) => toggle(u, "editor", v)} label="Toggle editor" />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {u.last_sign_in_at ? format(new Date(u.last_sign_in_at), "MMM d, HH:mm") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary grid place-items-center font-serif font-bold text-xl">
                {(selected.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-serif text-xl font-bold truncate">{selected.email}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{selected.id}</p>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Privileges</dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {selected.roles.length ? selected.roles.map((r) => <Badge key={r} role={r} />) : <span className="text-muted-foreground">None</span>}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Joined</dt>
                <dd className="mt-0.5">{format(new Date(selected.created_at), "PPP")}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Last sign-in</dt>
                <dd className="mt-0.5">{selected.last_sign_in_at ? format(new Date(selected.last_sign_in_at), "PPP p") : "—"}</dd>
              </div>
            </dl>
            <div className="flex justify-end mt-6">
              <button onClick={() => setSelected(null)} className="text-sm px-4 py-2 rounded-md hover:bg-muted">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
