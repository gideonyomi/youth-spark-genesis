// Admin & editor management
// - list:               all staff (admins + editors) with roles
// - list_pending:       signup requests awaiting approval
// - toggle:             grant/revoke admin or editor role (admin only)
// - approve:            grant editor role + mark request approved (admin only)
// - reject / suspend:   mark request, optionally delete auth user (admin only)
// - delete_user:        permanently remove an auth user (admin only)
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
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceKey);

  const { data: callerRoles } = await admin
    .from("user_roles").select("role").eq("user_id", userData.user.id);
  const roles = (callerRoles ?? []).map((r: any) => r.role);
  const isStaff = roles.includes("admin") || roles.includes("editor");
  const isAdmin = roles.includes("admin");
  if (!isStaff) return json({ error: "Forbidden" }, 403);

  let body: any = {};
  try { body = await req.json(); } catch { /* noop */ }
  const action = body?.action ?? "list";

  const requireAdmin = () => {
    if (!isAdmin) { return json({ error: "Admins only" }, 403); }
    return null;
  };

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
        id: u.id, email: u.email,
        created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
        roles: byUser[u.id] ?? [],
      }));
    return json({ users, callerId: userData.user.id });
  }

  if (action === "list_pending") {
    const { data, error } = await admin
      .from("pending_signups").select("*").eq("status", "pending").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ pending: data ?? [] });
  }

  if (action === "approve") {
    const denied = requireAdmin(); if (denied) return denied;
    const id = String(body.id ?? "");
    const { data: row, error: rowErr } = await admin.from("pending_signups").select("*").eq("id", id).maybeSingle();
    if (rowErr || !row) return json({ error: "Request not found" }, 404);
    const { error: gErr } = await admin.from("user_roles")
      .upsert({ user_id: row.user_id, role: "editor" }, { onConflict: "user_id,role" });
    if (gErr) return json({ error: gErr.message }, 500);
    await admin.from("pending_signups").update({
      status: "approved", reviewed_by: userData.user.id, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    return json({ ok: true });
  }

  if (action === "reject" || action === "suspend") {
    const denied = requireAdmin(); if (denied) return denied;
    const id = String(body.id ?? "");
    const { data: row } = await admin.from("pending_signups").select("*").eq("id", id).maybeSingle();
    if (!row) return json({ error: "Request not found" }, 404);
    // Remove all roles and delete the auth user for rejection/suspension
    await admin.from("user_roles").delete().eq("user_id", row.user_id);
    await admin.auth.admin.deleteUser(row.user_id).catch(() => {});
    await admin.from("pending_signups").update({
      status: action === "reject" ? "rejected" : "suspended",
      reviewed_by: userData.user.id, reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    return json({ ok: true });
  }

  if (action === "delete_user") {
    const denied = requireAdmin(); if (denied) return denied;
    const target = String(body.user_id ?? "");
    if (!target) return json({ error: "Bad request" }, 400);
    if (target === userData.user.id) return json({ error: "You cannot delete your own account" }, 400);
    const { count } = await admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    const { data: targetRoles } = await admin.from("user_roles").select("role").eq("user_id", target);
    const targetIsAdmin = (targetRoles ?? []).some((r: any) => r.role === "admin");
    if (targetIsAdmin && (count ?? 0) <= 1) return json({ error: "At least one admin must remain" }, 400);
    await admin.from("user_roles").delete().eq("user_id", target);
    await admin.from("pending_signups").delete().eq("user_id", target);
    const { error } = await admin.auth.admin.deleteUser(target);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }

  if (action === "toggle") {
    const denied = requireAdmin(); if (denied) return denied;
    const target_user_id = String(body.user_id ?? "");
    const role = String(body.role ?? "");
    const enabled = Boolean(body.enabled);
    if (!target_user_id || !["admin", "editor"].includes(role)) return json({ error: "Bad request" }, 400);
    if (enabled) {
      const { error } = await admin.from("user_roles")
        .upsert({ user_id: target_user_id, role }, { onConflict: "user_id,role" });
      if (error) return json({ error: error.message }, 500);
    } else {
      if (target_user_id === userData.user.id && role === "admin")
        return json({ error: "You cannot remove your own admin role" }, 400);
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
