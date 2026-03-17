-- ============================================================
-- Video Editor — Migration 002
-- Adds project_timeline table for saving the universal
-- Timeline JSON per-project, and creates required storage buckets.
-- Run this in Supabase SQL Editor AFTER 001_initial_schema.sql
-- ============================================================

-- 1. Project Timeline JSON storage
create table if not exists public.project_timeline (
  project_id   text primary key,          -- matches Project.id (string, not FK to projects)
  timeline_json jsonb not null,
  updated_at   timestamptz not null default now()
);

alter table public.project_timeline enable row level security;
create policy "Allow all for now" on public.project_timeline
  for all using (true) with check (true);

-- 2. Storage buckets
-- Run via Supabase Dashboard → Storage, or uncomment below if using service role:
-- insert into storage.buckets (id, name, public) values ('assets', 'assets', true) on conflict do nothing;
-- insert into storage.buckets (id, name, public) values ('renders', 'renders', true) on conflict do nothing;
-- Storage policies (open for MVP — tighten in production)
-- create policy "Allow all uploads" on storage.objects for insert with check (bucket_id in ('assets', 'renders'));
-- create policy "Allow all reads" on storage.objects for select using (bucket_id in ('assets', 'renders'));
