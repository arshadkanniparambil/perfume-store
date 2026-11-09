import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertNotServiceRoleKey } from "@/lib/supabase-keys";

/*
 * Supabase client for server code (server components and route handlers).
 *
 * It uses the public anon/publishable key, so every query runs under Row
 * Level Security exactly like a shopper's would. The service-role key is
 * deliberately NOT used by the website: it bypasses RLS and is only for
 * trusted scripts. `import "server-only"` makes the build fail if this file
 * is ever imported into browser code.
 */

let client: SupabaseClient | null | undefined;

/** Returns null when Supabase is not configured (local development). */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    client = null;
    return client;
  }
  assertNotServiceRoleKey(key);
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
