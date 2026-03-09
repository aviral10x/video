"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@video-editor/shared";

const accentMap: Record<string, string> = {
    "#6366F1": "from-indigo-500 to-purple-600",
    "#F43F5E": "from-rose-500 to-pink-600",
    "#0EA5E9": "from-sky-500 to-cyan-600",
};

export default function TemplatesPage() {
    const router = useRouter();
    const [selected, setSelected] = useState<string | null>(null);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Choose a Template
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                    Pick a style that fits your content. You can customise colors later.
                </p>
            </div>

            {/* Template Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {TEMPLATES.map((t) => {
                    const isSelected = selected === t.id;
                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelected(t.id)}
                            className={`glass-card glow-hover group relative flex flex-col gap-4 p-5 text-left transition-all hover:bg-surface-hover/50 ${isSelected
                                    ? "ring-2 ring-accent shadow-lg shadow-accent/20"
                                    : ""
                                }`}
                        >
                            {/* Selection indicator */}
                            {isSelected && (
                                <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-accent shadow-lg">
                                    <svg
                                        className="h-4 w-4 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={3}
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="m4.5 12.75 6 6 9-13.5"
                                        />
                                    </svg>
                                </div>
                            )}

                            {/* Preview gradient */}
                            <div
                                className={`flex h-44 items-end overflow-hidden rounded-lg bg-gradient-to-br ${accentMap[t.accentColor] ?? "from-slate-600 to-slate-800"
                                    } p-4 transition-transform group-hover:scale-[1.02]`}
                            >
                                {/* Mini phone mockup */}
                                <div className="mx-auto flex h-full w-24 flex-col justify-between overflow-hidden rounded-lg bg-black/40 p-2 backdrop-blur-sm">
                                    <div className="rounded bg-white/10 px-2 py-1">
                                        <div className="h-1.5 w-10 rounded-full bg-white/40" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="h-1 w-full rounded-full bg-white/20" />
                                        <div className="h-1 w-3/4 rounded-full bg-white/30" />
                                        <div
                                            className="h-1 w-1/2 rounded-full"
                                            style={{ backgroundColor: t.accentColor }}
                                        />
                                    </div>
                                    <div
                                        className="rounded px-1 py-0.5 text-center"
                                        style={{ backgroundColor: t.accentColor }}
                                    >
                                        <div className="h-1 w-8 mx-auto rounded-full bg-white/60" />
                                    </div>
                                </div>
                            </div>

                            {/* Info */}
                            <div>
                                <h3 className="text-lg font-bold text-white">{t.name}</h3>
                                <p className="mt-1 text-sm leading-relaxed text-slate-400">
                                    {t.description}
                                </p>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    `Zoom ${t.zoom.scale}×`,
                                    t.caption.position === "center"
                                        ? "Centred captions"
                                        : "Bottom captions",
                                    t.zoom.easing === "spring" ? "Spring zoom" : "Smooth zoom",
                                ].map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-slate-400"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Generate preview */}
            <div className="flex justify-end">
                <button
                    type="button"
                    disabled={!selected}
                    onClick={() => router.push(`/review?template=${selected}`)}
                    className="rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:shadow-accent/40 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                    Generate Preview →
                </button>
            </div>
        </div>
    );
}
