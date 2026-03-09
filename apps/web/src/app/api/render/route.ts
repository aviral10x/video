import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

/**
 * POST /api/render
 *
 * Creates a render job in the database.
 * Accepts: { projectId, templateId }
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);

    if (!body || !body.projectId || !body.templateId) {
        return NextResponse.json(
            { error: "Missing projectId or templateId" },
            { status: 400 }
        );
    }

    // Stub mode if Supabase is not configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({
            ok: true,
            job: {
                id: `render-${Date.now()}`,
                project_id: body.projectId,
                status: "queued",
                progress: 0,
                output_url: null,
                created_at: new Date().toISOString(),
            },
            message: "Render stub — Supabase not configured.",
        });
    }

    const supabase = createServerClient();

    const { data: job, error } = await supabase
        .from("render_jobs")
        .insert({
            project_id: body.projectId,
            status: "queued",
            progress: 0,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json(
            { error: `Failed to create render job: ${error.message}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ ok: true, job });
}

/**
 * GET /api/render?jobId=xxx
 *
 * Fetches render job status from the database.
 */
export async function GET(request: NextRequest) {
    const jobId = request.nextUrl.searchParams.get("jobId");

    if (!jobId) {
        return NextResponse.json(
            { error: "Missing jobId query parameter" },
            { status: 400 }
        );
    }

    // Stub mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({
            ok: true,
            job: {
                id: jobId,
                project_id: "unknown",
                status: "done",
                progress: 100,
                output_url: `/renders/${jobId}.mp4`,
                created_at: new Date().toISOString(),
            },
        });
    }

    const supabase = createServerClient();

    const { data: job, error } = await supabase
        .from("render_jobs")
        .select()
        .eq("id", jobId)
        .single();

    if (error || !job) {
        return NextResponse.json(
            { error: "Render job not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({ ok: true, job });
}
