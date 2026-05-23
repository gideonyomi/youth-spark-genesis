import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

const ImageUpload = ({ value, onChange }: { value?: string | null; onChange: (url: string | null) => void }) => {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("site-images").upload(path, file, { upsert: false });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("site-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative inline-block">
          <img src={value} alt="" className="h-32 rounded border border-border object-cover" />
          <button type="button" onClick={() => onChange(null)}
            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <label className="inline-flex items-center gap-2 text-sm border border-dashed border-border px-3 py-2 rounded cursor-pointer hover:bg-muted">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {value ? "Replace image" : "Upload image"}
        <input type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}
        placeholder="Or paste an image URL"
        className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background" />
    </div>
  );
};
export default ImageUpload;
