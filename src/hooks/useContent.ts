import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type TableName =
  | "hero_content" | "about_content" | "general_overseer" | "site_settings"
  | "programs" | "ministries" | "events" | "history_milestones"
  | "leadership" | "livestream_links" | "featured_testimonies";

export function useSingleton<T = any>(table: "hero_content" | "about_content" | "general_overseer" | "site_settings") {
  return useQuery({
    queryKey: [table, "singleton"],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return (data ?? null) as T | null;
    },
    staleTime: 30_000,
  });
}

export function useCollection<T = any>(
  table: "programs" | "ministries" | "events" | "history_milestones" | "leadership" | "livestream_links" | "featured_testimonies",
  opts?: { onlyPublished?: boolean }
) {
  return useQuery({
    queryKey: [table, "collection", opts?.onlyPublished ?? false],
    queryFn: async () => {
      let q: any = supabase.from(table).select("*").order("sort_order", { ascending: true });
      if (opts?.onlyPublished) q = q.eq("published", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },
    staleTime: 30_000,
  });
}
