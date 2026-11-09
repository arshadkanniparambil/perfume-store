import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Supabase client for server code that acts as the signed-in shopper
 * (their session comes from cookies), e.g. "my orders" and "my addresses"
 * in later phases. Row Level Security limits it to that shopper's data.
 *
 * The public catalog uses lib/server/supabase.ts instead, which reads no
 * cookies so product pages can stay cached.
 */
export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) => {
  return createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored because middleware refreshes user sessions.
        }
      },
    },
  });
};
