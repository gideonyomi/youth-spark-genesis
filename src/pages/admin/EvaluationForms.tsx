import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, ExternalLink, Save } from "lucide-react";
import { DEFAULT_EVAL_SECTIONS } from "@/lib/default-evaluation-template";

const EVENTS = ["YEC", "SSC", "NSS"];
const FIELD_TYPES = ["rating", "text", "textarea", "select", "radio"] as const;

type Field = { id: string; label: string; type: typeof FIELD_TYPES[number]; required?: boolean; options?: string[]; scale?: number };
type Section = { id: string; title: string; description?: string; fields: Field[] };
type Form = {
  id?: string; event: string; title: string; description?: string;
  sections: Section[]; is_active: boolean;
};

const newId = () => Math.random().toString(36).slice(2, 9);

const EvaluationForms = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("evaluation_forms").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setForms((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startNew = (event: string) => {
    setEditing({
      event, title: `${event} Event Evaluation`, description: "Your feedback helps us serve better.",
      sections: JSON.parse(JSON.stringify(DEFAULT_EVAL_SECTIONS)), is_active: true,
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = {
      event: editing.event.toUpperCase(),
      title: editing.title.trim(),
      description: editing.description?.trim() || null,
      sections: editing.sections,
      is_active: editing.is_active,
    };
    let res;
    if (editing.id) {
      res = await supabase.from("evaluation_forms").update(payload).eq("id", editing.id);
    } else {
      res = await supabase.from("evaluation_forms").insert(payload);
    }
    setSaving(false);
    if (res.error) return toast.error(res.error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this evaluation form? All submissions for it will also be deleted.")) return;
    const { error } = await supabase.from("evaluation_forms").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    if (!editing) return;
    const next = [...editing.sections];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setEditing({ ...editing, sections: next });
  };

  const addSection = () =>
    editing && setEditing({ ...editing, sections: [...editing.sections, { id: newId(), title: "New section", fields: [] }] });

  const addField = (sIdx: number) => {
    if (!editing) return;
    const next = [...editing.sections];
    next[sIdx] = { ...next[sIdx], fields: [...next[sIdx].fields, { id: newId(), label: "New question", type: "text" }] };
    setEditing({ ...editing, sections: next });
  };

  if (editing) {
    return (
      <div>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold">{editing.id ? "Edit" : "Create"} evaluation form</h1>
            <p className="text-muted-foreground text-sm mt-1">Customize sections and questions for {editing.event}.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(null)} className="text-sm px-4 py-2 rounded-md hover:bg-muted border border-border">Cancel</button>
            <button onClick={save} disabled={saving}
              className="text-sm inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
          </div>
        </div>

        <div className="space-y-4 bg-card border border-border rounded-lg p-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block font-medium mb-1">Event</span>
              <select value={editing.event} onChange={(e) => setEditing({ ...editing, event: e.target.value })}
                className="w-full border border-border rounded-md px-3 py-2 bg-background">
                {EVENTS.map(e => <option key={e}>{e}</option>)}
              </select>
            </label>
            <label className="text-sm flex items-center gap-2 mt-6">
              <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              Active (visible to attendees)
            </label>
          </div>
          <label className="text-sm block">
            <span className="block font-medium mb-1">Title</span>
            <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              className="w-full border border-border rounded-md px-3 py-2 bg-background" />
          </label>
          <label className="text-sm block">
            <span className="block font-medium mb-1">Description</span>
            <textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              className="w-full border border-border rounded-md px-3 py-2 bg-background resize-none" />
          </label>
        </div>

        <div className="mt-6 space-y-4">
          {editing.sections.map((sec, si) => (
            <div key={sec.id} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <button onClick={() => moveSection(si, -1)} className="p-1.5 rounded hover:bg-muted"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveSection(si, 1)} className="p-1.5 rounded hover:bg-muted"><ChevronDown className="w-4 h-4" /></button>
                <input value={sec.title}
                  onChange={(e) => {
                    const next = [...editing.sections]; next[si] = { ...sec, title: e.target.value }; setEditing({ ...editing, sections: next });
                  }}
                  className="flex-1 border border-border rounded-md px-3 py-2 bg-background font-serif font-semibold" />
                <button onClick={() => {
                  const next = editing.sections.filter((_, i) => i !== si); setEditing({ ...editing, sections: next });
                }} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
              </div>
              <textarea rows={2} placeholder="Section description (optional)" value={sec.description ?? ""}
                onChange={(e) => {
                  const next = [...editing.sections]; next[si] = { ...sec, description: e.target.value }; setEditing({ ...editing, sections: next });
                }}
                className="w-full border border-border rounded-md px-3 py-2 bg-background text-sm resize-none mb-4" />

              <div className="space-y-3">
                {sec.fields.map((f, fi) => (
                  <div key={f.id} className="grid grid-cols-12 gap-2 items-start border border-border rounded-md p-3">
                    <input value={f.label} placeholder="Question label"
                      onChange={(e) => {
                        const next = [...editing.sections]; const fields = [...sec.fields]; fields[fi] = { ...f, label: e.target.value };
                        next[si] = { ...sec, fields }; setEditing({ ...editing, sections: next });
                      }}
                      className="col-span-12 md:col-span-5 border border-border rounded-md px-3 py-2 bg-background text-sm" />
                    <select value={f.type}
                      onChange={(e) => {
                        const next = [...editing.sections]; const fields = [...sec.fields];
                        fields[fi] = { ...f, type: e.target.value as Field["type"] };
                        next[si] = { ...sec, fields }; setEditing({ ...editing, sections: next });
                      }}
                      className="col-span-6 md:col-span-2 border border-border rounded-md px-2 py-2 bg-background text-sm">
                      {FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {(f.type === "select" || f.type === "radio") && (
                      <input value={(f.options ?? []).join(", ")} placeholder="Options (comma separated)"
                        onChange={(e) => {
                          const next = [...editing.sections]; const fields = [...sec.fields];
                          fields[fi] = { ...f, options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) };
                          next[si] = { ...sec, fields }; setEditing({ ...editing, sections: next });
                        }}
                        className="col-span-12 md:col-span-4 border border-border rounded-md px-3 py-2 bg-background text-sm" />
                    )}
                    {f.type === "rating" && (
                      <input type="number" min={3} max={10} value={f.scale ?? 5} placeholder="Scale"
                        onChange={(e) => {
                          const next = [...editing.sections]; const fields = [...sec.fields];
                          fields[fi] = { ...f, scale: Number(e.target.value) };
                          next[si] = { ...sec, fields }; setEditing({ ...editing, sections: next });
                        }}
                        className="col-span-6 md:col-span-2 border border-border rounded-md px-3 py-2 bg-background text-sm" />
                    )}
                    <label className="col-span-4 md:col-span-2 text-xs flex items-center gap-1.5">
                      <input type="checkbox" checked={!!f.required}
                        onChange={(e) => {
                          const next = [...editing.sections]; const fields = [...sec.fields];
                          fields[fi] = { ...f, required: e.target.checked };
                          next[si] = { ...sec, fields }; setEditing({ ...editing, sections: next });
                        }} />
                      Required
                    </label>
                    <button onClick={() => {
                      const next = [...editing.sections]; const fields = sec.fields.filter((_, i) => i !== fi);
                      next[si] = { ...sec, fields }; setEditing({ ...editing, sections: next });
                    }} className="col-span-2 md:col-span-1 p-1.5 rounded text-destructive hover:bg-destructive/10 justify-self-end">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={() => addField(si)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <Plus className="w-4 h-4" /> Add question
              </button>
            </div>
          ))}
          <button onClick={addSection}
            className="w-full border border-dashed border-border rounded-lg py-3 text-sm text-muted-foreground hover:bg-muted">
            <Plus className="w-4 h-4 inline mr-1" /> Add section
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold">Evaluation Forms</h1>
          <p className="text-muted-foreground text-sm mt-1">Create post-event feedback forms attendees fill with their Registration ID.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {EVENTS.map(e => (
            <button key={e} onClick={() => startNew(e)}
              className="text-sm inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border hover:bg-muted">
              <Plus className="w-4 h-4" /> New {e} form
            </button>
          ))}
        </div>
      </div>

      {loading ? <Loader2 className="animate-spin" /> : !forms.length ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No evaluation forms yet. Create one for an event above.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Event</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Public link</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {forms.map(f => (
                <tr key={f.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono font-semibold">{f.event}</td>
                  <td className="px-4 py-3">{f.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${f.is_active ? "bg-secondary/20 text-secondary" : "bg-muted"}`}>
                      {f.is_active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`/evaluate/${f.event.toLowerCase()}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs underline text-muted-foreground">
                      /evaluate/{f.event.toLowerCase()} <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(f)} className="text-sm px-3 py-1.5 rounded-md hover:bg-muted border border-border mr-2">Edit</button>
                    <button onClick={() => f.id && remove(f.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EvaluationForms;
