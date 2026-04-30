import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, anonKey);
    const { data: { user: caller } } = await supabaseAuth.auth.getUser(token);

    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("is_master, permissions")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    const isMaster = callerRole?.is_master === true;
    const hasUsersPermission = isMaster || (callerRole?.permissions || []).includes("users");

    if (!hasUsersPermission) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine action: GET request = list, POST request uses body.action
    if (req.method === "GET") {
      return await handleList(supabaseAdmin, corsHeaders);
    }

    const body = await req.json();
    const action = body.action || "list";

    if (action === "list") {
      return await handleList(supabaseAdmin, corsHeaders);
    }

    if (action === "create") {
      const { email, password, permissions, is_master, username, recovery_email } = body;

      if (!password) {
        return new Response(JSON.stringify({ error: "Senha é obrigatória" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!recovery_email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recovery_email)) {
        return new Response(JSON.stringify({ error: "E-mail de recuperação válido é obrigatório" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Determine the auth email: prefer explicit email, else username@prospect.system, else recovery_email
      let authEmail = email && email.trim() ? email.trim() : null;
      if (!authEmail && username && username.trim()) {
        authEmail = `${username.trim().toLowerCase()}@prospect.system`;
      }
      if (!authEmail) authEmail = recovery_email;

      if (is_master && !isMaster) {
        return new Response(JSON.stringify({ error: "Only master admins can create master admins" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("user_roles").insert({
        user_id: newUser.user.id,
        role: "admin",
        is_master: is_master || false,
        permissions: permissions || [],
      });

      await supabaseAdmin.from("user_profiles").insert({
        user_id: newUser.user.id,
        username: username?.trim() || null,
        recovery_email,
      });

      return new Response(JSON.stringify({ id: newUser.user.id, email: authEmail }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_profile") {
      const { user_id, username, recovery_email } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (recovery_email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recovery_email)) {
        return new Response(JSON.stringify({ error: "E-mail inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error: upErr } = await supabaseAdmin.from("user_profiles").upsert({
        user_id,
        username: username?.trim() || null,
        recovery_email: recovery_email || null,
      }, { onConflict: "user_id" });
      if (upErr) {
        return new Response(JSON.stringify({ error: upErr.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update") {
      const { user_id, permissions, is_master } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (is_master !== undefined && !isMaster) {
        return new Response(JSON.stringify({ error: "Only master admins can change master status" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updateData: any = {};
      if (permissions !== undefined) updateData.permissions = permissions;
      if (is_master !== undefined) updateData.is_master = is_master;

      await supabaseAdmin
        .from("user_roles")
        .update(updateData)
        .eq("user_id", user_id)
        .eq("role", "admin");

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      const { user_id, password } = body;

      if (!user_id || !password) {
        return new Response(JSON.stringify({ error: "user_id and password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (password.length < 6) {
        return new Response(JSON.stringify({ error: "Senha deve ter ao menos 6 caracteres" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: targetRole } = await supabaseAdmin
        .from("user_roles")
        .select("is_master")
        .eq("user_id", user_id)
        .eq("role", "admin")
        .single();

      // Only master can reset another master's password (or their own)
      if (targetRole?.is_master && !isMaster) {
        return new Response(JSON.stringify({ error: "Only master admins can reset master passwords" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        password,
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = body;

      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: targetRole } = await supabaseAdmin
        .from("user_roles")
        .select("is_master")
        .eq("user_id", user_id)
        .eq("role", "admin")
        .single();

      if (targetRole?.is_master && !isMaster) {
        return new Response(JSON.stringify({ error: "Only master admins can delete master admins" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
      await supabaseAdmin.auth.admin.deleteUser(user_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleList(supabaseAdmin: any, corsHeaders: any) {
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("*")
    .eq("role", "admin");

  if (!roles || roles.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userIds = roles.map((r: any) => r.user_id);
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const { data: profiles } = await supabaseAdmin
    .from("user_profiles")
    .select("user_id, username, recovery_email")
    .in("user_id", userIds);

  const adminUsers = users
    .filter((u: any) => userIds.includes(u.id))
    .map((u: any) => {
      const role = roles.find((r: any) => r.user_id === u.id);
      const profile = profiles?.find((p: any) => p.user_id === u.id);
      return {
        id: u.id,
        email: u.email,
        username: profile?.username || null,
        recovery_email: profile?.recovery_email || null,
        is_master: role?.is_master || false,
        permissions: role?.permissions || [],
        created_at: u.created_at,
      };
    });

  return new Response(JSON.stringify(adminUsers), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

