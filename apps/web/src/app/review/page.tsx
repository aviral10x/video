"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getTemplateById, TEMPLATES } from "@video-editor/shared";

function ReviewContent() {
    const searchParams = useSearchParams();
    const templateId = searchParams.get("template") ?? TEMPLATES[0].id;
    const template = getTemplateById(templateId) ?? TEMPLATES[0];

    const [hookText, setHookText] = useState("This will blow your mind 🤯");
    const [accentColor, setAccentColor] = useState(template.accentColor);
    const [captionIntensity, setCaptionIntensity] = useState<
        "subtle" | "default" | "bold"
    >("default");
    const [exporting, setExporting] = useState(false);

    const intensityLabel: Record<string, string> = {
        subtle: "Subtle",
        default: "Default",
        bold: "Bold",
    };

    function handleExport() {
        setExporting(true);
        // Simulate export
        setTimeout(() => setExporting(false), 3000);
    }

    return (
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left — Preview */}
            <div className="space-y-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">
                    Review &amp; Export
                </h1>
                <p className="text-sm text-slate-400">
                    Using template:{" "}
                    <span className="font-semibold text-white">{template.name}</span>
                </p>

                {/* Preview Player (placeholder) */}
                <div className="relative mx-auto flex aspect-[9/16] max-h-[600px] w-full max-w-[340px] items-center justify-center overflow-hidden rounded-2xl border border-surface-border bg-gradient-to-b from-surface-card to-surface">
                    {/* Mock hook card */}
                    <div
                        className="absolute inset-x-0 top-0 flex items-center justify-center p-6"
                        style={{ background: template.hook.background }}
                    >
                        <p
                            className="text-center font-bold leading-tight"
                            style={{
                                color: template.hook.textColor,
                                fontSize: `${template.hook.fontSize / 3}px`,
                            }}
                        >
                            {hookText}
                        </p>
                    </div>

                    {/* Centre play icon */}
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                        <svg
                            className="ml-1 h-8 w-8 text-white/80"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>

                    {/* Mock captions */}
                    <div className="absolute inset-x-4 bottom-16 space-y-1 text-center">
                        <span
                            className="inline-block rounded-md px-2 py-0.5 text-xs font-semibold"
                            style={{
                                backgroundColor: template.caption.backgroundColor,
                                color: template.caption.color,
                            }}
                        >
                            completely{" "}
                            <span style={{ color: template.caption.highlightColor }}>
                                change
                            </span>{" "}
                            how you create
                        </span>
                    </div>

                    {/* Mock CTA */}
                    <div
                        className="absolute inset-x-0 bottom-0 flex items-center justify-center p-4"
                        style={{ background: template.cta.background }}
                    >
                        <span className="text-sm font-bold text-white">
                            {template.cta.buttonText}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right — Controls */}
            <div className="space-y-6">
                <div className="glass-card space-y-6 p-6">
                    <h2 className="text-lg font-bold text-white">Customise</h2>

                    {/* Hook Text */}
                    <div className="space-y-2">
                        <label
                            htmlFor="hook-text"
                            className="text-sm font-medium text-slate-300"
                        >
                            Hook Text
                        </label>
                        <input
                            id="hook-text"
                            type="text"
                            value={hookText}
                            onChange={(e) => setHookText(e.target.value)}
                            className="w-full rounded-lg border border-surface-border bg-surface px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/40"
                        />
                    </div>

                    {/* Accent Color */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Accent Color
                        </label>
                        <div className="flex gap-3">
                            {["#6366F1", "#F43F5E", "#0EA5E9", "#10B981", "#F59E0B"].map(
                                (c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setAccentColor(c)}
                                        className={`h-9 w-9 rounded-full border-2 transition-all ${accentColor === c
                                                ? "border-white scale-110 shadow-lg"
                                                : "border-transparent hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: c }}
                                    />
                                )
                            )}
                            <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-surface-border hover:border-accent/40">
                                <svg
                                    className="h-4 w-4 text-slate-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 4.5v15m7.5-7.5h-15"
                                    />
                                </svg>
                                <input
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="sr-only"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Caption Intensity */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">
                            Caption Intensity
                        </label>
                        <div className="flex gap-2">
                            {(["subtle", "default", "bold"] as const).map((level) => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setCaptionIntensity(level)}
                                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${captionIntensity === level
                                            ? "border-accent bg-accent/10 text-accent"
                                            : "border-surface-border text-slate-400 hover:border-surface-hover hover:text-slate-300"
                                        }`}
                                >
                                    {intensityLabel[level]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Export Button */}
                <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full rounded-lg bg-gradient-to-r from-accent to-accent-pink py-3.5 text-sm font-bold text-white shadow-lg shadow-accent/30 transition-all hover:shadow-accent/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
                >
                    {exporting ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg
                                className="h-4 w-4 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                />
                            </svg>
                            Exporting…
                        </span>
                    ) : (
                        "Export MP4 ↓"
                    )}
                </button>
            </div>
        </div>
    );
}

export default function ReviewPage() {
    return (
        <Suspense
            fallback={
                <div className="flex h-64 items-center justify-center text-slate-500">
                    Loading…
                </div>
            }
        >
            <ReviewContent />
        </Suspense>
    );
}
