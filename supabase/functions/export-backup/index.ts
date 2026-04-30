import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TABLES = [
  "site_settings",
  "banners",
  "testimonials",
  "vehicles",
  "vehicle_images",
  "vehicle_documents",
  "vehicle_expenses",
  "vehicle_movements",
  "contacts",
  "user_roles",
];

const BUCKETS = ["vehicle-images", "banner-images", "vehicle-documents"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const supabaseAuth = createClient(supabaseUrl, anonKey);
    const { data: { user: caller } } = await supabaseAuth.auth.getUser(token);
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    // Master only
    const { data: role } = await admin
      .from("user_roles")
      .select("is_master")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();
    if (!role?.is_master) return json({ error: "Apenas administradores Master podem exportar backups." }, 403);

    // Dump tables
    const tables: Record<string, unknown[]> = {};
    for (const t of TABLES) {
      const { data, error } = await admin.from(t).select("*");
      if (error) tables[t] = [];
      else tables[t] = data || [];
    }

    // Auth users (admin role only — for restoring credentials reference)
    const { data: usersList } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const adminUserIds = new Set((tables.user_roles as any[]).map((r) => r.user_id));
    const authUsers = (usersList?.users || [])
      .filter((u) => adminUserIds.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        email_confirmed_at: u.email_confirmed_at,
      }));

    // List bucket files
    const buckets: Record<string, { path: string; public_url: string }[]> = {};
    for (const b of BUCKETS) {
      buckets[b] = await listAllFiles(admin, b);
    }

    const totalMedia = Object.values(buckets).reduce((s, v) => s + v.length, 0);

    const payload = {
      manifest: {
        generated_at: new Date().toISOString(),
        version: "1.0",
        project_ref: supabaseUrl.match(/https:\/\/([^.]+)/)?.[1],
        counts: {
          ...Object.fromEntries(Object.entries(tables).map(([k, v]) => [k, v.length])),
          auth_users: authUsers.length,
          media_files: totalMedia,
        },
      },
      tables,
      auth_users: authUsers,
      buckets,
    };

    return json(payload);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function listAllFiles(admin: any, bucket: string): Promise<{ path: string; public_url: string }[]> {
  const out: { path: string; public_url: string }[] = [];
  async function walk(prefix: string) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error || !data) return;
    for (const item of data) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        // folder
        await walk(full);
      } else {
        const { data: pub } = admin.storage.from(bucket).getPublicUrl(full);
        out.push({ path: full, public_url: pub.publicUrl });
      }
    }
  }
  await walk("");
  return out;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
