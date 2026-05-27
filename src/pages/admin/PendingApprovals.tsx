import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw, Check, X, PauseOctagon, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

type Pending = {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: string;
};

const PendingApprovals = () => {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "list_pending" } });
    setLoading(false);
    if (error) return toast.error(error.message || "Could not load");
    if ((data as any)?.error) return toast.error((data as any).error);
    setRows((data as any).pending ?? []);
  };

  useEffect(() => { load(); }, []);

  const act = async (id: string, action: "approve" | "reject" | "suspend") => {
    if (action !== "approve" && !confirm(`Are you sure you want to ${action} this request? The account will be removed.`)) return;
    setBusy(id + action);
    const { data, error } = await supabase.functions.invoke("admin-users", { body: { action, id } });
    setBusy(null);
    if (error || (data as any)?.error) return toast.error((data as any)?.error || error?.message || "Failed");
    toast.success(action === "approve" ? "Editor approved" : action === "reject" ? "Request rejected" : "Account suspended");
    load();
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold flex items-center gap-2"><UserPlus className="w-6 h-6" /> Pending Approvals</h1>
          <p className="text-muted-foreground text-sm mt-1">
            New accounts sit here until a super admin reviews them. Approving grants editor access.
          </p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 text-sm border border-border px-3 py-2 rounded-md hover:bg-muted">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? <Loader2 className="animate-spin" /> : !rows.length ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No pending requests.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Requester</th>
                  <th className="text-left px-4 py-3 font-medium">Requested</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary grid place-items-center font-semibold text-sm">
                          {(r.full_name || r.email).slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{r.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{format(new Date(r.created_at), "MMM d, HH:mm")}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button disabled={!isAdmin || !!busy} onClick={() => act(r.id, "approve")}
                          className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1.5 rounded-md disabled:opacity-50">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button disabled={!isAdmin || !!busy} onClick={() => act(r.id, "reject")}
                          className="inline-flex items-center gap-1 border border-border text-xs font-medium px-3 py-1.5 rounded-md hover:bg-muted disabled:opacity-50">
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                        <button disabled={!isAdmin || !!busy} onClick={() => act(r.id, "suspend")}
                          className="inline-flex items-center gap-1 border border-destructive/30 text-destructive text-xs font-medium px-3 py-1.5 rounded-md hover:bg-destructive/10 disabled:opacity-50">
                          <PauseOctagon className="w-3.5 h-3.5" /> Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!isAdmin && <p className="text-xs text-muted-foreground mt-3">Only admins can approve or decline requests.</p>}
    </div>
  );
};

export default PendingApprovals;
