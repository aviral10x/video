import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

/**
 * POST /api/upload
 *
 * Accepts a multipart/form-data payload with a video file.
 * Uploads to Supabase Storage `videos` bucket.
 * Returns the public URL.
 */
export async function POST(request: NextRequest) {
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.includes("multipart/form-data")) {
        return NextResponse.json(
            { error: "Expected multipart/form-data" },
            { status: 400 }
        );
    }

    const formData = await request.formData();
    const file = formData.get("video");

    if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
            { error: "Missing 'video' field in form data" },
            { status: 400 }
        );
    }

    // Check env vars — if Supabase is not configured, return a stub
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const fakeUrl = `/uploads/${Date.now()}.mp4`;
        return NextResponse.json({
            ok: true,
            url: fakeUrl,
            size: file.size,
            message: "Upload stub — Supabase not configured, file not persisted.",
        });
    }

    const supabase = createAdminClient();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data, error } = await supabase.storage
        .from("videos")
        .upload(fileName, buffer, {
            contentType: "video/mp4",
            upsert: false,
        });

    if (error) {
        return NextResponse.json(
            { error: `Upload failed: ${error.message}` },
            { status: 500 }
        );
    }

    const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(data.path);

    return NextResponse.json({
        ok: true,
        url: urlData.publicUrl,
        path: data.path,
        size: file.size,
    });
}
