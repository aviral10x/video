"use client";

import { useState, useEffect, useCallback } from "react";

const ASSET_TYPES = [
    { key: "vfx", label: "VFX", icon: "✨" },
    { key: "sfx", label: "SFX", icon: "🔊" },
    { key: "broll", label: "B-roll", icon: "🎬" },
    { key: "music", label: "Music", icon: "🎵" },
] as const;

type AssetType = (typeof ASSET_TYPES)[number]["key"];

interface Asset {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    sort_order: number;
    is_premium: boolean;
    // Type-specific fields
    vfx_type?: string;
    sfx_type?: string;
    duration_ms?: number;
    bpm?: number;
    mood?: string;
    genre?: string;
    artist?: string;
    keywords?: string[];
    config?: Record<string, unknown>;
}

interface ProjectAsset {
    id: string;
    project_id: string;
    asset_type: string;
    asset_id: string;
    sort_order: number;
}

interface Category {
    slug: string;
    name: string;
}

interface AssetBrowserProps {
    projectId: string;
}

export function AssetBrowser({ projectId }: AssetBrowserProps) {
    const [activeTab, setActiveTab] = useState<AssetType>("vfx");
    const [assets, setAssets] = useState<Asset[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [projectAssets, setProjectAssets] = useState<ProjectAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    // Fetch assets for the active tab
    const fetchAssets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ type: activeTab });
            if (activeCategory) params.set("category", activeCategory);
            const res = await fetch(`/api/assets?${params}`);
            const data = await res.json();
            if (data.ok) {
                setAssets(data.assets);
                setCategories(data.categories);
            }
        } catch {
        } finally {
            setLoading(false);
        }
    }, [activeTab, activeCategory]);

    // Fetch project's attached assets
    const fetchProjectAssets = useCallback(async () => {
        try {
            const res = await fetch(`/api/project-assets?projectId=${projectId}`);
            const data = await res.json();
            if (data.ok) setProjectAssets(data.projectAssets);
        } catch {}
    }, [projectId]);

    useEffect(() => {
        fetchAssets();
    }, [fetchAssets]);

    useEffect(() => {
        fetchProjectAssets();
    }, [fetchProjectAssets]);

    // Check if an asset is already added
    function isAdded(assetId: string): boolean {
        return projectAssets.some(
            (pa) => pa.asset_id === assetId && pa.asset_type === activeTab
        );
    }

    // Add asset to project
    async function handleAdd(asset: Asset) {
        setAddingId(asset.id);
        try {
            const res = await fetch("/api/project-assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    assetType: activeTab,
                    assetId: asset.id,
                }),
            });
            const data = await res.json();
            if (data.ok) {
                setProjectAssets((prev) => [...prev, data.projectAsset]);
            }
        } finally {
            setAddingId(null);
        }
    }

    // Remove asset from project
    async function handleRemove(projectAssetId: string) {
        try {
            await fetch(`/api/project-assets?id=${projectAssetId}`, {
                method: "DELETE",
            });
            setProjectAssets((prev) =>
                prev.filter((pa) => pa.id !== projectAssetId)
            );
        } catch {}
    }

    function getProjectAssetId(assetId: string): string | null {
        return (
            projectAssets.find(
                (pa) => pa.asset_id === assetId && pa.asset_type === activeTab
            )?.id ?? null
        );
    }

    // Type-specific detail display
    function getAssetMeta(asset: Asset): string {
        if (activeTab === "vfx") return asset.vfx_type ?? "";
        if (activeTab === "sfx")
            return `${asset.sfx_type ?? ""} · ${asset.duration_ms ?? 0}ms`;
        if (activeTab === "broll")
            return `${((asset.duration_ms ?? 0) / 1000).toFixed(1)}s`;
        if (activeTab === "music")
            return `${asset.artist ?? ""} · ${asset.bpm ?? ""}bpm · ${asset.mood ?? ""}`;
        return "";
    }

    const addedCount = projectAssets.filter(
        (pa) => pa.asset_type === activeTab
    ).length;

    return (
        <div className="glass-card space-y-4 p-5">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Asset Library</h2>
                {addedCount > 0 && (
                    <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                        {addedCount} added
                    </span>
                )}
            </div>

            {/* Type Tabs */}
            <div className="flex gap-1 rounded-lg bg-surface p-1">
                {ASSET_TYPES.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                            setActiveTab(t.key);
                            setActiveCategory(null);
                        }}
                        className={`flex-1 rounded-md px-2 py-2 text-xs font-medium transition-all ${
                            activeTab === t.key
                                ? "bg-accent/15 text-accent shadow-sm"
                                : "text-slate-400 hover:text-slate-300"
                        }`}
                    >
                        <span className="mr-1">{t.icon}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Category filter pills */}
            {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    <button
                        type="button"
                        onClick={() => setActiveCategory(null)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                            !activeCategory
                                ? "bg-accent/15 text-accent"
                                : "bg-surface-hover/50 text-slate-500 hover:text-slate-300"
                        }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.slug}
                            type="button"
                            onClick={() => setActiveCategory(cat.slug)}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                                activeCategory === cat.slug
                                    ? "bg-accent/15 text-accent"
                                    : "bg-surface-hover/50 text-slate-500 hover:text-slate-300"
                            }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Asset list */}
            <div className="max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
                {loading ? (
                    <div className="flex h-20 items-center justify-center text-sm text-slate-500">
                        Loading…
                    </div>
                ) : assets.length === 0 ? (
                    <div className="flex h-20 items-center justify-center text-sm text-slate-500">
                        No assets found
                    </div>
                ) : (
                    assets.map((asset) => {
                        const added = isAdded(asset.id);
                        const paId = getProjectAssetId(asset.id);
                        return (
                            <div
                                key={asset.id}
                                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all ${
                                    added
                                        ? "border-accent/30 bg-accent/5"
                                        : "border-surface-border hover:border-surface-hover hover:bg-surface-hover/30"
                                }`}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-white">
                                        {asset.name}
                                        {asset.is_premium && (
                                            <span className="ml-1.5 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                                                PRO
                                            </span>
                                        )}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                        {getAssetMeta(asset)}
                                    </p>
                                </div>
                                {added ? (
                                    <button
                                        type="button"
                                        onClick={() => paId && handleRemove(paId)}
                                        className="shrink-0 rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleAdd(asset)}
                                        disabled={addingId === asset.id}
                                        className="shrink-0 rounded-md border border-accent/30 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition-all hover:bg-accent/20 disabled:opacity-50"
                                    >
                                        {addingId === asset.id ? "…" : "+ Add"}
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
