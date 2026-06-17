import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, formatDate } from "@/lib/blog";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "draft" | "published">("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("blog_posts" as any).select("*").order("updated_at", { ascending: false });
    setPosts((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    const { error } = await supabase.from("blog_posts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Post deleted");
    load();
  };

  const filtered = posts.filter((p) => {
    if (status !== "all" && p.status !== status) return false;
    if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-4xl font-serif text-primary leading-none">Blog Posts</h1>
          <p className="text-sm text-muted-foreground mt-1">Create, edit, and publish articles.</p>
        </div>
        <Link
          to="/admin/blog/posts/new"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> New post
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search posts..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-background"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="px-3 py-2 text-sm border border-border rounded-md bg-background">
          <option value="all">All statuses</option>
          <option value="draft">Drafts</option>
          <option value="published">Published</option>
        </select>
        <Link to="/admin/blog/taxonomy" className="px-3 py-2 text-sm border border-border rounded-md hover:bg-muted">
          Categories & Tags
        </Link>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-10 grid place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-muted-foreground text-sm">No posts found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link to={`/admin/blog/posts/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                    <p className="text-xs text-muted-foreground">/{p.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${p.status === "published" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.published_at || p.updated_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => del(p.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default BlogPosts;
