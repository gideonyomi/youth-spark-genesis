import { marked } from "marked";
import DOMPurify from "dompurify";

export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const readingMinutes = (text: string): number => {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

export const renderMarkdown = (md: string): string => {
  const raw = marked.parse(md || "", { async: false, breaks: true }) as string;
  return DOMPurify.sanitize(raw);
};

export const formatDate = (d?: string | null): string =>
  d ? new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  category_id: string | null;
  author_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  reading_minutes: number;
  created_at: string;
  updated_at: string;
};

export type BlogCategory = { id: string; name: string; slug: string };
export type BlogTag = { id: string; name: string; slug: string };
