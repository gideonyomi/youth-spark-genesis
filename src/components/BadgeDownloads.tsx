import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Attendee, BadgeTemplate, defaultTemplate, downloadCanvas, renderBadge,
} from "@/lib/badge-generator";

type Props = { attendee: Attendee };

const variants: ("primary" | "secondary")[] = ["primary", "secondary"];

const BadgeDownloads = ({ attendee }: Props) => {
  const [templates, setTemplates] = useState<Record<string, BadgeTemplate>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLCanvasElement | null>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("badge_templates" as any)
        .select("*").eq("event", attendee.event).eq("active", true);
      const byVariant: Record<string, BadgeTemplate> = {};
      for (const v of variants) {
        const found = (data as any[])?.find((t) => t.variant === v);
        byVariant[v] = found ?? defaultTemplate(attendee.event, v);
      }
      setTemplates(byVariant);

      const preview: Record<string, string> = {};
      for (const v of variants) {
        const canvas = await renderBadge(byVariant[v], attendee);
        refs.current[v] = canvas;
        preview[v] = canvas.toDataURL("image/png");
      }
      setPreviews(preview);
    })();
  }, [attendee.event, attendee.registration_code]);

  const download = async (v: "primary" | "secondary") => {
    setBusy(v);
    try {
      const canvas = refs.current[v] || (await renderBadge(templates[v], attendee));
      await downloadCanvas(canvas, `${attendee.registration_code}-${v}-badge.png`);
    } finally { setBusy(null); }
  };

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {variants.map((v) => (
        <div key={v} className="border border-border rounded-xl overflow-hidden bg-muted/40">
          <div className="aspect-[3/4] bg-card grid place-items-center overflow-hidden">
            {previews[v]
              ? <img src={previews[v]} alt={`${v} badge preview`} className="w-full h-full object-contain" />
              : <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </div>
          <div className="p-3 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {v === "primary" ? "Conference badge" : "Name tag"}
            </p>
            <button
              type="button"
              onClick={() => download(v)}
              disabled={!previews[v] || busy === v}
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:shadow-medium transition-all active:scale-[0.97] disabled:opacity-60"
            >
              {busy === v ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PNG
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BadgeDownloads;
