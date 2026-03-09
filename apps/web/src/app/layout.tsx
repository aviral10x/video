import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
    title: "Video Editor — Social-Ready Shorts in Seconds",
    description:
        "Upload a talking-head video, choose a template, and export a polished short with captions, hooks, and CTAs.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen antialiased">
                {/* ── Top Nav ──────────────────────────────────────── */}
                <nav className="sticky top-0 z-50 border-b border-surface-border/50 bg-surface/80 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-pink shadow-lg shadow-accent/20 transition-transform group-hover:scale-110">
                                <svg
                                    className="h-5 w-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                                    />
                                </svg>
                            </div>
                            <span className="text-lg font-bold tracking-tight text-white">
                                Video<span className="gradient-text">Editor</span>
                            </span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/new"
                                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40 hover:scale-105 active:scale-95"
                            >
                                + New Project
                            </Link>
                        </div>
                    </div>
                </nav>

                {/* ── Main Content ────────────────────────────────── */}
                <main className="mx-auto max-w-6xl px-6 py-10 animate-in">
                    {children}
                </main>
            </body>
        </html>
    );
}
