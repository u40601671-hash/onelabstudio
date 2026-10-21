// Supabase client for the browser (used by the login forms and the user menu).
import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseKey } from "@/lib/supabase/config";

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}
