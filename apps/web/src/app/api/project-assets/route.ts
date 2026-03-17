import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { ProjectSchema } from '@video-editor/timeline-schema';

/**
 * GET /api/project-assets?projectId=xxx
 * Returns the saved timeline JSON for a project.
 */
export async function GET(request: NextRequest) {
    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
        return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('project_timeline' as any)
        .select('timeline_json')
        .eq('project_id', projectId)
        .single();

    if (error || !data) {
        return NextResponse.json({ ok: false, error: 'Timeline not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, timeline: (data as any).timeline_json });
}

/**
 * POST /api/project-assets
 * Body: { projectId: string, timeline: Project }
 * Upserts the timeline JSON to the DB.
 */
export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => null);
    if (!body?.projectId || !body?.timeline) {
        return NextResponse.json({ error: 'Missing projectId or timeline' }, { status: 400 });
    }

    // Validate against the universal schema before saving
    const parsed = ProjectSchema.safeParse(body.timeline);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid timeline schema', details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const supabase = createAdminClient();
    const { error } = await supabase
        .from('project_timeline' as any)
        .upsert(
            { project_id: body.projectId, timeline_json: parsed.data, updated_at: new Date().toISOString() },
            { onConflict: 'project_id' }
        );

    if (error) {
        return NextResponse.json({ error: `Save failed: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
