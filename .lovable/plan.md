# Blog Module + Design Token Refresh

## 1. Design tokens (global, low-risk)

Update `src/index.css` and `tailwind.config.ts` so the existing design system keeps working — only the values change:

- `--primary` → Navy `#000080` (HSL `240 100% 25%`)
- `--accent` / `--secondary` accent → Gold `#FFCC00` (HSL `48 100% 50%`)
- `--ring`, `--sidebar-*` re-pointed to the new palette
- Fonts: load Bebas Neue + Montserrat from Google Fonts; set `--font-serif: 'Bebas Neue'` (used by `h1–h4`) and `--font-sans: 'Montserrat'` (used by `body`)
- Tailwind `fontFamily.serif` / `fontFamily.sans` updated to match

No component markup changes — every page picks up the new look automatically through the existing tokens.

## 2. Database (one migration)

New tables in `public`:

- `blog_categories` — `name`, `slug` (unique)
- `blog_tags` — `name`, `slug` (unique)
- `blog_posts` — `title`, `slug` (unique), `excerpt`, `content` (markdown/HTML), `cover_image_url`, `status` (`draft` | `published`), `published_at`, `category_id`, `author_id`, `seo_title`, `seo_description`, `reading_minutes`
- `blog_post_tags` — join table

RLS:
- Public can `SELECT` posts where `status = 'published'` and categories/tags
- Admins + Editors (via `can_edit`) can do everything

Trigger: auto-fill `published_at` when a post transitions to `published`. Standard `updated_at` trigger.

GRANTs per house rules (anon read on published, authenticated full for editors, service_role all).

## 3. Admin UI (Admins + Editors only)

New nav group "Blog" under `AdminLayout` with three links (roles `["admin","editor"]`):

- `/admin/blog/posts` — table of posts with status badge, search, "New post" button
- `/admin/blog/posts/new` and `/admin/blog/posts/:id` — editor form: title (auto-slug), excerpt, cover image (reusing `ImageUpload`), category dropdown, multi-tag picker, markdown/textarea body, SEO title/description, status toggle (Draft / Publish)
- `/admin/blog/taxonomy` — manage categories + tags inline

Reuses existing `CollectionEditor`-style patterns and shadcn components — no new design language.

## 4. Public blog

- `/blog` — grid of published posts (cover, category chip, title in Bebas, excerpt, date, reading time)
- `/blog/:slug` — full post page with cover, title, meta, rendered body, tag chips, "Back to blog" link, JSON-LD `BlogPosting` for SEO, `<title>` + meta description from SEO fields
- Add "Blog" link to the main `Navbar`

## 5. Technical notes

- Slug generated client-side from title with a small util, validated unique server-side
- Markdown rendered with `marked` + `DOMPurify` (already-installed-friendly; add if missing)
- Reading time = `Math.max(1, Math.round(wordCount / 200))`
- Cover images stored in the existing `site-images` bucket
- All queries via `supabase` client; published-only filter on public routes
- `src/integrations/supabase/types.ts` regenerates after the migration is approved

## Files to add/edit

- edit: `src/index.css`, `tailwind.config.ts`, `index.html` (font preconnect), `src/App.tsx`, `src/components/admin/AdminLayout.tsx`, `src/components/Navbar.tsx`
- new: `supabase/migrations/<ts>_blog.sql`
- new: `src/pages/Blog.tsx`, `src/pages/BlogPost.tsx`
- new: `src/pages/admin/BlogPosts.tsx`, `src/pages/admin/BlogPostEditor.tsx`, `src/pages/admin/BlogTaxonomy.tsx`
- new: `src/lib/blog.ts` (slug, reading-time, markdown render helpers)

Approve and I'll ship it.
