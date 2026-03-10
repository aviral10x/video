import type { Metadata } from "next";
import Link from "next/link";
import { ToastProvider } from "@/components/Toast";
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
                <ToastProvider>
                    {/* ── Top Nav ──────────────────────────────────────── */}
                    <nav className="sticky top-0 z-50 border-b border-surface-border/50 bg-surface/80 backdrop-blur-xl">
                        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
                            <Link href="/" className="flex items-center gap-2 group sm:gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent-pink shadow-lg shadow-accent/20 transition-transform group-hover:scale-110 sm:h-9 sm:w-9">
                                    <svg
                                        className="h-4 w-4 text-white sm:h-5 sm:w-5"
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
                                <span className="text-base font-bold tracking-tight text-white sm:text-lg">
                                    Video<span className="gradient-text">Editor</span>
                                </span>
                            </Link>

                            <div className="flex items-center gap-3">
                                <Link
                                    href="/new"
                                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40 hover:scale-105 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
                                >
                                    + New
                                </Link>
                            </div>
                        </div>
                    </nav>

                    {/* ── Main Content ────────────────────────────────── */}
                    <main className="mx-auto max-w-6xl px-4 py-6 animate-in sm:px-6 sm:py-10">
                        {children}
                    </main>
                </ToastProvider>
            </body>
        </html>
    );
}

