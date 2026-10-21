// Supabase connection settings. They come from .env.local (see SETUP.md).
// While they are missing, the website keeps working with the built-in sample data.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
