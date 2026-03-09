import Link from "next/link";
import { MOCK_PROJECTS } from "@/lib/mock-data";

const statusBadge: Record<string, string> = {
    draft:
        "bg-surface-border/50 text-slate-400",
    processing:
        "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    done: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
};

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                        Your Projects
                    </h1>
                    <p className="mt-1 text-sm text-slate-400">
                        Create social-ready shorts from your talking-head videos.
                    </p>
                </div>
                <Link
                    href="/new"
                    className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40 hover:scale-105 active:scale-95"
                >
                    + New Project
                </Link>
            </div>

            {/* Project Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {MOCK_PROJECTS.map((p) => (
                    <Link
                        key={p.id}
                        href="/templates"
                        className="glass-card glow-hover group flex flex-col gap-4 p-5 transition-all hover:bg-surface-hover/50"
                    >
                        {/* Thumbnail area */}
                        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-surface-hover to-surface">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/5 transition-transform group-hover:scale-110">
                                <svg
                                    className="h-7 w-7 text-accent"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                                    />
                                </svg>
                            </div>
                            {/* Status badge */}
                            <span
                                className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge[p.status]}`}
                            >
                                {p.status}
                            </span>
                        </div>

                        {/* Info */}
                        <div>
                            <h3 className="font-semibold text-white group-hover:text-accent transition-colors">
                                {p.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                                {new Date(p.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    </Link>
                ))}

                {/* Empty state card */}
                <Link
                    href="/new"
                    className="glass-card glow-hover flex flex-col items-center justify-center gap-3 p-5 text-center transition-all hover:bg-surface-hover/50"
                >
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                        <svg
                            className="h-7 w-7 text-accent"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-400">
                        Create New Project
                    </span>
                </Link>
            </div>
        </div>
    );
}
