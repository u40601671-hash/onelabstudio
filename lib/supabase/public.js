// Cookie-less client for public reads (live tools). Keeps public pages fast and cacheable.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl, supabaseKey } from "@/lib/supabase/config";

export function createPublicClient() {
  return createSupabaseClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
