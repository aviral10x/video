-- ============================================================
-- Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor to enable per-user data isolation.
-- ============================================================

-- Enable RLS on all user-owned tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

-- ── Projects ─────────────────────────────────
CREATE POLICY "Users can view their own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

-- ── Transcripts ──────────────────────────────
CREATE POLICY "Users can view transcripts of their projects"
    ON public.transcripts FOR SELECT
    USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert transcripts for their projects"
    ON public.transcripts FOR INSERT
    WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete transcripts of their projects"
    ON public.transcripts FOR DELETE
    USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- ── Transcript Words ─────────────────────────
CREATE POLICY "Users can view transcript words of their projects"
    ON public.transcript_words FOR SELECT
    USING (transcript_id IN (
        SELECT id FROM public.transcripts WHERE project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert transcript words for their projects"
    ON public.transcript_words FOR INSERT
    WITH CHECK (transcript_id IN (
        SELECT id FROM public.transcripts WHERE project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete transcript words of their projects"
    ON public.transcript_words FOR DELETE
    USING (transcript_id IN (
        SELECT id FROM public.transcripts WHERE project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
        )
    ));

-- ── Project Assets ───────────────────────────
CREATE POLICY "Users can view project assets of their projects"
    ON public.project_assets FOR SELECT
    USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert project assets for their projects"
    ON public.project_assets FOR INSERT
    WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete project assets of their projects"
    ON public.project_assets FOR DELETE
    USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- ── Render Jobs ──────────────────────────────
CREATE POLICY "Users can view render jobs of their projects"
    ON public.render_jobs FOR SELECT
    USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert render jobs for their projects"
    ON public.render_jobs FOR INSERT
    WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update render jobs of their projects"
    ON public.render_jobs FOR UPDATE
    USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- ── Asset Library (public read) ──────────────
-- These tables remain publicly readable (no user-specific data)
-- RLS is NOT enabled on: asset_categories, vfx_presets, sfx_clips,
-- broll_clips, music_tracks, asset_tags, asset_tag_map, templates, video_templates
