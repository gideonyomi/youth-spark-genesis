import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ImageUpload from "@/components/admin/ImageUpload";
import { BlogCategory, BlogTag, readingMinutes, renderMarkdown, slugify } from "@/lib/blog";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Eye, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published" | "scheduled";
  scheduled_at: string; // datetime-local value
  category_id: string | null;
  seo_title: string;
  seo_description: string;
  tag_ids: string[];
};

const empty: FormState = {
  title: "", slug: "", excerpt: "", content: "", cover_image_url: null,
  status: "draft", scheduled_at: "", category_id: null, seo_title: "", seo_description: "", tag_ids: [],
};

// Convert a UTC ISO string to a value suitable for <input type="datetime-local">
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};


const BlogPostEditor = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(empty);
  const [cats, setCats] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: t }] = await Promise.all([
        supabase.from("blog_categories" as any).select("*").order("name"),
        supabase.from("blog_tags" as any).select("*").order("name"),
      ]);
      setCats((c as any) ?? []);
      setTags((t as any) ?? []);
    })();
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data } = await supabase.from("blog_posts" as any).select("*").eq("id", id).maybeSingle();
      if (!data) { toast.error("Post not found"); navigate("/admin/blog/posts"); return; }
      const p: any = data;
      const { data: pt } = await supabase.from("blog_post_tags" as any).select("tag_id").eq("post_id", p.id);
      setForm({
        title: p.title, slug: p.slug, excerpt: p.excerpt ?? "", content: p.content ?? "",
        cover_image_url: p.cover_image_url, status: p.status,
        scheduled_at: toLocalInput(p.scheduled_at),
        category_id: p.category_id,
        seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "",
        tag_ids: ((pt as any) ?? []).map((r: any) => r.tag_id),
      });
      setLoading(false);
    })();
  }, [id, isNew, navigate]);

  const onTitle = (v: string) => {
    setForm((f) => ({ ...f, title: v, slug: slugTouched ? f.slug : slugify(v) }));
  };

  const mins = useMemo(() => readingMinutes(form.content), [form.content]);

  const save = async (status?: "draft" | "published" | "scheduled") => {
    if (!form.title.trim()) return toast.error("Title is required");
    const finalSlug = form.slug.trim() || slugify(form.title);
    const finalStatus = status ?? form.status;
    let scheduledIso: string | null = null;
    if (finalStatus === "scheduled") {
      if (!form.scheduled_at) { return toast.error("Pick a schedule date/time"); }
      const d = new Date(form.scheduled_at);
      if (isNaN(d.getTime())) return toast.error("Invalid schedule date");
      if (d.getTime() <= Date.now()) return toast.error("Schedule date must be in the future");
      scheduledIso = d.toISOString();
    }
    setSaving(true);
    const payload: any = {
      title: form.title.trim(),
      slug: finalSlug,
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      cover_image_url: form.cover_image_url,
      status: finalStatus,
      scheduled_at: finalStatus === "scheduled" ? scheduledIso : null,
      category_id: form.category_id,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      reading_minutes: mins,
      author_id: user?.id ?? null,
    };

    let postId = id;
    if (isNew) {
      const { data, error } = await supabase.from("blog_posts" as any).insert(payload).select("id").single();
      if (error) { setSaving(false); return toast.error(error.message); }
      postId = (data as any).id;
    } else {
      const { error } = await supabase.from("blog_posts" as any).update(payload).eq("id", id);
      if (error) { setSaving(false); return toast.error(error.message); }
    }

    // Sync tags
    if (postId) {
      await supabase.from("blog_post_tags" as any).delete().eq("post_id", postId);
      if (form.tag_ids.length) {
        await supabase.from("blog_post_tags" as any).insert(form.tag_ids.map((tag_id) => ({ post_id: postId, tag_id })));
      }
    }

    setSaving(false);
    toast.success(
      finalStatus === "published" ? "Post published"
      : finalStatus === "scheduled" ? `Scheduled for ${new Date(scheduledIso!).toLocaleString()}`
      : "Saved"
    );
    if (isNew && postId) navigate(`/admin/blog/posts/${postId}`, { replace: true });
    setForm((f) => ({ ...f, status: finalStatus }));
  };


  if (loading) return <div className="p-10 grid place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <Link to="/admin/blog/posts" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> All posts
      </Link>
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <h1 className="text-4xl font-serif text-primary leading-none">{isNew ? "New Post" : "Edit Post"}</h1>
        <div className="flex gap-2">
          <button onClick={() => setPreview((p) => !p)} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted">
            <Eye className="w-4 h-4" /> {preview ? "Edit" : "Preview"}
          </button>
          <button onClick={() => save("draft")} disabled={saving} className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-md hover:bg-muted">
            <Save className="w-4 h-4" /> Save draft
          </button>
          <button onClick={() => save("published")} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Publish
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <input
            value={form.title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Post title"
            className="w-full px-4 py-3 text-2xl font-serif border border-border rounded-md bg-background"
          />
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">/blog/</span>
            <input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }}
              placeholder="url-slug"
              className="flex-1 px-2 py-1 border border-border rounded bg-background font-mono"
            />
            <span className="text-muted-foreground">· {mins} min read</span>
          </div>

          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="Short excerpt (shown on listing pages)"
            rows={2}
            className="w-full px-4 py-2 text-sm border border-border rounded-md bg-background"
          />

          {preview ? (
            <div className="border border-border rounded-md p-6 bg-card prose prose-neutral max-w-none [&_h2]:font-serif [&_h3]:font-serif"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }} />
          ) : (
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write your post in Markdown..."
              rows={22}
              className="w-full px-4 py-3 text-sm font-mono border border-border rounded-md bg-background leading-relaxed"
            />
          )}
        </div>

        <aside className="space-y-5">
          <div className="border border-border rounded-md p-4 bg-card">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Status</p>
            <p className="text-sm">
              <span className={`inline-block text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full font-semibold ${form.status === "published" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                {form.status}
              </span>
            </p>
          </div>

          <div className="border border-border rounded-md p-4 bg-card space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Cover image</p>
            <ImageUpload value={form.cover_image_url} onChange={(url) => setForm({ ...form, cover_image_url: url })} />
          </div>

          <div className="border border-border rounded-md p-4 bg-card space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Category</p>
            <select
              value={form.category_id ?? ""}
              onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
            >
              <option value="">None</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="border border-border rounded-md p-4 bg-card space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tags</p>
            {tags.length === 0 && <p className="text-xs text-muted-foreground">No tags yet — add some in Categories & Tags.</p>}
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const active = form.tag_ids.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, tag_ids: active ? form.tag_ids.filter((x) => x !== t.id) : [...form.tag_ids, t.id] })}
                    className={`text-xs px-2.5 py-1 rounded-full border ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border border-border rounded-md p-4 bg-card space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">SEO</p>
            <input
              value={form.seo_title}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              placeholder="SEO title (defaults to post title)"
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
            />
            <textarea
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              placeholder="Meta description (< 160 chars)"
              rows={3}
              maxLength={200}
              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogPostEditor;
