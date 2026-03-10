import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@video-editor/shared";

/**
 * Browser-side Supabase client with cookie-based auth.
 * Use in client components.
 */
export function createBrowserClient() {
    return createSSRBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

/**
 * Server-side Supabase client with cookie-based auth.
 * Use in server components and API routes for authenticated requests.
 * Respects RLS policies based on the logged-in user's session.
 */
export function createServerClient() {
    const cookieStore = cookies();

    return createSSRServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    } catch {
                        // setAll is called from Server Component — ignore
                    }
                },
            },
        }
    );
}

/**
 * Admin Supabase client (service role key, bypasses RLS).
 * Only use for admin operations like cascade deletes, background jobs.
 */
export function createAdminClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}
