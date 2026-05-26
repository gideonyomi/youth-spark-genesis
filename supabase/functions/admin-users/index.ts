// Lists all users + roles, and toggles admin/editor roles.
// Caller must be an authenticated staff member; we verify on the server with the service role.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  // Identify caller
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);

  // Must be staff (admin or editor) to read; must be admin to mutate
  const { data: callerRoles } = await admin
    .from("user_roles").select("role").eq("user_id", userData.user.id);
  const roles = (callerRoles ?? []).map((r: any) => r.role);
  const isStaff = roles.includes("admin") || roles.includes("editor");
  const isAdmin = roles.includes("admin");
  if (!isStaff) return json({ error: "Forbidden" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { /* noop */ }
  const action = body?.action ?? "list";

  if (action === "list") {
    const { data: list, error } = await admin.auth.admin.listUsers({ perPage: 200 });
    if (error) return json({ error: error.message }, 500);
    const { data: allRoles } = await admin.from("user_roles").select("user_id, role");
    const byUser: Record<string, string[]> = {};
    (allRoles ?? []).forEach((r: any) => {
      byUser[r.user_id] = [...(byUser[r.user_id] ?? []), r.role];
    });
    const users = (list.users ?? [])
      .filter((u) => (byUser[u.id] ?? []).length > 0)
      .map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        roles: byUser[u.id] ?? [],
      }));
    return json({ users, callerId: userData.user.id });
  }

  if (action === "toggle") {
    if (!isAdmin) return json({ error: "Admins only" }, 403);
    const target_user_id = String(body.user_id ?? "");
    const role = String(body.role ?? "");
    const enabled = Boolean(body.enabled);
    if (!target_user_id || !["admin", "editor"].includes(role)) return json({ error: "Bad request" }, 400);

    if (enabled) {
      const { error } = await admin.from("user_roles").upsert(
        { user_id: target_user_id, role },
        { onConflict: "user_id,role" },
      );
      if (error) return json({ error: error.message }, 500);
    } else {
      // Safety: never let admins disable their own admin role
      if (target_user_id === userData.user.id && role === "admin") {
        return json({ error: "You cannot remove your own admin role" }, 400);
      }
      // Safety: never remove the last admin
      if (role === "admin") {
        const { count } = await admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
        if ((count ?? 0) <= 1) return json({ error: "At least one admin must remain" }, 400);
      }
      const { error } = await admin.from("user_roles").delete().eq("user_id", target_user_id).eq("role", role);
      if (error) return json({ error: error.message }, 500);
    }
    return json({ ok: true });
  }

  return json({ error: "Unknown action" }, 400);
});
