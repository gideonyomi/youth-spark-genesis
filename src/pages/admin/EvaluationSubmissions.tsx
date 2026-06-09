import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";
import { format } from "date-fns";

type Form = { id: string; event: string; title: string; sections: any[] };
type Submission = {
  id: string; form_id: string; registration_code: string; event: string;
  answers: Record<string, any>; submitted_at: string;
};

const EvaluationSubmissions = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [formFilter, setFormFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Submission | null>(null);

  useEffect(() => {
    (async () => {
      const [f, s] = await Promise.all([
        supabase.from("evaluation_forms").select("id, event, title, sections"),
        supabase.from("evaluation_submissions").select("*").order("submitted_at", { ascending: false }),
      ]);
      if (f.error) toast.error(f.error.message);
      if (s.error) toast.error(s.error.message);
      setForms((f.data as any) ?? []);
      setSubs((s.data as any) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => formFilter === "all" ? subs : subs.filter(x => x.form_id === formFilter), [subs, formFilter]);

  const labelMap = useMemo(() => {
    const m: Record<string, Record<string, string>> = {};
    for (const f of forms) {
      m[f.id] = {};
      for (const sec of f.sections ?? []) for (const fld of sec.fields ?? []) m[f.id][fld.id] = fld.label;
    }
    return m;
  }, [forms]);

  const exportCsv = () => {
    if (!filtered.length) return;
    // Build unique answer keys per filtered set
    const keys = new Set<string>();
    for (const s of filtered) Object.keys(s.answers || {}).forEach(k => keys.add(k));
    const headers = ["registration_code", "event", "submitted_at", ...Array.from(keys)];
    const rows = filtered.map(s => [
      s.registration_code, s.event, s.submitted_at,
      ...Array.from(keys).map(k => {
        const v = s.answers?.[k];
        return v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
      }),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `evaluations-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Evaluation Submissions</h1>
          <p className="text-muted-foreground text-sm mt-1">Responses from attendees, grouped by form.</p>
        </div>
        <button onClick={exportCsv} disabled={!filtered.length}
          className="inline-flex items-center gap-2 text-sm border border-border px-3 py-2 rounded-md hover:bg-muted disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={formFilter} onChange={(e) => setFormFilter(e.target.value)}
          className="text-sm border border-border rounded-md px-3 py-2 bg-background">
          <option value="all">All forms</option>
          {forms.map(f => <option key={f.id} value={f.id}>{f.event} · {f.title}</option>)}
        </select>
        <span className="text-xs text-muted-foreground self-center">{filtered.length} submissions</span>
      </div>

      {!filtered.length ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No submissions yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Registration ID</th>
                <th className="text-left px-4 py-3 font-medium">Event</th>
                <th className="text-left px-4 py-3 font-medium">Submitted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelected(s)}>
                  <td className="px-4 py-3 font-mono font-semibold">{s.registration_code}</td>
                  <td className="px-4 py-3">{s.event}</td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(s.submitted_at), "MMM d, HH:mm")}</td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">View</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-card rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-xl font-bold mb-1">{selected.registration_code} <span className="text-sm text-muted-foreground font-normal">· {selected.event}</span></h3>
            <p className="text-xs text-muted-foreground mb-4">{format(new Date(selected.submitted_at), "PPpp")}</p>
            <dl className="space-y-3 text-sm">
              {Object.entries(selected.answers || {}).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground">{labelMap[selected.form_id]?.[k] ?? k}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap break-words">{typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")}</dd>
                </div>
              ))}
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

export default EvaluationSubmissions;
