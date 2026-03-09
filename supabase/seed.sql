-- ============================================================
-- Video Editor — Seed Data
-- Run this AFTER the migration
-- ============================================================

-- ── Asset Categories ────────────────────────────────────────
insert into public.asset_categories (slug, name, asset_type, sort_order) values
  ('overlays',     'Overlays',     'vfx',   1),
  ('transitions',  'Transitions',  'vfx',   2),
  ('filters',      'Filters',      'vfx',   3),
  ('zoom-styles',  'Zoom Styles',  'vfx',   4),
  ('lower-thirds', 'Lower Thirds', 'vfx',   5),
  ('text-effects', 'Text Effects', 'vfx',   6),
  ('whoosh',       'Whoosh',       'sfx',   1),
  ('pop-ding',     'Pop & Ding',   'sfx',   2),
  ('transitions-sfx','Transitions','sfx',   3),
  ('ambient',      'Ambient',      'sfx',   4),
  ('tech',         'Tech',         'broll', 1),
  ('nature',       'Nature',       'broll', 2),
  ('lifestyle',    'Lifestyle',    'broll', 3),
  ('abstract',     'Abstract',     'broll', 4),
  ('lo-fi',        'Lo-fi',        'music', 1),
  ('upbeat',       'Upbeat',       'music', 2),
  ('corporate',    'Corporate',    'music', 3),
  ('cinematic',    'Cinematic',    'music', 4);

-- ── Templates (editing styles) ──────────────────────────────
insert into public.templates (slug, name, description, accent_color, hook_config, caption_config, zoom_config, cta_config, sort_order) values
(
  'clean-creator',
  'Clean Creator',
  'Minimal, modern look. Soft captions with a gentle fade-in hook and a clean CTA slide.',
  '#6366F1',
  '{"durationSec":2,"background":"#0F172A","textColor":"#F8FAFC","fontSize":64}',
  '{"fontFamily":"Inter","fontSize":42,"color":"#FFFFFF","backgroundColor":"rgba(0,0,0,0.5)","highlightColor":"#6366F1","position":"bottom"}',
  '{"scale":1.15,"durationSec":0.6,"easing":"ease-in-out"}',
  '{"durationSec":2,"background":"#6366F1","textColor":"#FFFFFF","fontSize":48,"buttonText":"Follow for more"}',
  1
),
(
  'viral-punch',
  'Viral Punch',
  'High-energy style. Bold captions, fast zooms, and punchy colour accents for maximum engagement.',
  '#F43F5E',
  '{"durationSec":2,"background":"#18181B","textColor":"#FDE68A","fontSize":72}',
  '{"fontFamily":"Inter","fontSize":48,"color":"#FFFFFF","backgroundColor":"rgba(0,0,0,0.7)","highlightColor":"#F43F5E","position":"bottom"}',
  '{"scale":1.3,"durationSec":0.35,"easing":"spring"}',
  '{"durationSec":2,"background":"#F43F5E","textColor":"#FFFFFF","fontSize":52,"buttonText":"Subscribe now!"}',
  2
),
(
  'branded-explainer',
  'Branded Explainer',
  'Professional polish. Centred captions, subtle zooms, and a branded end card with your accent colour.',
  '#0EA5E9',
  '{"durationSec":2,"background":"#020617","textColor":"#E0F2FE","fontSize":60}',
  '{"fontFamily":"Inter","fontSize":40,"color":"#F0F9FF","backgroundColor":"rgba(2,6,23,0.65)","highlightColor":"#0EA5E9","position":"center"}',
  '{"scale":1.1,"durationSec":0.8,"easing":"ease-in-out"}',
  '{"durationSec":2,"background":"#0EA5E9","textColor":"#FFFFFF","fontSize":46,"buttonText":"Learn more"}',
  3
);

-- ── Tags ────────────────────────────────────────────────────
insert into public.asset_tags (slug, name) values
  ('trending',    'Trending'),
  ('new',         'New'),
  ('popular',     'Popular'),
  ('minimal',     'Minimal'),
  ('bold',        'Bold'),
  ('energetic',   'Energetic'),
  ('professional','Professional'),
  ('fun',         'Fun'),
  ('dark',        'Dark'),
  ('bright',      'Bright'),
  ('retro',       'Retro'),
  ('modern',      'Modern'),
  ('cinematic',   'Cinematic'),
  ('social',      'Social Media'),
  ('podcast',     'Podcast'),
  ('tutorial',    'Tutorial');

-- ── Sample VFX Presets ──────────────────────────────────────
insert into public.vfx_presets (slug, name, description, vfx_type, config, sort_order) values
  ('zoom-punch',       'Punch Zoom',         'Quick punch-in zoom for emphasis',           'zoom',        '{"scale":1.3,"durationSec":0.35,"easing":"spring"}', 1),
  ('zoom-smooth',      'Smooth Zoom',        'Gentle zoom for professional feel',          'zoom',        '{"scale":1.15,"durationSec":0.8,"easing":"ease-in-out"}', 2),
  ('zoom-dramatic',    'Dramatic Zoom',       'Slow cinematic zoom',                        'zoom',        '{"scale":1.5,"durationSec":1.2,"easing":"ease-in-out"}', 3),
  ('flash-transition', 'Flash Cut',           'White flash between scenes',                 'transition',  '{"type":"flash","color":"#FFFFFF","durationMs":200}', 1),
  ('glitch-overlay',   'Glitch Effect',       'Digital glitch distortion overlay',           'overlay',     '{"intensity":0.7,"durationMs":500}', 1),
  ('film-grain',       'Film Grain',          'Vintage film grain texture',                  'filter',      '{"opacity":0.3,"grain":"fine"}', 1),
  ('lower-name',       'Name Lower Third',    'Animated name plate at bottom',              'lower_third', '{"position":"bottom-left","animateIn":"slide"}', 1),
  ('kinetic-text',     'Kinetic Typography',  'Animated text that follows speech rhythm',   'text_effect', '{"style":"bounce","intensity":0.5}', 1);

-- ── Sample SFX Clips ────────────────────────────────────────
insert into public.sfx_clips (slug, name, description, sfx_type, file_url, duration_ms, sort_order) values
  ('whoosh-fast',    'Fast Whoosh',       'Quick swoosh for transitions',  'whoosh',      '/sfx/whoosh-fast.mp3',    300, 1),
  ('whoosh-slow',    'Slow Whoosh',       'Smooth swoosh for slides',      'whoosh',      '/sfx/whoosh-slow.mp3',    600, 2),
  ('pop-bright',     'Bright Pop',        'Poppy sound for highlights',    'pop',         '/sfx/pop-bright.mp3',     200, 1),
  ('ding-notify',    'Notification Ding', 'Bell ding for callouts',        'ding',        '/sfx/ding-notify.mp3',    400, 1),
  ('click-soft',     'Soft Click',        'Subtle click for UI moments',   'click',       '/sfx/click-soft.mp3',     150, 1),
  ('impact-bass',    'Bass Impact',       'Deep bass hit for emphasis',    'impact',      '/sfx/impact-bass.mp3',    500, 1),
  ('rise-tension',   'Tension Rise',      'Building tension riser',        'rise',        '/sfx/rise-tension.mp3',   2000, 1),
  ('transition-swipe','Swipe Transition', 'Clean swipe transition sound',  'transition',  '/sfx/transition-swipe.mp3',350, 1);

-- ── Sample B-Roll Clips ─────────────────────────────────────
insert into public.broll_clips (slug, name, description, file_url, thumbnail_url, duration_ms, keywords, sort_order) values
  ('typing-laptop',   'Typing on Laptop',    'Person typing on a MacBook',           '/broll/typing-laptop.mp4',   '/thumbnails/typing-laptop.jpg',   5000, '{tech,work,laptop}',     1),
  ('city-timelapse',  'City Timelapse',       'Downtown skyline day to night',        '/broll/city-timelapse.mp4',  '/thumbnails/city-timelapse.jpg',  8000, '{city,urban,timelapse}',  2),
  ('coffee-pour',     'Coffee Pour',          'Artisan coffee pour close-up',         '/broll/coffee-pour.mp4',     '/thumbnails/coffee-pour.jpg',     4000, '{lifestyle,coffee}',      3),
  ('abstract-lines',  'Abstract Lines',       'Flowing neon lines on dark bg',        '/broll/abstract-lines.mp4',  '/thumbnails/abstract-lines.jpg',  6000, '{abstract,neon,dark}',    4),
  ('nature-aerial',   'Nature Aerial',        'Drone shot over green landscape',      '/broll/nature-aerial.mp4',   '/thumbnails/nature-aerial.jpg',   7000, '{nature,aerial,drone}',   5),
  ('phone-scroll',    'Phone Scrolling',      'Hand scrolling through social feed',   '/broll/phone-scroll.mp4',    '/thumbnails/phone-scroll.jpg',    4000, '{tech,social,phone}',     6);

-- ── Sample Music Tracks ─────────────────────────────────────
insert into public.music_tracks (slug, name, artist, file_url, duration_ms, bpm, mood, genre, sort_order) values
  ('chill-lofi-beat',  'Chill Lo-fi Beat',      'Studio Vibes',  '/music/chill-lofi.mp3',    120000, 85,  'chill',      'lo-fi',        1),
  ('upbeat-energy',    'Upbeat Energy',          'Beat Factory',  '/music/upbeat-energy.mp3', 90000,  128, 'energetic',  'electronic',   2),
  ('corporate-inspire','Corporate Inspiration',  'Media Sound',   '/music/corporate.mp3',     150000, 100, 'corporate',  'corporate',    3),
  ('cinematic-epic',   'Cinematic Epic',         'Score Works',   '/music/cinematic.mp3',     180000, 90,  'dramatic',   'orchestral',   4),
  ('playful-fun',      'Playful & Fun',          'Happy Tunes',   '/music/playful.mp3',       100000, 120, 'playful',    'pop',          5),
  ('dark-trap',        'Dark Trap Beat',         'Night Beats',   '/music/dark-trap.mp3',     110000, 140, 'dark',       'hip-hop/trap', 6);
