// Canvas-based conference badge generator.
// A template defines a background image + a list of positioned "fields"
// (text fields, the attendee photo, or simple brand text). The generator
// renders the badge into a canvas and exposes a downloadable PNG.

export type BadgeField =
  | {
      type: "text";
      key: "name" | "code" | "event" | "static";
      x: number;
      y: number;
      font?: string;
      size?: number;
      weight?: string;
      family?: string;
      color?: string;
      align?: CanvasTextAlign;
      maxWidth?: number;
      uppercase?: boolean;
      text?: string; // for static
    }
  | {
      type: "photo";
      x: number;
      y: number;
      width: number;
      height: number;
      shape?: "circle" | "rect";
      borderColor?: string;
      borderWidth?: number;
    };

export type BadgeTemplate = {
  id?: string;
  event: string;
  variant: string;
  name: string;
  background_url?: string | null;
  width: number;
  height: number;
  layout: { fields: BadgeField[]; backgroundColor?: string };
};

export type Attendee = {
  full_name: string;
  registration_code: string;
  event: string;
  photo_url?: string | null;
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const fontFor = (f: Extract<BadgeField, { type: "text" }>) => {
  if (f.font) return f.font;
  const w = f.weight || "600";
  const s = f.size || 28;
  const fam = f.family || "Plus Jakarta Sans, system-ui, sans-serif";
  return `${w} ${s}px ${fam}`;
};

export const renderBadge = async (
  template: BadgeTemplate,
  attendee: Attendee,
): Promise<HTMLCanvasElement> => {
  const scale = 2; // export at 2x for print sharpness
  const w = template.width * scale;
  const h = template.height * scale;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = template.layout.backgroundColor || "#ffffff";
  ctx.fillRect(0, 0, template.width, template.height);
  if (template.background_url) {
    try {
      const bg = await loadImage(template.background_url);
      ctx.drawImage(bg, 0, 0, template.width, template.height);
    } catch {
      /* missing bg → keep solid color */
    }
  }

  for (const field of template.layout.fields ?? []) {
    if (field.type === "photo") {
      if (!attendee.photo_url) continue;
      try {
        const img = await loadImage(attendee.photo_url);
        ctx.save();
        if (field.shape === "circle") {
          ctx.beginPath();
          ctx.arc(field.x + field.width / 2, field.y + field.height / 2, Math.min(field.width, field.height) / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
        }
        // cover fit
        const ratio = Math.max(field.width / img.width, field.height / img.height);
        const iw = img.width * ratio;
        const ih = img.height * ratio;
        ctx.drawImage(img, field.x + (field.width - iw) / 2, field.y + (field.height - ih) / 2, iw, ih);
        ctx.restore();
        if (field.borderWidth) {
          ctx.strokeStyle = field.borderColor || "#fff";
          ctx.lineWidth = field.borderWidth;
          if (field.shape === "circle") {
            ctx.beginPath();
            ctx.arc(field.x + field.width / 2, field.y + field.height / 2, Math.min(field.width, field.height) / 2, 0, Math.PI * 2);
            ctx.stroke();
          } else {
            ctx.strokeRect(field.x, field.y, field.width, field.height);
          }
        }
      } catch {/* skip */}
      continue;
    }

    // text
    let value = field.text ?? "";
    if (field.key === "name") value = attendee.full_name;
    else if (field.key === "code") value = attendee.registration_code;
    else if (field.key === "event") value = attendee.event;
    if (field.uppercase) value = value.toUpperCase();
    if (!value) continue;

    ctx.font = fontFor(field);
    ctx.fillStyle = field.color || "#0f172a";
    ctx.textAlign = field.align || "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(value, field.x, field.y, field.maxWidth);
  }

  return canvas;
};

export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject()), "image/png", 1));

export const downloadCanvas = async (canvas: HTMLCanvasElement, filename: string) => {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

// Built-in fallbacks so the system works before any admin uploads templates.
export const defaultTemplate = (event: string, variant: "primary" | "secondary"): BadgeTemplate => {
  if (variant === "primary") {
    return {
      event,
      variant,
      name: `${event} – Default badge`,
      background_url: null,
      width: 600,
      height: 900,
      layout: {
        backgroundColor: "#0f1b3d",
        fields: [
          { type: "text", key: "static", text: "BLHMYOUTH", x: 300, y: 70, size: 22, weight: "700", color: "#c9a84c", align: "center", uppercase: true },
          { type: "text", key: "event", x: 300, y: 110, size: 18, weight: "600", color: "#e8edf3", align: "center", uppercase: true },
          { type: "photo", x: 175, y: 160, width: 250, height: 250, shape: "circle", borderColor: "#c9a84c", borderWidth: 6 },
          { type: "text", key: "name", x: 300, y: 480, size: 36, weight: "700", color: "#ffffff", align: "center", family: "Fraunces, serif", maxWidth: 540, uppercase: true },
          { type: "text", key: "static", text: "Registration ID", x: 300, y: 600, size: 14, weight: "500", color: "#94a3b8", align: "center", uppercase: true },
          { type: "text", key: "code", x: 300, y: 660, size: 56, weight: "700", color: "#c9a84c", align: "center", family: "JetBrains Mono, monospace" },
          { type: "text", key: "static", text: "Rooted in Holiness, Empowered for Purpose", x: 300, y: 830, size: 13, weight: "500", color: "#94a3b8", align: "center" },
        ],
      },
    };
  }
  // Secondary: compact name tag (landscape)
  return {
    event,
    variant,
    name: `${event} – Name tag`,
    background_url: null,
    width: 900,
    height: 500,
    layout: {
      backgroundColor: "#ffffff",
      fields: [
        { type: "text", key: "static", text: "BLHMYOUTH", x: 40, y: 60, size: 18, weight: "700", color: "#0f1b3d", uppercase: true },
        { type: "text", key: "event", x: 860, y: 60, size: 18, weight: "700", color: "#c9a84c", align: "right", uppercase: true },
        { type: "photo", x: 40, y: 100, width: 280, height: 280, shape: "circle", borderColor: "#0f1b3d", borderWidth: 4 },
        { type: "text", key: "static", text: "Hello, my name is", x: 360, y: 170, size: 16, weight: "500", color: "#64748b" },
        { type: "text", key: "name", x: 360, y: 240, size: 44, weight: "700", color: "#0f1b3d", family: "Fraunces, serif", maxWidth: 500, uppercase: true },
        { type: "text", key: "code", x: 360, y: 310, size: 28, weight: "700", color: "#c9a84c", family: "JetBrains Mono, monospace" },
        { type: "text", key: "static", text: "Rooted in Holiness · Empowered for Purpose", x: 360, y: 420, size: 13, weight: "500", color: "#64748b" },
      ],
    },
  };
};
