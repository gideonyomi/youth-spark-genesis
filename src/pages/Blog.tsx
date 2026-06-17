import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { BlogPost, BlogCategory, formatDate } from "@/lib/blog";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [cats, setCats] = useState<Record<string, BlogCategory>>({});
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string | "all">("all");

  useEffect(() => {
    document.title = "Blog — BLHMYOUTH";
    (async () => {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from("blog_posts" as any).select("*").eq("status", "published").order("published_at", { ascending: false }),
        supabase.from("blog_categories" as any).select("*"),
      ]);
      setPosts((p as any) ?? []);
      const map: Record<string, BlogCategory> = {};
      ((c as any) ?? []).forEach((x: BlogCategory) => (map[x.id] = x));
      setCats(map);
      setLoading(false);
    })();
  }, []);

  const filtered = activeCat === "all" ? posts : posts.filter((p) => p.category_id === activeCat);
  const categories = Object.values(cats);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <header className="pt-32 pb-12 px-6 max-w-6xl mx-auto">
        <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold mb-3">The Journal</p>
        <h1 className="text-6xl md:text-8xl font-serif text-primary mb-4">Blog</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Reflections, teachings, and stories from the BLHMYOUTH community.
        </p>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-8">
            <button
              onClick={() => setActiveCat("all")}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${activeCat === "all" ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${activeCat === c.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      <section className="px-6 pb-24 max-w-6xl mx-auto">
        {loading ? (
          <div className="py-20 grid place-items-center text-muted-foreground"><Loader2 className="animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <p className="py-20 text-center text-muted-foreground">No posts yet. Check back soon.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
              >
                {post.cover_image_url ? (
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-primary to-primary/70" />
                )}
                <div className="p-6">
                  {post.category_id && cats[post.category_id] && (
                    <span className="inline-block text-[11px] uppercase tracking-wider text-accent-foreground bg-accent px-2 py-0.5 rounded-full mb-3 font-semibold">
                      {cats[post.category_id].name}
                    </span>
                  )}
                  <h2 className="text-3xl font-serif text-primary leading-none mb-2 group-hover:text-primary/80 transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(post.published_at)}</span>
                    <span>·</span>
                    <span>{post.reading_minutes} min read</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default Blog;
