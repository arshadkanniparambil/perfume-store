import { createBrowserClient } from "@supabase/ssr";

// Only NEXT_PUBLIC_ values may be used here: this code runs in the browser.
// The publishable key is designed to be public; Row Level Security decides
// what it can read. Never put a secret / service-role key in a NEXT_PUBLIC_
// variable.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = () =>
  createBrowserClient(supabaseUrl!, supabaseKey!);
