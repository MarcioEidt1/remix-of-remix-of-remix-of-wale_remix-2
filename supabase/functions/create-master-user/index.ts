import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const email = "prospectsystem@prospect.system";
    const password = "Usb35an2010";

    // Check if user already exists
    const { data: list } = await supabase.auth.admin.listUsers();
    let user = list?.users?.find((u) => u.email === email);

    if (user) {
      // Update password
      await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createErr) throw createErr;
      user = created.user!;
    }

    // Ensure admin role with master = true
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (existingRole) {
      await supabase
        .from("user_roles")
        .update({ is_master: true, permissions: [] })
        .eq("id", existingRole.id);
    } else {
      await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "admin",
        is_master: true,
        permissions: [],
      });
    }

    return new Response(
      JSON.stringify({ success: true, user_id: user.id, email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
