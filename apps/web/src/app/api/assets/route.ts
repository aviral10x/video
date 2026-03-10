import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/assets?type=vfx|sfx|broll|music&category=slug
 *
 * Browse assets by type, with optional category filter.
 */
export async function GET(request: NextRequest) {
    const type = request.nextUrl.searchParams.get("type");
    const category = request.nextUrl.searchParams.get("category");

    if (!type || !["vfx", "sfx", "broll", "music"].includes(type)) {
        return NextResponse.json(
            { error: "Missing or invalid 'type' param. Use: vfx, sfx, broll, music" },
            { status: 400 }
        );
    }

    const supabase = createServerClient();

    // Query the correct table based on type
    async function queryAssets(assetType: string) {
        if (assetType === "vfx") {
            let q = supabase.from("vfx_presets").select("*").order("sort_order");
            if (category) {
                const { data: cat } = await supabase.from("asset_categories").select("id").eq("slug", category).single();
                if (cat) q = q.eq("category_id", cat.id);
            }
            return q;
        }
        if (assetType === "sfx") {
            let q = supabase.from("sfx_clips").select("*").order("sort_order");
            if (category) {
                const { data: cat } = await supabase.from("asset_categories").select("id").eq("slug", category).single();
                if (cat) q = q.eq("category_id", cat.id);
            }
            return q;
        }
        if (assetType === "broll") {
            let q = supabase.from("broll_clips").select("*").order("sort_order");
            if (category) {
                const { data: cat } = await supabase.from("asset_categories").select("id").eq("slug", category).single();
                if (cat) q = q.eq("category_id", cat.id);
            }
            return q;
        }
        // music
        let q = supabase.from("music_tracks").select("*").order("sort_order");
        if (category) {
            const { data: cat } = await supabase.from("asset_categories").select("id").eq("slug", category).single();
            if (cat) q = q.eq("category_id", cat.id);
        }
        return q;
    }

    const { data, error } = await queryAssets(type);

    if (error) {
        return NextResponse.json(
            { error: `Failed to fetch assets: ${error.message}` },
            { status: 500 }
        );
    }

    // Also fetch available categories for this type
    const { data: categories } = await supabase
        .from("asset_categories")
        .select("slug, name")
        .eq("asset_type", type as "vfx" | "sfx" | "broll" | "music")
        .order("sort_order");

    return NextResponse.json({
        ok: true,
        assets: data ?? [],
        categories: categories ?? [],
    });
}
