import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Save } from "lucide-react";
import ImageUpload from "./ImageUpload";
import type { Field } from "./SingletonForm";

const CollectionEditor = ({ title, description, table, fields, defaultRow = {} }: {
  title: string; description?: string; table: string; fields: Field[]; defaultRow?: Record<string, any>;
}) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table as any).select("*").order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [table]);

  const update = (i: number, patch: any) => setRows(rows.map((r, idx) => idx === i ? { ...r, ...patch, _dirty: true } : r));

  const saveRow = async (row: any) => {
    const { _dirty, _new, ...payload } = row;
    if (_new) {
      delete payload.id;
      const { error } = await supabase.from(table as any).insert(payload);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from(table as any).update(payload).eq("id", row.id);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    load();
  };

  const removeRow = async (row: any) => {
    if (row._new) return setRows(rows.filter(r => r !== row));
    if (!confirm("Delete this entry?")) return;
    const { error } = await supabase.from(table as any).delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const a = rows[i], b = rows[j];
    await supabase.from(table as any).update({ sort_order: b.sort_order }).eq("id", a.id);
    await supabase.from(table as any).update({ sort_order: a.sort_order }).eq("id", b.id);
    load();
  };

  const addRow = () => {
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order ?? 0), 0);
    setRows([...rows, { _new: true, sort_order: maxOrder + 1, ...defaultRow }]);
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
        </div>
        <button onClick={addRow} className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm px-3 py-2 rounded-md">
          <Plus className="w-4 h-4" /> Add new
        </button>
      </div>

      {!rows.length && (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No entries yet. Click "Add new" to create one.</p>
        </div>
      )}

      <div className="space-y-4">
        {rows.map((r, i) => (
          <div key={r.id ?? `new-${i}`} className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4 gap-2">
              <p className="text-xs text-muted-foreground">#{i + 1}{r._new && " · new"}</p>
              <div className="flex gap-1">
                {!r._new && <>
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === rows.length - 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                </>}
                <button onClick={() => saveRow(r)} className="p-1.5 rounded hover:bg-primary/10 text-primary"><Save className="w-4 h-4" /></button>
                <button onClick={() => removeRow(r)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {fields.map(f => (
                <div key={f.key} className={f.type === "textarea" || f.type === "image" ? "md:col-span-2" : ""}>
                  <label className="text-xs font-medium block mb-1 text-muted-foreground uppercase tracking-wider">{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea rows={f.rows ?? 3} value={r[f.key] ?? ""}
                      onChange={(e) => update(i, { [f.key]: e.target.value })}
                      className="w-full border border-border rounded px-3 py-2 bg-background text-sm" />
                  ) : f.type === "image" ? (
                    <ImageUpload value={r[f.key]} onChange={(url) => update(i, { [f.key]: url })} />
                  ) : (
                    <input type="text" value={r[f.key] ?? ""}
                      onChange={(e) => update(i, { [f.key]: e.target.value })}
                      className="w-full border border-border rounded px-3 py-2 bg-background text-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default CollectionEditor;
