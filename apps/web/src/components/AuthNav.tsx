"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export function AuthNav() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        const supabase = createClientSupabase();
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function handleSignOut() {
        const supabase = createClientSupabase();
        await supabase.auth.signOut();
        router.refresh();
        router.push("/login");
    }

    if (!user) return null;

    const initials = (
        user.user_metadata?.full_name ??
        user.email ??
        "U"
    )
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const avatarUrl = user.user_metadata?.avatar_url;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-surface-border bg-surface-hover text-xs font-bold text-accent transition-all hover:border-accent/40 hover:ring-2 hover:ring-accent/20"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                    />
                ) : (
                    initials
                )}
            </button>

            {showMenu && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />
                    {/* Menu */}
                    <div className="absolute right-0 top-10 z-50 min-w-[200px] rounded-lg border border-surface-border bg-surface-card p-2 shadow-xl">
                        <div className="border-b border-surface-border px-3 pb-2 mb-2">
                            <p className="text-sm font-medium text-white truncate">
                                {user.user_metadata?.full_name ?? "User"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                                {user.email}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                                />
                            </svg>
                            Sign out
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
