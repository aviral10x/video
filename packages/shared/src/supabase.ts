import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Create a Supabase client for use in browser or server components.
 *
 * Usage (browser):
 *   const supabase = createSupabaseClient();
 *
 * Usage (server / API route):
 *   const supabase = createSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY);
 */
export function createSupabaseClient(serviceRoleKey?: string) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = serviceRoleKey ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars"
        );
    }

    return createClient<Database>(url, key);
}

/**
 * Convenience: browser-safe client (uses anon key).
 */
export function getSupabaseBrowserClient() {
    return createSupabaseClient();
}

/**
 * Convenience: server client with elevated permissions.
 */
export function getSupabaseServerClient() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
    }
    return createSupabaseClient(key);
}
