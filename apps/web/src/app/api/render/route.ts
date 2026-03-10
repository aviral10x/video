import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import path from "path";
import os from "os";
import fs from "fs";

/**
 * POST /api/render
 *
 * Creates a render job and triggers Remotion server-side rendering.
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

    const supabase = createAdminClient();

    // 1. Fetch the project + template + transcript
    const { data: project, error: fetchError } = await supabase
        .from("projects")
        .select("*, templates(*)")
        .eq("id", body.projectId)
        .single();

    if (fetchError || !project) {
        return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
        );
    }

    // 2. Fetch transcript words
    let transcriptWords: { word: string; start: number; end: number }[] = [];
    const { data: transcript } = await supabase
        .from("transcripts")
        .select("*, transcript_words(*)")
        .eq("project_id", body.projectId)
        .single();

    if (transcript?.transcript_words?.length) {
        transcriptWords = (transcript.transcript_words as any[])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((w: any) => ({
                word: w.word,
                start: w.start_sec,
                end: w.end_sec,
            }));
    }

    // 3. Create render job in DB
    const { data: job, error: jobError } = await supabase
        .from("render_jobs")
        .insert({
            project_id: body.projectId,
            status: "queued",
            progress: 0,
        })
        .select()
        .single();

    if (jobError || !job) {
        return NextResponse.json(
            { error: `Failed to create render job: ${jobError?.message}` },
            { status: 500 }
        );
    }

    // 4. Kick off render in background (non-blocking)
    const template = project.templates as any;
    const templateConfig = template
        ? {
              id: template.slug,
              name: template.name,
              description: template.description ?? "",
              accentColor: template.accent_color,
              hook: template.hook_config,
              caption: template.caption_config,
              zoom: template.zoom_config,
              cta: template.cta_config,
          }
        : null;

    renderInBackground({
        jobId: job.id,
        projectId: body.projectId,
        videoUrl: project.video_url ?? "",
        hookText: project.hook_text ?? "",
        ctaText: templateConfig?.cta?.buttonText ?? "Follow for more",
        transcriptWords,
        templateConfig,
        zoomTimestamps: [],
    }).catch((err) => {
        console.error("[render] Background render failed:", err);
    });

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

    const supabase = createAdminClient();

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

/* ── Background Render ─────────────────────── */

interface RenderParams {
    jobId: string;
    projectId: string;
    videoUrl: string;
    hookText: string;
    ctaText: string;
    transcriptWords: { word: string; start: number; end: number }[];
    templateConfig: any;
    zoomTimestamps: number[];
}

async function renderInBackground(params: RenderParams) {
    const supabase = createAdminClient();

    try {
        // Update status to rendering
        await supabase
            .from("render_jobs")
            .update({ status: "rendering", progress: 5, started_at: new Date().toISOString() })
            .eq("id", params.jobId);

        // Dynamic imports to avoid loading heavy Remotion modules at startup
        const { bundle } = await import("@remotion/bundler");
        const { renderMedia, selectComposition } = await import("@remotion/renderer");

        // Bundle the Remotion project
        await supabase
            .from("render_jobs")
            .update({ progress: 10 })
            .eq("id", params.jobId);

        const entryPoint = path.resolve(
            process.cwd(),
            "../../packages/video/src/root.tsx"
        );

        const bundleLocation = await bundle({
            entryPoint,
            onProgress: (progress: number) => {
                // Map bundle progress (0-100) to render progress (10-30)
                const mappedProgress = Math.round(10 + progress * 0.2);
                supabase
                    .from("render_jobs")
                    .update({ progress: mappedProgress })
                    .eq("id", params.jobId)
                    .then(() => {});
            },
        });

        await supabase
            .from("render_jobs")
            .update({ progress: 30 })
            .eq("id", params.jobId);

        const fps = 30;
        const durationSec = 15;
        const durationInFrames = fps * durationSec;

        // Select the composition
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: "VideoEditor",
            inputProps: {
                sourceVideoUrl: params.videoUrl,
                transcriptWords: params.transcriptWords,
                templateConfig: params.templateConfig,
                hookText: params.hookText,
                ctaText: params.ctaText,
                zoomTimestamps: params.zoomTimestamps,
                durationInFrames,
                fps,
            },
        });

        // Create temp output path
        const outputDir = path.join(os.tmpdir(), "video-editor-renders");
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path.join(outputDir, `${params.jobId}.mp4`);

        // Render the video
        await renderMedia({
            composition: {
                ...composition,
                durationInFrames,
                fps,
            },
            serveUrl: bundleLocation,
            codec: "h264",
            outputLocation: outputPath,
            onProgress: ({ progress }: { progress: number }) => {
                // Map render progress (0-1) to job progress (30-90)
                const mappedProgress = Math.round(30 + progress * 60);
                supabase
                    .from("render_jobs")
                    .update({ progress: mappedProgress })
                    .eq("id", params.jobId)
                    .then(() => {});
            },
        });

        await supabase
            .from("render_jobs")
            .update({ progress: 90 })
            .eq("id", params.jobId);

        // Upload to Supabase Storage
        const fileBuffer = fs.readFileSync(outputPath);
        const storagePath = `${params.projectId}/${params.jobId}.mp4`;

        const { error: uploadError } = await supabase.storage
            .from("renders")
            .upload(storagePath, fileBuffer, {
                contentType: "video/mp4",
                upsert: true,
            });

        // Clean up temp file
        try {
            fs.unlinkSync(outputPath);
        } catch {}

        if (uploadError) {
            throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
            .from("renders")
            .getPublicUrl(storagePath);

        // Update job as done
        await supabase
            .from("render_jobs")
            .update({
                status: "done",
                progress: 100,
                output_url: urlData.publicUrl,
                completed_at: new Date().toISOString(),
            })
            .eq("id", params.jobId);

        // Update project status
        await supabase
            .from("projects")
            .update({ status: "done" })
            .eq("id", params.projectId);

    } catch (err: any) {
        console.error("[render] Error:", err);
        await supabase
            .from("render_jobs")
            .update({
                status: "failed",
                error_message: err.message ?? "Unknown error",
                completed_at: new Date().toISOString(),
            })
            .eq("id", params.jobId);

        await supabase
            .from("projects")
            .update({ status: "failed" })
            .eq("id", params.projectId);
    }
}
