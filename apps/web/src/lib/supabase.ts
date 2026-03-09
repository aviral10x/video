import { createClient } from "@supabase/supabase-js";
import type { Database } from "@video-editor/shared";

/**
 * Browser-side Supabase client (uses anon key).
 * Safe to use in client components.
 */
export function createBrowserClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient<Database>(url, key);
}

/**
 * Server-side Supabase client (uses service role key).
 * Only use in API routes and server components.
 */
export function createServerClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient<Database>(url, key);
}
