import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Download, FileImage, FileText, Eye, Search, CheckSquare, Square, LayoutGrid, ChevronLeft, ChevronRight, X } from "lucide-react";
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

// A4 landscape sheet layout: 4 columns × 2 rows = 8 badges per page.
// Portrait badges (2:3) fit landscape A4 cells cleanly.
const SHEET = {
  pageW: 297, // mm (A4 landscape)
  pageH: 210,
  cols: 4,
  rows: 2,
  marginX: 10, // mm
  marginY: 10,
  gutterX: 6,
  gutterY: 6,
  bleed: 2, // mm
};
const PER_PAGE = SHEET.cols * SHEET.rows;

const computeCells = () => {
  const cellW = (SHEET.pageW - 2 * SHEET.marginX - (SHEET.cols - 1) * SHEET.gutterX) / SHEET.cols;
  const cellH = (SHEET.pageH - 2 * SHEET.marginY - (SHEET.rows - 1) * SHEET.gutterY) / SHEET.rows;
  const cells: { x: number; y: number; w: number; h: number }[] = [];
  for (let r = 0; r < SHEET.rows; r++) {
    for (let c = 0; c < SHEET.cols; c++) {
      cells.push({
        x: SHEET.marginX + c * (cellW + SHEET.gutterX),
        y: SHEET.marginY + r * (cellH + SHEET.gutterY),
        w: cellW,
        h: cellH,
      });
    }
  }
  return cells;
};

const fitAspect = (cellW: number, cellH: number, aspect: number) => {
  let w = cellW;
  let h = cellW / aspect;
  if (h > cellH) { h = cellH; w = cellH * aspect; }
  return { w, h, ox: (cellW - w) / 2, oy: (cellH - h) / 2 };
};

const useTemplate = (event: string, variant: "primary" | "secondary") => {
  const [tpl, setTpl] = useState<BadgeTemplate | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("badge_templates" as any)
        .select("*").eq("event", event).eq("variant", variant).eq("active", true)
        .order("updated_at", { ascending: false }).limit(1);
      const row = Array.isArray(data) && data.length ? data[0] : null;
      if (alive) setTpl((row as any) ?? defaultTemplate(event, variant));
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetItems, setSheetItems] = useState<Reg[]>([]);
  const [sheetPage, setSheetPage] = useState(0);
  const [sheetPreview, setSheetPreview] = useState<string | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
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

  // 8-up A4 sheet: render a single page preview onto a canvas.
  const renderSheetPreview = async (items: Reg[], pageIdx: number) => {
    const pxPerMm = 4; // ≈ 1188×840 preview
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(SHEET.pageW * pxPerMm);
    canvas.height = Math.round(SHEET.pageH * pxPerMm);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cells = computeCells();
    for (let i = 0; i < PER_PAGE; i++) {
      const reg = items[pageIdx * PER_PAGE + i];
      if (!reg) continue;
      const cell = cells[i];
      const tpl = await getTemplate(reg.event, variant);
      const bcanvas = await renderFor(reg, variant);
      const aspect = tpl.width / tpl.height;
      const fit = fitAspect(cell.w, cell.h, aspect);
      const bx = (cell.x + fit.ox) * pxPerMm;
      const by = (cell.y + fit.oy) * pxPerMm;
      const bw = fit.w * pxPerMm;
      const bh = fit.h * pxPerMm;
      const bleedPx = SHEET.bleed * pxPerMm;
      if (tpl.layout.backgroundColor) {
        ctx.fillStyle = tpl.layout.backgroundColor;
        ctx.fillRect(bx - bleedPx, by - bleedPx, bw + 2 * bleedPx, bh + 2 * bleedPx);
      }
      ctx.drawImage(bcanvas, bx, by, bw, bh);
      // crop marks
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 0.6;
      const m = 3 * pxPerMm, gap = 1 * pxPerMm;
      const corners: [number, number][] = [
        [bx - bleedPx, by - bleedPx],
        [bx + bw + bleedPx, by - bleedPx],
        [bx - bleedPx, by + bh + bleedPx],
        [bx + bw + bleedPx, by + bh + bleedPx],
      ];
      for (const [mx, my] of corners) {
        ctx.beginPath();
        ctx.moveTo(mx - m, my); ctx.lineTo(mx - gap, my);
        ctx.moveTo(mx + gap, my); ctx.lineTo(mx + m, my);
        ctx.moveTo(mx, my - m); ctx.lineTo(mx, my - gap);
        ctx.moveTo(mx, my + gap); ctx.lineTo(mx, my + m);
        ctx.stroke();
      }
    }
    return canvas;
  };

  const openSheetPreview = async () => {
    const items = filtered.filter(r => selected[r.id]);
    if (!items.length) return toast.error("Select at least one registrant");
    setSheetItems(items);
    setSheetPage(0);
    setSheetOpen(true);
  };

  // Update preview when page / items change
  useEffect(() => {
    let alive = true;
    if (!sheetOpen || !sheetItems.length) { setSheetPreview(null); return; }
    (async () => {
      setSheetLoading(true);
      try {
        const canvas = await renderSheetPreview(sheetItems, sheetPage);
        if (!alive) return;
        setSheetPreview(canvas.toDataURL("image/jpeg", 0.85));
      } finally {
        if (alive) setSheetLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen, sheetItems, sheetPage, variant]);

  const totalSheetPages = Math.max(1, Math.ceil(sheetItems.length / PER_PAGE));

  const downloadSheetPdf = async () => {
    if (!sheetItems.length) return;
    setBusy("sheet-pdf");
    try {
      // 300 DPI: with jsPDF images we let the source canvases (rendered at 2× template
      // resolution, ~1200×1800 px) drive quality. At ~65mm wide that is >450 DPI.
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape", compress: true });
      const cells = computeCells();
      for (let p = 0; p < totalSheetPages; p++) {
        if (p > 0) pdf.addPage("a4", "landscape");
        for (let i = 0; i < PER_PAGE; i++) {
          const reg = sheetItems[p * PER_PAGE + i];
          if (!reg) continue;
          const cell = cells[i];
          const tpl = await getTemplate(reg.event, variant);
          const canvas = await renderFor(reg, variant);
          const aspect = tpl.width / tpl.height;
          const fit = fitAspect(cell.w, cell.h, aspect);
          const bx = cell.x + fit.ox;
          const by = cell.y + fit.oy;
          if (tpl.layout.backgroundColor) {
            try { pdf.setFillColor(tpl.layout.backgroundColor); } catch { pdf.setFillColor(255, 255, 255); }
            pdf.rect(bx - SHEET.bleed, by - SHEET.bleed, fit.w + 2 * SHEET.bleed, fit.h + 2 * SHEET.bleed, "F");
          }
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", bx, by, fit.w, fit.h, undefined, "FAST");
          // crop marks
          pdf.setDrawColor(140, 140, 140);
          pdf.setLineWidth(0.1);
          const m = 3, gap = 1;
          const corners: [number, number][] = [
            [bx - SHEET.bleed, by - SHEET.bleed],
            [bx + fit.w + SHEET.bleed, by - SHEET.bleed],
            [bx - SHEET.bleed, by + fit.h + SHEET.bleed],
            [bx + fit.w + SHEET.bleed, by + fit.h + SHEET.bleed],
          ];
          for (const [mx, my] of corners) {
            pdf.line(mx - m, my, mx - gap, my);
            pdf.line(mx + gap, my, mx + m, my);
            pdf.line(mx, my - m, mx, my - gap);
            pdf.line(mx, my + gap, mx, my + m);
          }
        }
      }
      pdf.save(`${variant}-sheet-8up-${sheetItems.length}.pdf`);
      toast.success(`Exported ${totalSheetPages} A4 page${totalSheetPages > 1 ? "s" : ""} (${sheetItems.length} badges)`);
    } catch (e: any) {
      toast.error(e.message || "Sheet PDF export failed");
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
        <div className="ml-auto flex flex-wrap gap-2">
          <button onClick={() => bulkDownload("png")} disabled={!selectedCount || !!busy}
            className="inline-flex items-center gap-1.5 text-sm border border-border px-3 py-2 rounded-md hover:bg-muted disabled:opacity-50">
            {busy === "bulk-png" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />} Bulk PNG (.zip)
          </button>
          <button onClick={() => bulkDownload("pdf")} disabled={!selectedCount || !!busy}
            className="inline-flex items-center gap-1.5 text-sm border border-border px-3 py-2 rounded-md hover:bg-muted disabled:opacity-50">
            {busy === "bulk-pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Bulk PDF (1/page)
          </button>
          <button onClick={openSheetPreview} disabled={!selectedCount || !!busy}
            className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md hover:shadow-medium disabled:opacity-50">
            <LayoutGrid className="w-4 h-4" /> Preview 8-up A4 sheet
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

      {sheetOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4" onClick={() => setSheetOpen(false)}>
          <div className="bg-card rounded-xl w-full max-w-5xl p-5 max-h-[94vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold">8-up A4 sheet preview</h3>
                <p className="text-xs text-muted-foreground">
                  A4 landscape · 4 × 2 grid · {SHEET.gutterX}mm gutters · {SHEET.bleed}mm bleed · crop marks · {sheetItems.length} badges → {totalSheetPages} page{totalSheetPages > 1 ? "s" : ""}
                </p>
              </div>
              <button onClick={() => setSheetOpen(false)} className="p-1.5 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>

            <div className="bg-muted/40 rounded-lg overflow-hidden grid place-items-center" style={{ aspectRatio: `${SHEET.pageW} / ${SHEET.pageH}` }}>
              {sheetLoading || !sheetPreview
                ? <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                : <img src={sheetPreview} alt="Sheet preview" className="w-full h-full object-contain bg-white" />}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="inline-flex items-center gap-2">
                <button onClick={() => setSheetPage(p => Math.max(0, p - 1))} disabled={sheetPage === 0 || sheetLoading}
                  className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-xs text-muted-foreground">Page {sheetPage + 1} / {totalSheetPages}</span>
                <button onClick={() => setSheetPage(p => Math.min(totalSheetPages - 1, p + 1))} disabled={sheetPage >= totalSheetPages - 1 || sheetLoading}
                  className="p-1.5 rounded border border-border hover:bg-muted disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSheetOpen(false)} className="text-sm px-3 py-2 rounded-md hover:bg-muted">Cancel</button>
                <button onClick={downloadSheetPdf} disabled={busy === "sheet-pdf"}
                  className="inline-flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:shadow-medium disabled:opacity-50">
                  {busy === "sheet-pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download print-ready PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeGenerator;
