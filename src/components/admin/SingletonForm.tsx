import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

export type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "image";
  rows?: number;
  placeholder?: string;
};

const SingletonForm = ({ title, description, table, fields }: { title: string; description?: string; table: string; fields: Field[] }) => {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row, error } = await supabase.from(table as any).select("*").eq("id", 1).maybeSingle();
      if (error) toast.error(error.message);
      setData(row ?? { id: 1 });
      setLoading(false);
    })();
  }, [table]);

  const save = async () => {
    setSaving(true);
    const payload = { ...data, id: 1 };
    const { error } = await supabase.from(table as any).upsert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div>
      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">{title}</h1>
      {description && <p className="text-muted-foreground text-sm mb-6">{description}</p>}
      <div className="bg-card border border-border rounded-lg p-6 space-y-5">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-sm font-medium block mb-1.5">{f.label}</label>
            {f.type === "textarea" ? (
              <textarea rows={f.rows ?? 4} value={data[f.key] ?? ""} placeholder={f.placeholder}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            ) : f.type === "image" ? (
              <ImageUpload value={data[f.key]} onChange={(url) => setData({ ...data, [f.key]: url })} />
            ) : (
              <input type="text" value={data[f.key] ?? ""} placeholder={f.placeholder}
                onChange={(e) => setData({ ...data, [f.key]: e.target.value })}
                className="w-full border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
            )}
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <button onClick={save} disabled={saving}
            className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg disabled:opacity-60">
            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SingletonForm;
