-- ============================================================
-- Asset Library Seed Data
-- Run this in Supabase SQL Editor after the initial schema migration.
-- ============================================================

-- Categories
INSERT INTO public.asset_categories (slug, name, asset_type, sort_order) VALUES
    ('transitions',      'Transitions',       'vfx',   1),
    ('text-effects',     'Text Effects',      'vfx',   2),
    ('overlays',         'Overlays',          'vfx',   3),
    ('filters',          'Filters',           'vfx',   4),
    ('whoosh-swoosh',    'Whoosh & Swoosh',   'sfx',   1),
    ('ui-sounds',        'UI Sounds',         'sfx',   2),
    ('impacts',          'Impacts',           'sfx',   3),
    ('cinematic',        'Cinematic',         'broll', 1),
    ('nature',           'Nature',            'broll', 2),
    ('tech',             'Tech & Screens',    'broll', 3),
    ('lo-fi',            'Lo-fi & Chill',     'music', 1),
    ('energetic',        'Energetic',         'music', 2),
    ('corporate',        'Corporate',         'music', 3)
ON CONFLICT (slug) DO NOTHING;

-- VFX Presets
INSERT INTO public.vfx_presets (slug, name, description, vfx_type, config, sort_order,
    category_id) VALUES
    ('zoom-punch', 'Zoom Punch', 'Quick zoom-in punch effect for emphasis', 'zoom',
     '{"scale": 1.4, "durationMs": 300, "easing": "spring"}', 1,
     (SELECT id FROM public.asset_categories WHERE slug = 'transitions')),
    ('glitch-transition', 'Glitch Transition', 'RGB-split glitch effect between clips', 'transition',
     '{"intensity": 0.8, "durationMs": 400, "type": "rgb-split"}', 2,
     (SELECT id FROM public.asset_categories WHERE slug = 'transitions')),
    ('flash-white', 'Flash White', 'Quick white flash for hard cuts', 'transition',
     '{"color": "#FFFFFF", "durationMs": 150, "opacity": 0.9}', 3,
     (SELECT id FROM public.asset_categories WHERE slug = 'transitions')),
    ('neon-glow', 'Neon Glow', 'Neon glow text effect for emphasis words', 'text_effect',
     '{"color": "#00FF88", "blur": 20, "intensity": 1.0}', 4,
     (SELECT id FROM public.asset_categories WHERE slug = 'text-effects')),
    ('shake', 'Camera Shake', 'Subtle camera shake for energy', 'overlay',
     '{"amplitude": 5, "frequency": 15, "durationMs": 500}', 5,
     (SELECT id FROM public.asset_categories WHERE slug = 'overlays')),
    ('vignette-dark', 'Dark Vignette', 'Cinematic dark vignette overlay', 'filter',
     '{"intensity": 0.6, "radius": 0.7, "color": "#000000"}', 6,
     (SELECT id FROM public.asset_categories WHERE slug = 'filters'))
ON CONFLICT (slug) DO NOTHING;

-- SFX Clips (using placeholder URLs — replace with real files in Storage)
INSERT INTO public.sfx_clips (slug, name, description, sfx_type, file_url, duration_ms, sort_order,
    category_id) VALUES
    ('whoosh-fast', 'Fast Whoosh', 'Quick airy whoosh for transitions', 'whoosh',
     '/sfx/whoosh-fast.mp3', 400, 1,
     (SELECT id FROM public.asset_categories WHERE slug = 'whoosh-swoosh')),
    ('whoosh-heavy', 'Heavy Whoosh', 'Deep bass whoosh for dramatic cuts', 'whoosh',
     '/sfx/whoosh-heavy.mp3', 600, 2,
     (SELECT id FROM public.asset_categories WHERE slug = 'whoosh-swoosh')),
    ('pop-bubble', 'Bubble Pop', 'Light pop sound for UI elements', 'pop',
     '/sfx/pop-bubble.mp3', 200, 3,
     (SELECT id FROM public.asset_categories WHERE slug = 'ui-sounds')),
    ('click-soft', 'Soft Click', 'Minimal click for subtle moments', 'click',
     '/sfx/click-soft.mp3', 150, 4,
     (SELECT id FROM public.asset_categories WHERE slug = 'ui-sounds')),
    ('ding-notification', 'Notification Ding', 'Bright ding for highlights', 'ding',
     '/sfx/ding-notification.mp3', 500, 5,
     (SELECT id FROM public.asset_categories WHERE slug = 'ui-sounds')),
    ('impact-bass', 'Bass Impact', 'Deep bass hit for emphasis', 'impact',
     '/sfx/impact-bass.mp3', 800, 6,
     (SELECT id FROM public.asset_categories WHERE slug = 'impacts'))
ON CONFLICT (slug) DO NOTHING;

-- B-roll Clips (placeholder URLs)
INSERT INTO public.broll_clips (slug, name, description, file_url, thumbnail_url,
    duration_ms, keywords, sort_order, category_id) VALUES
    ('city-timelapse', 'City Timelapse', 'Fast-motion city skyline at dusk',
     '/broll/city-timelapse.mp4', '/broll/thumb-city.jpg', 8000,
     ARRAY['city', 'skyline', 'timelapse', 'urban'], 1,
     (SELECT id FROM public.asset_categories WHERE slug = 'cinematic')),
    ('typing-laptop', 'Typing on Laptop', 'Close-up hands typing on a MacBook',
     '/broll/typing-laptop.mp4', '/broll/thumb-typing.jpg', 6000,
     ARRAY['tech', 'laptop', 'typing', 'work'], 2,
     (SELECT id FROM public.asset_categories WHERE slug = 'tech')),
    ('ocean-waves', 'Ocean Waves', 'Calming ocean waves crashing on shore',
     '/broll/ocean-waves.mp4', '/broll/thumb-ocean.jpg', 10000,
     ARRAY['nature', 'ocean', 'waves', 'calm'], 3,
     (SELECT id FROM public.asset_categories WHERE slug = 'nature')),
    ('code-scrolling', 'Code Scrolling', 'Screen recording of code scrolling in VS Code',
     '/broll/code-scrolling.mp4', '/broll/thumb-code.jpg', 7000,
     ARRAY['tech', 'coding', 'programming', 'screen'], 4,
     (SELECT id FROM public.asset_categories WHERE slug = 'tech')),
    ('coffee-pour', 'Coffee Pour', 'Aesthetic slow-mo coffee being poured',
     '/broll/coffee-pour.mp4', '/broll/thumb-coffee.jpg', 5000,
     ARRAY['lifestyle', 'coffee', 'aesthetic', 'slowmo'], 5,
     (SELECT id FROM public.asset_categories WHERE slug = 'cinematic'))
ON CONFLICT (slug) DO NOTHING;

-- Music Tracks (placeholder URLs)
INSERT INTO public.music_tracks (slug, name, artist, description, file_url,
    duration_ms, bpm, mood, genre, sort_order, category_id) VALUES
    ('chill-lofi-beat', 'Chill Lo-fi Beat', 'Producer X', 'Relaxed lo-fi beat with soft piano',
     '/music/chill-lofi-beat.mp3', 120000, 85, 'chill', 'lo-fi', 1,
     (SELECT id FROM public.asset_categories WHERE slug = 'lo-fi')),
    ('upbeat-energy', 'Upbeat Energy', 'Beat Maker', 'High-energy track for hype content',
     '/music/upbeat-energy.mp3', 90000, 128, 'energetic', 'electronic', 2,
     (SELECT id FROM public.asset_categories WHERE slug = 'energetic')),
    ('corporate-inspire', 'Corporate Inspire', 'Studio Sound', 'Professional inspiring background music',
     '/music/corporate-inspire.mp3', 150000, 100, 'inspiring', 'corporate', 3,
     (SELECT id FROM public.asset_categories WHERE slug = 'corporate')),
    ('dark-trap', 'Dark Trap', 'Night Beats', 'Dark moody trap beat',
     '/music/dark-trap.mp3', 110000, 140, 'dark', 'trap', 4,
     (SELECT id FROM public.asset_categories WHERE slug = 'energetic')),
    ('playful-bounce', 'Playful Bounce', 'Happy Tunes', 'Fun bouncy track for casual content',
     '/music/playful-bounce.mp3', 100000, 110, 'playful', 'pop', 5,
     (SELECT id FROM public.asset_categories WHERE slug = 'lo-fi')),
    ('cinematic-epic', 'Cinematic Epic', 'Orchestra Studio', 'Epic orchestral build-up',
     '/music/cinematic-epic.mp3', 180000, 90, 'dramatic', 'orchestral', 6,
     (SELECT id FROM public.asset_categories WHERE slug = 'corporate'))
ON CONFLICT (slug) DO NOTHING;
