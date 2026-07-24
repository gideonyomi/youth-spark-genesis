import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Attendee, BadgeTemplate, defaultTemplate, downloadCanvas, renderBadge,
} from "@/lib/badge-generator";

type Props = { attendee: Attendee };

const NameTagDownload = ({ attendee }: Props) => {
  const [template, setTemplate] = useState<BadgeTemplate | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("badge_templates" as any)
        .select("*").eq("event", attendee.event).eq("variant", "secondary").eq("active", true)
        .order("updated_at", { ascending: false }).limit(1);
      const row = Array.isArray(data) && data.length ? data[0] : null;
      const tpl = (row as any) ?? defaultTemplate(attendee.event, "secondary");
      setTemplate(tpl);
      const canvas = await renderBadge(tpl, attendee);
      canvasRef.current = canvas;
      setPreview(canvas.toDataURL("image/png"));
    })();
  }, [attendee.event, attendee.registration_code]);

  const download = async () => {
    if (!template) return;
    setBusy(true);
    try {
      const canvas = canvasRef.current || (await renderBadge(template, attendee));
      await downloadCanvas(canvas, `${attendee.registration_code}-name-tag.png`);
    } finally { setBusy(false); }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-muted/40 max-w-xs mx-auto">
      <div className="aspect-[2/3] bg-card grid place-items-center overflow-hidden">
        {preview
          ? <img src={preview} alt="Name tag preview" className="w-full h-full object-contain" />
          : <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
      </div>
      <div className="p-3 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your name tag</p>
        <button
          type="button"
          onClick={download}
          disabled={!preview || busy}
          className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:shadow-medium transition-all active:scale-[0.97] disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download PNG
        </button>
      </div>
    </div>
  );
};

export default NameTagDownload;
