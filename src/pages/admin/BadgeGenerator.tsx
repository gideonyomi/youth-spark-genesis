import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, FileImage, FileText, Eye, Search, CheckSquare, Square } from "lucide-react";
import jsPDF from "jspdf";
import JSZip from "jszip";
import {
  Attendee, BadgeTemplate, defaultTemplate, renderBadge, canvasToBlob, downloadCanvas,
} from "@/lib/badge-generator";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

type Reg = {
  id: string;
  full_name: string;
  email: string;
  event: string;
  registration_code: string;
  photo_url: string | null;
};

const VARIANTS: ("primary" | "secondary")[] = ["primary", "secondary"];
const VARIANT_LABEL: Record<string, string> = { primary: "Conference badge", secondary: "Name tag" };

const useTemplate = (event: string, variant: "primary" | "secondary") => {
  const [tpl, setTpl] = useState<BadgeTemplate | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("badge_templates" as any)
        .select("*").eq("event", event).eq("variant", variant).eq("active", true).maybeSingle();
      if (alive) setTpl((data as any) ?? defaultTemplate(event, variant));
    })();
    return () => { alive = false; };
  }, [event, variant]);
  return tpl;
};

const BadgeGenerator = () => {
  const { isAdmin, loading } = useAuth();
  const [rows, setRows] = useState<Reg[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [variant, setVariant] = useState<"primary" | "secondary">("secondary");
  const [previewing, setPreviewing] = useState<Reg | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const tplCache = useRef<Record<string, BadgeTemplate>>({});

  useEffect(() => {
    (async () => {
      setLoadingRows(true);
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id, full_name, email, event, registration_code, photo_url")
        .order("created_at", { ascending: false });
      if (error) toast.error(error.message);
      setRows((data as Reg[]) ?? []);
      setLoadingRows(false);
    })();
  }, []);

  const events = useMemo(() => Array.from(new Set(rows.map(r => r.event))).sort(), [rows]);
  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (eventFilter !== "all" && r.event !== eventFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return [r.full_name, r.email, r.registration_code, r.event].some(v => String(v ?? "").toLowerCase().includes(q));
    });
  }, [rows, search, eventFilter]);

  const allSelected = filtered.length > 0 && filtered.every(r => selected[r.id]);
  const toggleAll = () => {
    if (allSelected) {
      const next = { ...selected };
      filtered.forEach(r => delete next[r.id]);
      setSelected(next);
    } else {
      const next = { ...selected };
      filtered.forEach(r => { next[r.id] = true; });
      setSelected(next);
    }
  };

  const getTemplate = async (event: string, v: "primary" | "secondary") => {
    const key = `${event}:${v}`;
    if (tplCache.current[key]) return tplCache.current[key];
    const { data } = await supabase.from("badge_templates" as any)
      .select("*").eq("event", event).eq("variant", v).eq("active", true).maybeSingle();
    const tpl = (data as any) ?? defaultTemplate(event, v);
    tplCache.current[key] = tpl;
    return tpl;
  };

  const renderFor = async (reg: Reg, v: "primary" | "secondary") => {
    const tpl = await getTemplate(reg.event, v);
    const attendee: Attendee = {
      full_name: reg.full_name,
      registration_code: reg.registration_code || "—",
      event: reg.event,
      photo_url: reg.photo_url,
    };
    return renderBadge(tpl, attendee);
  };

  // Preview side effect
  useEffect(() => {
    let alive = true;
    if (!previewing) { setPreviewUrl(null); return; }
    (async () => {
      const canvas = await renderFor(previewing, variant);
      if (!alive) return;
      setPreviewUrl(canvas.toDataURL("image/png"));
    })();
    return () => { alive = false; };
  }, [previewing, variant]);

  const downloadOne = async (reg: Reg, fmt: "png" | "pdf") => {
    setBusy(reg.id + fmt);
    try {
      const canvas = await renderFor(reg, variant);
      if (fmt === "png") {
        await downloadCanvas(canvas, `${reg.registration_code || reg.id}-${variant}.png`);
      } else {
        const tpl = await getTemplate(reg.event, variant);
        const orientation: "p" | "l" = tpl.height >= tpl.width ? "p" : "l";
        const pdf = new jsPDF({ unit: "pt", format: [tpl.width, tpl.height], orientation });
        const data = canvas.toDataURL("image/png");
        pdf.addImage(data, "PNG", 0, 0, tpl.width, tpl.height);
        pdf.save(`${reg.registration_code || reg.id}-${variant}.pdf`);
      }
    } catch (e: any) {
      toast.error(e.message || "Could not generate badge");
    } finally { setBusy(null); }
  };

  const bulkDownload = async (fmt: "png" | "pdf") => {
    const items = filtered.filter(r => selected[r.id]);
    if (!items.length) return toast.error("Select at least one registrant");
    setBusy("bulk-" + fmt);
    try {
      if (fmt === "pdf") {
        let pdf: jsPDF | null = null;
        for (let i = 0; i < items.length; i++) {
          const reg = items[i];
          const tpl = await getTemplate(reg.event, variant);
          const canvas = await renderFor(reg, variant);
          const orientation: "p" | "l" = tpl.height >= tpl.width ? "p" : "l";
          if (!pdf) {
            pdf = new jsPDF({ unit: "pt", format: [tpl.width, tpl.height], orientation });
          } else {
            pdf.addPage([tpl.width, tpl.height], orientation);
          }
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, tpl.width, tpl.height);
        }
        pdf!.save(`${variant}-badges-${items.length}.pdf`);
      } else {
        const zip = new JSZip();
        for (const reg of items) {
          const canvas = await renderFor(reg, variant);
          const blob = await canvasToBlob(canvas);
          zip.file(`${reg.registration_code || reg.id}-${variant}.png`, blob);
        }
        const out = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(out);
        const a = document.createElement("a");
        a.href = url; a.download = `${variant}-badges-${items.length}.zip`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }
      toast.success(`Generated ${items.length} ${variant === "secondary" ? "name tags" : "badges"}`);
    } catch (e: any) {
      toast.error(e.message || "Bulk export failed");
    } finally { setBusy(null); }
  };

  if (loading) return <Loader2 className="animate-spin" />;
  if (!isAdmin) return <Navigate to="/admin" replace />;

  const selectedCount = filtered.filter(r => selected[r.id]).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold">Badge & Name Tag Generator</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate, preview, and download conference badges and name tags for registrants. Admin-only.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, ID…"
            className="w-full text-sm border border-border rounded-md pl-8 pr-3 py-2 bg-background" />
        </div>
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}
          className="text-sm border border-border rounded-md px-3 py-2 bg-background">
          <option value="all">All events</option>
          {events.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <div className="inline-flex rounded-md border border-border overflow-hidden">
          {VARIANTS.map(v => (
            <button key={v} onClick={() => setVariant(v)}
              className={`text-sm px-3 py-2 ${variant === v ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}>
              {VARIANT_LABEL[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">{selectedCount} selected · {filtered.length} shown</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => bulkDownload("png")} disabled={!selectedCount || !!busy}
            className="inline-flex items-center gap-1.5 text-sm border border-border px-3 py-2 rounded-md hover:bg-muted disabled:opacity-50">
            {busy === "bulk-png" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />} Bulk PNG (.zip)
          </button>
          <button onClick={() => bulkDownload("pdf")} disabled={!selectedCount || !!busy}
            className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md hover:shadow-medium disabled:opacity-50">
            {busy === "bulk-pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Bulk PDF
          </button>
        </div>
      </div>

      {loadingRows ? <Loader2 className="animate-spin" /> : !filtered.length ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No registrations match.</p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="w-10 px-3 py-3">
                    <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground">
                      {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Photo</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Event</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-3">
                      <button onClick={() => setSelected({ ...selected, [r.id]: !selected[r.id] })}
                        className="text-muted-foreground hover:text-foreground">
                        {selected[r.id] ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">{r.registration_code || "—"}</td>
                    <td className="px-4 py-3">
                      {r.photo_url
                        ? <img src={r.photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                        : <div className="w-9 h-9 rounded-full bg-muted" />}
                    </td>
                    <td className="px-4 py-3">{r.full_name}</td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-muted">{r.event}</span></td>
                    <td className="px-4 py-3 text-muted-foreground">{r.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setPreviewing(r)} title="Preview"
                          className="p-1.5 rounded hover:bg-muted"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => downloadOne(r, "png")} title="Download PNG" disabled={!!busy}
                          className="p-1.5 rounded hover:bg-muted disabled:opacity-50">
                          {busy === r.id + "png" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />}
                        </button>
                        <button onClick={() => downloadOne(r, "pdf")} title="Download PDF" disabled={!!busy}
                          className="p-1.5 rounded hover:bg-muted disabled:opacity-50">
                          {busy === r.id + "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
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

      {previewing && (
        <div className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4" onClick={() => setPreviewing(null)}>
          <div className="bg-card rounded-xl max-w-md w-full p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold">{VARIANT_LABEL[variant]} preview</h3>
                <p className="text-xs text-muted-foreground">{previewing.full_name} · {previewing.event} · {previewing.registration_code}</p>
              </div>
            </div>
            <div className="bg-muted/40 rounded-lg overflow-hidden aspect-[2/3] grid place-items-center">
              {previewUrl
                ? <img src={previewUrl} alt="" className="w-full h-full object-contain" />
                : <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button onClick={() => downloadOne(previewing, "png")} disabled={!!busy}
                className="inline-flex items-center gap-1.5 text-sm border border-border px-3 py-2 rounded-md hover:bg-muted disabled:opacity-50">
                <Download className="w-4 h-4" /> PNG
              </button>
              <button onClick={() => downloadOne(previewing, "pdf")} disabled={!!busy}
                className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md hover:shadow-medium disabled:opacity-50">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button onClick={() => setPreviewing(null)} className="text-sm px-3 py-2 rounded-md hover:bg-muted">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeGenerator;
