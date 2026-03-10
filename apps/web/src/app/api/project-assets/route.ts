import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * GET /api/project-assets?projectId=xxx
 *
 * List all assets attached to a project.
 */
export async function GET(request: NextRequest) {
    const projectId = request.nextUrl.searchParams.get("projectId");
    if (!projectId) {
        return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
        .from("project_assets")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

    if (error) {
        return NextResponse.json(
            { error: `Failed to fetch project assets: ${error.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, projectAssets: data ?? [] });
}

/**
 * POST /api/project-assets
 *
 * Body: { projectId, assetType, assetId, startSec?, endSec?, config? }
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body?.projectId || !body?.assetType || !body?.assetId) {
        return NextResponse.json(
            { error: "Missing projectId, assetType, or assetId" },
            { status: 400 }
        );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
        .from("project_assets")
        .insert({
            project_id: body.projectId,
            asset_type: body.assetType,
            asset_id: body.assetId,
            start_sec: body.startSec ?? null,
            end_sec: body.endSec ?? null,
            config: body.config ?? {},
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: `Failed to add asset: ${error.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, projectAsset: data });
}

/**
 * DELETE /api/project-assets?id=xxx
 *
 * Remove an asset from a project.
 */
export async function DELETE(request: NextRequest) {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
        .from("project_assets")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json(
            { error: `Failed to remove asset: ${error.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true });
}
