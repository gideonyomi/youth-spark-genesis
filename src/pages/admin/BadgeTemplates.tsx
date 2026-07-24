import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { IdCard, Loader2, Plus, Save, Trash2 } from "lucide-react";
import {
  BadgeField, BadgeTemplate, defaultTemplate, renderBadge,
} from "@/lib/badge-generator";
import ImageUpload from "@/components/admin/ImageUpload";
import { useAuth } from "@/hooks/useAuth";

const EVENTS = ["YEC", "SSC", "NSS"];
const VARIANTS: ("primary" | "secondary")[] = ["primary", "secondary"];

const sampleAttendee = (event: string) => ({
  full_name: "Sample Attendee",
  registration_code: `${event}001`,
  event,
  photo_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400",
});

const BadgeTemplates = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  if (!authLoading && !isAdmin) return <Navigate to="/admin" replace />;
  const [event, setEvent] = useState("YEC");
  const [variant, setVariant] = useState<"primary" | "secondary">("primary");
  const [template, setTemplate] = useState<BadgeTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const renderTimer = useRef<any>(null);

  const load = async () => {
    setLoading(true);
    // Fetch the most recent active template. Older code used .maybeSingle()
    // which errors out when duplicate rows exist and silently falls back to
    // the built-in default — making every upload appear to have no effect.
    const { data, error } = await supabase.from("badge_templates" as any)
      .select("*")
      .eq("event", event)
      .eq("variant", variant)
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1);
    setLoading(false);
    if (error) return toast.error(error.message);
    const row = Array.isArray(data) && data.length ? data[0] : null;
    setTemplate((row as any) || defaultTemplate(event, variant));
  };
  useEffect(() => { load(); /* eslint-disable-line */ }, [event, variant]);

  // Live preview (debounced) — bust the browser cache on the background image
  // so a freshly uploaded template is drawn instead of the previous one.
  useEffect(() => {
    if (!template) return;
    clearTimeout(renderTimer.current);
    renderTimer.current = setTimeout(async () => {
      const bust = template.background_url
        ? `${template.background_url}${template.background_url.includes("?") ? "&" : "?"}v=${Date.now()}`
        : template.background_url;
      const c = await renderBadge({ ...template, background_url: bust }, sampleAttendee(event));
      setPreview(c.toDataURL("image/png"));
    }, 200);
  }, [template, event]);

  const save = async () => {
    if (!template) return;
    setSaving(true);
    const payload = {
      event, variant, name: template.name,
      background_url: template.background_url ?? null,
      width: template.width, height: template.height,
      layout: template.layout, active: true,
    };
    // Always update the current active row for this (event, variant) if one
    // exists — never insert a second one, which is what caused duplicates.
    const { data: existing } = await supabase.from("badge_templates" as any)
      .select("id")
      .eq("event", event)
      .eq("variant", variant)
      .eq("active", true)
      .order("updated_at", { ascending: false })
      .limit(1);
    const existingId = Array.isArray(existing) && existing.length ? (existing[0] as any).id : template.id;
    const { error } = existingId
      ? await supabase.from("badge_templates" as any).update(payload).eq("id", existingId)
      : await supabase.from("badge_templates" as any).insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Badge template saved");
    load();
  };

  const resetToDefault = () => setTemplate(defaultTemplate(event, variant));

  const fields = template?.layout.fields ?? [];

  const updateField = (i: number, patch: Partial<BadgeField>) => {
    if (!template) return;
    const next = [...fields];
    next[i] = { ...next[i], ...patch } as BadgeField;
    setTemplate({ ...template, layout: { ...template.layout, fields: next } });
  };
  const removeField = (i: number) => template &&
    setTemplate({ ...template, layout: { ...template.layout, fields: fields.filter((_, k) => k !== i) } });
  const addField = (type: "text" | "photo") => {
    if (!template) return;
    const f: BadgeField = type === "photo"
      ? { type: "photo", x: 100, y: 100, width: 200, height: 200, shape: "circle" }
      : { type: "text", key: "static", text: "New text", x: 100, y: 100, size: 24, color: "#0f172a", weight: "600" };
    setTemplate({ ...template, layout: { ...template.layout, fields: [...fields, f] } });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold flex items-center gap-2">
          <IdCard className="w-6 h-6" /> Badge Templates
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customize the conference badge and name tag generated for each registrant.
          Edit positions, colors, and the background image. Two badges are generated automatically on successful registration.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event</label>
          <select value={event} onChange={(e) => setEvent(e.target.value)}
            className="block mt-1 border border-border rounded-md px-3 py-2 bg-background text-sm">
            {EVENTS.map((e) => <option key={e}>{e}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Variant</label>
          <select value={variant} onChange={(e) => setVariant(e.target.value as any)}
            className="block mt-1 border border-border rounded-md px-3 py-2 bg-background text-sm">
            <option value="primary">Primary badge</option>
            <option value="secondary">Name tag</option>
          </select>
        </div>
      </div>

      {loading || !template ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm font-semibold mb-3">Canvas</p>
              <div className="grid sm:grid-cols-3 gap-3 mb-3">
                <label className="text-xs">Name
                  <input value={template.name} onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                    className="mt-1 w-full border border-border rounded px-2 py-1.5 text-sm bg-background" />
                </label>
                <label className="text-xs">Width (px)
                  <input type="number" value={template.width} onChange={(e) => setTemplate({ ...template, width: +e.target.value || 600 })}
                    className="mt-1 w-full border border-border rounded px-2 py-1.5 text-sm bg-background" />
                </label>
                <label className="text-xs">Height (px)
                  <input type="number" value={template.height} onChange={(e) => setTemplate({ ...template, height: +e.target.value || 900 })}
                    className="mt-1 w-full border border-border rounded px-2 py-1.5 text-sm bg-background" />
                </label>
              </div>
              <label className="text-xs">Background colour
                <input type="color" value={template.layout.backgroundColor || "#ffffff"}
                  onChange={(e) => setTemplate({ ...template, layout: { ...template.layout, backgroundColor: e.target.value } })}
                  className="mt-1 block h-9 w-20 border border-border rounded bg-background" />
              </label>
              <div className="mt-3">
                <p className="text-xs font-semibold mb-1.5">Background image (optional)</p>
                <ImageUpload value={template.background_url ?? null}
                  onChange={(url) => setTemplate({ ...template, background_url: url })} />
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold">Fields ({fields.length})</p>
                <div className="flex gap-2">
                  <button onClick={() => addField("text")} className="inline-flex items-center gap-1 text-xs border border-border rounded px-2 py-1 hover:bg-muted">
                    <Plus className="w-3 h-3" /> Text
                  </button>
                  <button onClick={() => addField("photo")} className="inline-flex items-center gap-1 text-xs border border-border rounded px-2 py-1 hover:bg-muted">
                    <Plus className="w-3 h-3" /> Photo
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {fields.map((f, i) => (
                  <div key={i} className="border border-border rounded-md p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider">
                        {f.type === "photo" ? "Photo" : `Text · ${(f as any).key}`}
                      </p>
                      <button onClick={() => removeField(i)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <label>X<input type="number" value={f.x} onChange={(e) => updateField(i, { x: +e.target.value })} className="w-full border border-border rounded px-2 py-1 bg-background" /></label>
                      <label>Y<input type="number" value={f.y} onChange={(e) => updateField(i, { y: +e.target.value })} className="w-full border border-border rounded px-2 py-1 bg-background" /></label>
                      {f.type === "photo" ? (
                        <>
                          <label>W<input type="number" value={f.width} onChange={(e) => updateField(i, { width: +e.target.value } as any)} className="w-full border border-border rounded px-2 py-1 bg-background" /></label>
                          <label>H<input type="number" value={f.height} onChange={(e) => updateField(i, { height: +e.target.value } as any)} className="w-full border border-border rounded px-2 py-1 bg-background" /></label>
                          <label className="col-span-2">Shape
                            <select value={f.shape || "rect"} onChange={(e) => updateField(i, { shape: e.target.value as any })}
                              className="w-full border border-border rounded px-2 py-1 bg-background">
                              <option value="rect">Rectangle</option>
                              <option value="circle">Circle</option>
                            </select>
                          </label>
                          <label>Border<input type="color" value={f.borderColor || "#ffffff"} onChange={(e) => updateField(i, { borderColor: e.target.value } as any)} className="w-full h-7 border border-border rounded bg-background" /></label>
                          <label>Border w<input type="number" value={f.borderWidth || 0} onChange={(e) => updateField(i, { borderWidth: +e.target.value } as any)} className="w-full border border-border rounded px-2 py-1 bg-background" /></label>
                        </>
                      ) : (
                        <>
                          <label>Size<input type="number" value={(f as any).size || 24} onChange={(e) => updateField(i, { size: +e.target.value } as any)} className="w-full border border-border rounded px-2 py-1 bg-background" /></label>
                          <label>Weight<input value={(f as any).weight || "600"} onChange={(e) => updateField(i, { weight: e.target.value } as any)} className="w-full border border-border rounded px-2 py-1 bg-background" /></label>
                          <label className="col-span-2">Source
                            <select value={(f as any).key} onChange={(e) => updateField(i, { key: e.target.value as any } as any)}
                              className="w-full border border-border rounded px-2 py-1 bg-background">
                              <option value="name">Attendee name</option>
                              <option value="code">Registration ID</option>
                              <option value="event">Event tag</option>
                              <option value="static">Fixed text</option>
                            </select>
                          </label>
                          {(f as any).key === "static" && (
                            <label className="col-span-2">Text<input value={(f as any).text || ""} onChange={(e) => updateField(i, { text: e.target.value } as any)} className="w-full border border-border rounded px-2 py-1 bg-background" /></label>
                          )}
                          <label>Colour<input type="color" value={(f as any).color || "#000000"} onChange={(e) => updateField(i, { color: e.target.value } as any)} className="w-full h-7 border border-border rounded bg-background" /></label>
                          <label>Align
                            <select value={(f as any).align || "left"} onChange={(e) => updateField(i, { align: e.target.value as any } as any)}
                              className="w-full border border-border rounded px-2 py-1 bg-background">
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </label>
                          <label className="col-span-2 flex items-center gap-2 mt-1">
                            <input type="checkbox" checked={!!(f as any).uppercase} onChange={(e) => updateField(i, { uppercase: e.target.checked } as any)} />
                            Uppercase
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={save} disabled={saving}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-sm font-semibold hover:shadow-medium transition-all active:scale-[0.97] disabled:opacity-60">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save template
              </button>
              <button onClick={resetToDefault} className="text-sm px-4 py-2 rounded-md hover:bg-muted border border-border">
                Reset to default
              </button>
            </div>
          </div>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Live preview</p>
              <div className="bg-muted/40 rounded grid place-items-center overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Badge preview" className="max-w-full max-h-[70vh] object-contain" />
                ) : <Loader2 className="w-5 h-5 animate-spin m-12" />}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Preview uses sample attendee data.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeTemplates;
