import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost as BlogPostT, BlogCategory, BlogTag, formatDate, renderMarkdown } from "@/lib/blog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Loader2 } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostT | null>(null);
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("blog_posts" as any).select("*").eq("slug", slug).eq("status", "published").maybeSingle();
      const p = (data as unknown) as BlogPostT | null;
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPost(p);
      document.title = (p.seo_title || p.title) + " — BLHMYOUTH";
      const desc = p.seo_description || p.excerpt || "";
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", desc.slice(0, 160));

      if (p.category_id) {
        const { data: c } = await supabase.from("blog_categories" as any).select("*").eq("id", p.category_id).maybeSingle();
        setCategory(c as any);
      }
      const { data: pt } = await supabase.from("blog_post_tags" as any).select("tag_id, blog_tags(id, name, slug)").eq("post_id", p.id);
      setTags(((pt as any) ?? []).map((r: any) => r.blog_tags).filter(Boolean));
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
    );
  }
  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-40 px-6 max-w-3xl mx-auto text-center">
          <h1 className="text-6xl font-serif text-primary mb-4">Not Found</h1>
          <p className="text-muted-foreground mb-6">This post may have been removed or is not yet published.</p>
          <Link to="/blog" className="text-primary underline">Back to blog</Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    description: post.seo_description || post.excerpt || "",
    image: post.cover_image_url || undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <article className="pt-32 pb-24 px-6 max-w-3xl mx-auto">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to blog
        </Link>

        {category && (
          <span className="inline-block text-[11px] uppercase tracking-wider text-accent-foreground bg-accent px-2.5 py-0.5 rounded-full mb-4 font-semibold">
            {category.name}
          </span>
        )}
        <h1 className="text-5xl md:text-7xl font-serif text-primary leading-none mb-6">{post.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-10">
          <span>{formatDate(post.published_at)}</span>
          <span>·</span>
          <span>{post.reading_minutes} min read</span>
        </div>

        {post.cover_image_url && (
          <img src={post.cover_image_url} alt={post.title} className="w-full rounded-2xl mb-10 object-cover aspect-[16/9]" />
        )}

        <div
          className="prose prose-neutral max-w-none [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif [&_h2]:text-3xl [&_h3]:text-2xl [&_h2]:mt-10 [&_h3]:mt-8 [&_p]:my-4 [&_p]:text-foreground/85 [&_p]:leading-relaxed [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_img]:rounded-xl [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-primary [&_pre]:text-primary-foreground [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
        />

        {tags.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t.id} className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">#{t.name}</span>
            ))}
          </div>
        )}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Footer />
    </div>
  );
};

export default BlogPost;
