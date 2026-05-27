import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Trash2, Download } from "lucide-react";
import { format } from "date-fns";

type Col = { key: string; label: string; render?: (row: any) => React.ReactNode; truncate?: boolean };

type Props = {
  title: string;
  description?: string;
  table: string;
  columns: Col[];
  statusOptions?: string[];
  hasStatus?: boolean;
};

const InboxTable = ({ title, description, table, columns, statusOptions, hasStatus = true }: Props) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table as any).select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [table]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from(table as any).update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setSelected((s: any) => s ? { ...s, status } : s);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from(table as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setSelected(null); load();
  };

  const filtered = rows.filter((r) => {
    if (hasStatus && statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q));
  });

  const exportCsv = () => {
    if (!filtered.length) return;
    const keys = Object.keys(filtered[0]);
    const csv = [
      keys.join(","),
      ...filtered.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${table}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        </div>
        <button onClick={exportCsv} disabled={!filtered.length}
          className="inline-flex items-center gap-2 text-sm border border-border px-3 py-2 rounded-md hover:bg-muted disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {!loading && rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="flex-1 min-w-[180px] text-sm border border-border rounded-md px-3 py-2 bg-background" />
          {hasStatus && statusOptions && (
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-border rounded-md px-3 py-2 bg-background">
              <option value="all">All statuses</option>
              {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <span className="text-xs text-muted-foreground ml-1">{filtered.length} of {rows.length}</span>
        </div>
      )}

      {loading ? <Loader2 className="animate-spin" /> : !rows.length ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No entries yet.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {columns.map(c => <th key={c.key} className="text-left px-4 py-3 font-medium">{c.label}</th>)}
                  {hasStatus && <th className="text-left px-4 py-3 font-medium">Status</th>}
                  <th className="text-left px-4 py-3 font-medium">Received</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(r)}>
                    {columns.map(c => (
                      <td key={c.key} className={`px-4 py-3 ${c.truncate ? "max-w-xs truncate" : ""}`}>
                        {c.render ? c.render(r) : (r[c.key] ?? "—")}
                      </td>
                    ))}
                    {hasStatus && <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 text-xs rounded-full bg-muted">{r.status}</span></td>}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{format(new Date(r.created_at), "MMM d, HH:mm")}</td>
                    <td className="px-2 py-3">
                      <button onClick={(e) => { e.stopPropagation(); remove(r.id); }} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-xl font-bold mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              {Object.entries(selected).filter(([k]) => k !== "id").map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k.replace(/_/g, " ")}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap break-words">{String(v ?? "—")}</dd>
                </div>
              ))}
            </dl>
            {hasStatus && statusOptions && (
              <div className="mt-5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Change status</label>
                <div className="flex gap-2 flex-wrap">
                  {statusOptions.map(s => (
                    <button key={s} onClick={() => updateStatus(selected.id, s)}
                      className={`text-xs px-3 py-1.5 rounded-full border ${selected.status === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end mt-6">
              <button onClick={() => setSelected(null)} className="text-sm px-4 py-2 rounded-md hover:bg-muted">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InboxTable;
