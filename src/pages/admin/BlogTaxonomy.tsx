import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlogCategory, BlogTag, slugify } from "@/lib/blog";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Kind = "blog_categories" | "blog_tags";

const Manager = ({ kind, label }: { kind: Kind; label: string }) => {
  const [items, setItems] = useState<(BlogCategory | BlogTag)[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from(kind as any).select("*").order("name");
    setItems((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    const n = name.trim();
    if (!n) return;
    const { error } = await supabase.from(kind as any).insert({ name: n, slug: slugify(n) });
    if (error) return toast.error(error.message);
    setName("");
    load();
  };
  const del = async (id: string) => {
    if (!confirm(`Delete this ${label.toLowerCase()}?`)) return;
    const { error } = await supabase.from(kind as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="border border-border rounded-lg bg-card p-5">
      <h2 className="font-serif text-2xl text-primary mb-4">{label}</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={`New ${label.toLowerCase()}...`}
          className="flex-1 px-3 py-2 text-sm border border-border rounded-md bg-background"
        />
        <button onClick={add} className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {loading ? <Loader2 className="animate-spin text-muted-foreground" /> :
        items.length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> :
        <ul className="divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm">{it.name}</span>
                <span className="ml-2 text-xs text-muted-foreground font-mono">/{it.slug}</span>
              </div>
              <button onClick={() => del(it.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>}
    </div>
  );
};

const BlogTaxonomy = () => (
  <div>
    <Link to="/admin/blog/posts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
      <ArrowLeft className="w-4 h-4" /> All posts
    </Link>
    <h1 className="text-4xl font-serif text-primary leading-none mb-6">Categories & Tags</h1>
    <div className="grid md:grid-cols-2 gap-5">
      <Manager kind="blog_categories" label="Categories" />
      <Manager kind="blog_tags" label="Tags" />
    </div>
  </div>
);

export default BlogTaxonomy;
