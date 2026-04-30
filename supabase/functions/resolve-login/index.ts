// Edge function to resolve a username/email/recovery-email to a login email.
// Replaces the public-callable RPCs resolve_login_email / resolve_recovery_email
// to prevent unauthenticated user enumeration of admin accounts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Simple in-memory rate limiter per IP (per isolate). 10 requests / 60s.
const buckets = new Map<string, { count: number; reset: number }>();
const LIMIT = 10;
const WINDOW_MS = 60_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || b.reset < now) {
    buckets.set(ip, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  b.count += 1;
  return b.count > LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
    if (rateLimited(ip)) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { login, mode } = await req.json();
    if (!login || typeof login !== "string") {
      return new Response(JSON.stringify({ email: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const fnName = mode === "recovery" ? "resolve_recovery_email" : "resolve_login_email";
    const { data, error } = await supabase.rpc(fnName, { _login: login });
    if (error) throw error;

    return new Response(JSON.stringify({ email: data ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resolve-login error", e);
    // Return null to avoid leaking errors that could aid enumeration.
    return new Response(JSON.stringify({ email: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
