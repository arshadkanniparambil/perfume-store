/**
 * Guards against putting a privileged Supabase key where the public key
 * belongs. Service-role / secret keys bypass Row Level Security and must
 * only ever be used by trusted scripts, never by the website.
 */
/** Rejects keys that would bypass Row Level Security. */
export function assertNotServiceRoleKey(key: string) {
  if (key.startsWith("sb_secret_")) {
    throw new Error(
      "SUPABASE_ANON_KEY holds a secret key. Use the publishable/anon key.",
    );
  }
  const [, payload] = key.split(".");
  if (!payload) return;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (claims?.role === "service_role") {
      throw new Error(
        "SUPABASE_ANON_KEY holds the service-role key. Use the anon key.",
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("service-role")) {
      throw error;
    }
  }
}
