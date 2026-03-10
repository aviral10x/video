"use client";

import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
import type { Database } from "@video-editor/shared";

/**
 * Browser-only Supabase client with cookie-based auth.
 * Use this in "use client" components instead of createBrowserClient from supabase.ts
 * (which imports next/headers and can't be used client-side).
 */
export function createClientSupabase() {
    return createSSRBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
