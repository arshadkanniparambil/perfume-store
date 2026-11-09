import "server-only";
import { cache } from "react";
import type { Product } from "@/lib/catalog";
import { sampleProducts } from "@/lib/sample-catalog";
import { parseCatalog } from "@/lib/validation";
import { getSupabaseServerClient } from "@/lib/server/supabase";

let warned = false;

/**
 * Loads the storefront catalog from Supabase (get_catalog()).
 *
 * If SUPABASE_URL / SUPABASE_ANON_KEY are not set, the built-in sample
 * catalog is used instead so the site still runs without a database. If
 * Supabase IS configured and the request fails, this throws rather than
 * silently showing stale sample data.
 */
export const getCatalog = cache(async (): Promise<Product[]> => {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    if (!warned) {
      warned = true;
      console.warn(
        "[catalog] Supabase is not configured; using the sample catalog. " +
          "Set SUPABASE_URL and SUPABASE_ANON_KEY to read from the database.",
      );
    }
    return sampleProducts;
  }
  const { data, error } = await supabase.rpc("get_catalog");
  if (error) {
    throw new Error(`Could not load the catalog: ${error.message}`);
  }
  return parseCatalog(data);
});
