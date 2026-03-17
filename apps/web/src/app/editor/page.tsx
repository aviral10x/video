'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@video-editor/editor-core';
import { Timeline } from '@/components/editor/Timeline';
import { PreviewWrapper } from '@/components/editor/PreviewWrapper';
import { Play, Pause, Plus, Save, Download, Scissors, SkipBack } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { TextClip, MediaClip } from '@video-editor/timeline-schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_PROJECT_ID = 'editor-proj-1';

function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${m}:${s}:${cs}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditorPage() {
    const {
        setProject, project, isPlaying, setIsPlaying, setPlayhead,
        playheadMs, addClip, updateClip, deleteClip, trimClip, selectedClipId, selectClip,
    } = useEditorStore();

    const lastTimeRef = useRef<number>(0);
    const frameRef = useRef<number>(0);
    // Web Audio API context for audio clip preview
    const audioCtxRef = useRef<AudioContext | null>(null);
    const audioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map());
    const activeAudioSourcesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());

    const [isSaving, setIsSaving] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [isDraggingOver, setIsDraggingOver] = React.useState(false);
    const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [chatInput, setChatInput] = React.useState('');
    const [isChatting, setIsChatting] = React.useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Load project from DB on mount ──────────────────────────────────────
    useEffect(() => {
        if (project) return;

        const load = async () => {
            try {
                const res = await fetch(`/api/project-assets?projectId=${DEFAULT_PROJECT_ID}`);
                if (res.ok) {
                    const { timeline } = await res.json();
                    if (timeline) { setProject(timeline); return; }
                }
            } catch { /* fall through to localStorage */ }

            // Fallback: localStorage
            try {
                const saved = localStorage.getItem('video-editor-project');
                if (saved) { setProject(JSON.parse(saved)); return; }
            } catch {}

            // Seed a blank project
            setProject({
                id: DEFAULT_PROJECT_ID,
                name: 'My Awesome Video',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                settings: { width: 1920, height: 1080, fps: 30, durationMs: 15000, backgroundColor: '#000000' },
                assets: {},
                tracks: [
                    { id: 'track-v1', type: 'video_main', name: 'V1', hidden: false, muted: false, clips: [] },
                    { id: 'track-v2', type: 'video_overlay', name: 'V2', hidden: false, muted: false, clips: [] },
                    { id: 'track-a1', type: 'audio', name: 'A1', hidden: false, muted: false, clips: [] },
                ],
            });
        };

        load();
    }, [project, setProject]);

    // ── Save to DB + localStorage ──────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (!project) return;
        setIsSaving(true);
        setSaveStatus('saving');

        // Always persist to localStorage as backup
        localStorage.setItem('video-editor-project', JSON.stringify(project));

        try {
            const res = await fetch('/api/project-assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: project.id, timeline: project }),
            });
            setSaveStatus(res.ok ? 'saved' : 'error');
        } catch {
            setSaveStatus('saved'); // Saved to localStorage at least
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus('idle'), 2500);
        }
    }, [project]);

    // Auto-save every 30s when dirty
    const lastSavedRef = useRef<string>('');
    useEffect(() => {
        if (!project) return;
        const serialized = JSON.stringify(project);
        if (serialized === lastSavedRef.current) return;
        const timer = setInterval(() => {
            const current = JSON.stringify(useEditorStore.getState().project);
            if (current !== lastSavedRef.current) {
                lastSavedRef.current = current;
                handleSave();
            }
        }, 30000);
        return () => clearInterval(timer);
    }, [project, handleSave]);

    // ── Export via BullMQ ──────────────────────────────────────────────────
    const handleExport = async () => {
        if (!project) return;
        setIsExporting(true);
        try {
            const res = await fetch('/api/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(project),
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ Render queued! Job ID: ${data.jobId}\nYou'll receive the output URL when it's done.`);
            } else {
                alert(`❌ Export failed: ${data.error}`);
            }
        } catch {
            alert('Network error while exporting.');
        } finally {
            setIsExporting(false);
        }
    };

    // ── Add Text clip ──────────────────────────────────────────────────────
    const handleAddText = () => {
        if (!project) return;
        const trackId = project.tracks.find(t => t.type === 'video_overlay')?.id;
        if (!trackId) return;
        const clip: TextClip = {
            id: uuidv4(),
            type: 'text',
            startAtMs: playheadMs,
            durationMs: 3000,
            content: 'New Text',
            transform: { x: project.settings.width / 2, y: project.settings.height / 2, scaleX: 1, scaleY: 1, rotation: 0, anchorX: 0.5, anchorY: 0.5 },
            style: { fontFamily: 'Inter', fontSize: 64, color: '#ffffff', textAlign: 'center', fontWeight: 'bold' },
        };
        addClip(trackId, clip);
    };

    // ── Split selected clip at playhead ────────────────────────────────────
    const handleSplit = () => {
        if (!project || !selectedClipId) return;

        for (const track of project.tracks) {
            const clipIdx = track.clips.findIndex(c => c.id === selectedClipId);
            if (clipIdx === -1) continue;
            const clip = track.clips[clipIdx];

            const splitPointMs = playheadMs;
            if (splitPointMs <= clip.startAtMs || splitPointMs >= clip.startAtMs + clip.durationMs) {
                return; // Playhead not inside clip
            }

            const leftDuration = splitPointMs - clip.startAtMs;
            const rightDuration = clip.durationMs - leftDuration;

            // Trim left half in-place
            trimClip(track.id, clip.id, clip.startAtMs, leftDuration, (clip as any).sourceStartMs ?? 0);

            // Create right half as new clip
            const rightClip = {
                ...(clip as any),
                id: uuidv4(),
                startAtMs: splitPointMs,
                durationMs: rightDuration,
                sourceStartMs: ((clip as any).sourceStartMs ?? 0) + leftDuration,
            };
            addClip(track.id, rightClip);
            selectClip(rightClip.id);
            return;
        }
    };

    // ── Delete selected clip ───────────────────────────────────────────────
    const handleDeleteSelected = () => {
        if (!project || !selectedClipId) return;
        for (const track of project.tracks) {
            const clip = track.clips.find(c => c.id === selectedClipId);
            if (clip) { deleteClip(track.id, selectedClipId); selectClip(null); return; }
        }
    };

    // ── Real asset upload logic ──────────────────────────────────────────────
    const processMediaFiles = async (files: File[]) => {
        if (!project || !files.length) return;

        for (const file of files) {
            const isVideo = file.type.startsWith('video');
            const isAudio = file.type.startsWith('audio');
            const isImage = file.type.startsWith('image');
            if (!isVideo && !isAudio && !isImage) continue;

            setIsUploading(true);
            let assetUrl: string;

            try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
                assetUrl = data.url;
            } catch {
                // Fallback to blob URL for local preview
                assetUrl = URL.createObjectURL(file);
            } finally {
                setIsUploading(false);
            }

            // Default to main video track for videos/images, audio track for audio
            const targetTrackId = isAudio
                ? project.tracks.find(t => t.type === 'audio')?.id
                : project.tracks.find(t => t.type === 'video_main')?.id;
            if (!targetTrackId) continue;

            const assetId = uuidv4();
            const newClip: MediaClip = {
                id: uuidv4(),
                type: isVideo ? 'video' : isImage ? 'image' : 'audio',
                assetId,
                startAtMs: playheadMs,
                durationMs: isImage ? 5000 : 10000,
                sourceStartMs: 0,
                volume: 1,
                // @ts-ignore — runtime src for preview playback
                src: assetUrl,
            };

            // Cache audio buffer for Web Audio API preview
            if (isAudio && file.size < 50 * 1024 * 1024) { // <50MB
                try {
                    const ctx = getAudioContext();
                    const ab = await file.arrayBuffer();
                    const decoded = await ctx.decodeAudioData(ab);
                    audioBuffersRef.current.set(assetId, decoded);
                } catch {}
            }

            addClip(targetTrackId, newClip);
        }
    };

    const handleDropMedia = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        const files = Array.from(e.dataTransfer.files);
        await processMediaFiles(files);
    };

    const handleUploadMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            await processMediaFiles(files);
            // reset input
            e.target.value = '';
        }
    };

    // ── AI Chat Bluma Logic ──────────────────────────────────────────────
    const handleAskBluma = async () => {
        if (!chatInput.trim() || !project) return;
        setIsChatting(true);
        // Simulate AI generating a textual hook clip and placing it on timeline
        setTimeout(() => {
            const trackId = project.tracks.find(t => t.type === 'video_overlay')?.id;
            if (trackId) {
                const clip: TextClip = {
                    id: uuidv4(),
                    type: 'text',
                    startAtMs: playheadMs,
                    durationMs: 4000,
                    content: chatInput,
                    transform: { x: project.settings.width / 2, y: project.settings.height / 2, scaleX: 1, scaleY: 1, rotation: 0, anchorX: 0.5, anchorY: 0.5 },
                    style: { fontFamily: 'Inter', fontSize: 64, color: '#facc15', textAlign: 'center', fontWeight: 'bold' },
                };
                addClip(trackId, clip);
            }
            setChatInput('');
            setIsChatting(false);
        }, 1500);
    };

    // ── Audio context (lazy) ───────────────────────────────────────────────
    const getAudioContext = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new AudioContext();
        }
        return audioCtxRef.current;
    };

    // ── Audio playback sync with playhead ──────────────────────────────────
    useEffect(() => {
        if (!project) return;

        const stopAll = () => {
            activeAudioSourcesRef.current.forEach(src => { try { src.stop(); } catch {} });
            activeAudioSourcesRef.current.clear();
        };

        if (!isPlaying) { stopAll(); return; }

        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        // Find active audio clips at current playhead
        const audioTrack = project.tracks.find(t => t.type === 'audio' && !t.muted);
        if (!audioTrack) return;

        stopAll();

        audioTrack.clips.forEach(clip => {
            if (playheadMs < clip.startAtMs || playheadMs >= clip.startAtMs + clip.durationMs) return;

            const buf = audioBuffersRef.current.get((clip as any).assetId);
            if (!buf) return;

            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.connect(ctx.destination);

            const offsetSec = (playheadMs - clip.startAtMs) / 1000;
            src.start(0, offsetSec);
            activeAudioSourcesRef.current.set(clip.id, src);
        });

        return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying]);

    // ── Playback RAF loop ──────────────────────────────────────────────────
    useEffect(() => {
        if (!isPlaying) {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            return;
        }

        const totalMs = project?.settings.durationMs ?? 30000;
        const loop = (time: number) => {
            if (lastTimeRef.current !== 0) {
                const delta = time - lastTimeRef.current;
                const next = useEditorStore.getState().playheadMs + delta;
                if (next >= totalMs) {
                    setPlayhead(0);
                    setIsPlaying(false);
                    return;
                }
                setPlayhead(next);
            }
            lastTimeRef.current = time;
            frameRef.current = requestAnimationFrame(loop);
        };

        lastTimeRef.current = performance.now();
        frameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameRef.current);
    }, [isPlaying, project, setPlayhead, setIsPlaying]);

    // ── Selected clip info ─────────────────────────────────────────────────
    const selectedClip = React.useMemo(() => {
        if (!project || !selectedClipId) return null;
        for (const track of project.tracks) {
            const clip = track.clips.find(c => c.id === selectedClipId);
            if (clip) return { clip, trackId: track.id };
        }
        return null;
    }, [project, selectedClipId]);

    const togglePlay = () => { lastTimeRef.current = 0; setIsPlaying(!isPlaying); };

    // ── Save status label ──────────────────────────────────────────────────
    const saveLabel = { idle: 'Save', saving: 'Saving…', saved: '✓ Saved', error: '⚠ Retry' }[saveStatus];

    // ── Global Keyboard Shortcuts ──────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            switch (e.key.toLowerCase()) {
                case 'a':
                    useEditorStore.getState().setActiveTool('select');
                    break;
                case 'b':
                    useEditorStore.getState().setActiveTool('blade');
                    break;
                case 'n':
                    useEditorStore.getState().setSnappingEnabled(!useEditorStore.getState().snappingEnabled);
                    break;
                case 'backspace':
                case 'delete':
                    const selected = useEditorStore.getState().selectedClipId;
                    if (selected) {
                        for (const track of useEditorStore.getState().project?.tracks || []) {
                            if (track.clips.find(c => c.id === selected)) {
                                useEditorStore.getState().deleteClip(track.id, selected);
                                useEditorStore.getState().selectClip(null);
                                break;
                            }
                        }
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    togglePlay();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-screen w-full bg-[#0A0A0A] text-[#E0E0E0] select-none font-sans overflow-hidden">
            
            {/* Left AI Sidebar (Bluma Style) */}
            <aside className="w-[300px] shrink-0 border-r border-[#1A1A1A] flex flex-col bg-[#0F0F0F]">
                {/* Tabs */}
                <div className="flex items-center gap-4 px-6 h-14 border-b border-[#1A1A1A]">
                    <button className="flex items-center gap-2 text-xs font-semibold text-[#E0E0E0]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        Chat
                    </button>
                    <button className="flex items-center gap-2 text-xs font-medium text-[#666] hover:text-[#CCC] transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                        Library
                    </button>
                </div>

                {/* Main Prompts Area */}
                <div className="flex-1 flex flex-col justify-center px-6 gap-6">
                    <div>
                        <h2 className="text-[13px] font-semibold text-white mb-1">Start chatting with Bluma</h2>
                        <p className="text-[11px] text-[#666]">Ask for scripts or prompt ideas.</p>
                    </div>
                    <div className="space-y-4">
                        {[
                            "Write a 15-second hook for my product.",
                            "Give me 5 prompt variations for this idea.",
                            "Turn this into a storyboard with scenes."
                        ].map(prompt => (
                            <p 
                                key={prompt}
                                onClick={() => setChatInput(prompt)}
                                className="text-[11px] text-[#888] cursor-pointer hover:text-white transition-colors"
                            >
                                "{prompt}"
                            </p>
                        ))}
                    </div>
                </div>

                {/* Bottom Input Area */}
                <div className="p-4">
                    <div className="flex flex-col gap-3 rounded-xl border border-[#2A2A2A] bg-[#141414] p-3">
                        <textarea 
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAskBluma();
                                }
                            }}
                            disabled={isChatting}
                            placeholder={isChatting ? "Generating..." : "Ask Bluma anything..."}
                            className="bg-transparent text-xs text-white resize-none outline-none placeholder-[#555] h-10 disabled:opacity-50"
                        />
                        <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                                <button onClick={handleAskBluma} disabled={isChatting || !chatInput.trim()} className="flex items-center gap-1 px-2 py-1 rounded bg-[#222] text-[10px] text-[#AAA] hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> 
                                    Ask
                                </button>
                                <button className="flex items-center gap-1 px-2 py-1 rounded bg-[#222] text-[10px] text-[#AAA] hover:bg-[#333] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg> Style</button>
                            </div>
                            <button className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2A2A2A] text-[#888] hover:text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 relative overflow-hidden bg-[#0A0A0A]">
                
                {/* Top Navbar */}
                <header className="h-[56px] flex items-center justify-between px-6 border-b border-[#1A1A1A]">
                    {/* Left spacing */}
                    <div className="flex gap-4">
                         <input 
                             type="file" 
                             ref={fileInputRef} 
                             onChange={handleUploadMedia} 
                             accept="video/*,audio/*,image/*" 
                             multiple 
                             className="hidden" 
                         />
                         <button 
                             className="text-xs text-[#888] hover:text-white transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                             onClick={() => fileInputRef.current?.click()}
                             disabled={isUploading}
                         >
                             {isUploading ? (
                                 <><div className="h-3 w-3 rounded-full border border-[#888] border-t-transparent animate-spin" /> Uploading...</>
                             ) : (
                                 <><Plus size={14}/> Add Media</>
                             )}
                         </button>
                    </div>

                    {/* Center Tools Group */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#141414] border border-[#222] rounded-lg p-1.5 shadow-xl shadow-black/50">
                        {/* Select */}
                        <button
                            onClick={() => useEditorStore.getState().setActiveTool('select')}
                            title="Pointer (A)"
                            className={`flex items-center justify-center w-7 h-7 rounded transition-all ${
                                useEditorStore.getState().activeTool === 'select' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-[#666] hover:text-[#CCC]'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
                        </button>
                        
                        <div className="w-px h-4 bg-[#333]" />

                        {/* Formatting (Text) */}
                        <button 
                            onClick={handleAddText}
                            title="Add Text"
                            className="flex items-center justify-center w-7 h-7 rounded text-[#666] hover:bg-[#2A2A2A] hover:text-[#CCC] transition-all"
                        >
                            <span className="font-serif italic font-bold text-[13px]">T</span>
                        </button>
                        
                        <div className="w-px h-4 bg-[#333]" />

                        {/* Blade */}
                        <button
                            onClick={() => useEditorStore.getState().setActiveTool('blade')}
                            title="Blade Mode (B)"
                            className={`flex items-center justify-center w-7 h-7 rounded transition-all ${
                                useEditorStore.getState().activeTool === 'blade' ? 'bg-[#2A2A2A] text-white shadow-sm' : 'text-[#666] hover:text-[#CCC]'
                            }`}
                        >
                            <Scissors size={13} />
                        </button>
                        
                        <div className="w-px h-4 bg-[#333]" />

                        {/* Snapping */}
                        <button
                            onClick={() => useEditorStore.getState().setSnappingEnabled(!useEditorStore.getState().snappingEnabled)}
                            title="Snap to Grid (N)"
                            className={`flex items-center justify-center w-7 h-7 rounded transition-all ${
                                useEditorStore.getState().snappingEnabled ? 'text-white' : 'text-[#666] hover:text-[#CCC]'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 2 2 8-6 4 1-6-4 4"/><path d="m16 22-2-8 6-4-1 6 4-4"/></svg>
                        </button>
                    </div>

                    {/* Right: Export */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`text-[11px] font-medium transition-colors disabled:opacity-50 ${
                                saveStatus === 'saved' ? 'text-green-400' :
                                saveStatus === 'error' ? 'text-red-400' :
                                'text-[#888] hover:text-white'
                            }`}
                        >
                            {saveLabel}
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold text-black hover:bg-[#E0E0E0] transition-colors disabled:opacity-50"
                        >
                            {isExporting ? 'Packaging...' : 'Export'}
                        </button>
                    </div>
                </header>

                {/* Center Canvas */}
                <main 
                    onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
                    onDragLeave={() => setIsDraggingOver(false)}
                    onDrop={handleDropMedia}
                    className="flex-1 flex flex-col relative items-center justify-center p-8 bg-[#0A0A0A]"
                >
                    <div className={`relative aspect-video w-full max-w-4xl rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden ring-1 transition-colors ${isDraggingOver ? 'ring-indigo-500 ring-offset-2 ring-offset-[#0A0A0A]' : 'ring-[#1A1A1A]'} bg-black`}>
                        <PreviewWrapper />
                        {isDraggingOver && (
                             <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-500/20 backdrop-blur-sm">
                                  <p className="text-white font-medium text-sm">Drop Media Here</p>
                             </div>
                        )}
                    </div>
                </main>

                {/* Properties Panel (Floating, clean) */}
                {selectedClip && (
                    <aside className="absolute right-6 top-[80px] w-[260px] bg-[#141414]/90 backdrop-blur-md border border-[#222] rounded-xl shadow-2xl p-4 z-40 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-[11px] font-semibold text-white">Properties</h2>
                            <button onClick={() => selectClip(null)} className="text-[#666] hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                        </div>
                        
                        <div className="space-y-4">
                            {/* Timing */}
                            <div className="space-y-2 pb-3 border-b border-[#222]">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'Start (ms)', value: selectedClip.clip.startAtMs, key: 'startAtMs' },
                                        { label: 'Duration (ms)', value: selectedClip.clip.durationMs, key: 'durationMs' },
                                    ].map(({ label, value, key }) => (
                                        <div key={key} className="space-y-1">
                                            <label className="text-[9px] text-[#666]">{label}</label>
                                            <input
                                                type="number"
                                                value={value}
                                                onChange={e => updateClip(selectedClip.trackId, selectedClip.clip.id, { [key]: Number(e.target.value) } as any)}
                                                className="w-full rounded bg-[#1A1A1A] px-2 py-1.5 text-[10px] text-[#CCC] border border-[#222] hover:border-[#444] focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Transform & Details matching previous logic */}
                            {selectedClip.clip.type !== 'audio' && (
                                <div className="space-y-2 pb-3 border-b border-[#222]">
                                    <h3 className="text-[9px] font-semibold uppercase tracking-wider text-[#555]">Transform</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { label: 'Scale X', key: 'scaleX', val: selectedClip.clip.transform?.scaleX ?? 1, step: 0.01 },
                                            { label: 'Scale Y', key: 'scaleY', val: selectedClip.clip.transform?.scaleY ?? 1, step: 0.01 },
                                            { label: 'X', key: 'x', val: selectedClip.clip.transform?.x ?? 0 },
                                            { label: 'Y', key: 'y', val: selectedClip.clip.transform?.y ?? 0 },
                                        ].map(({ label, key, val, step }) => (
                                            <div key={key} className="space-y-1">
                                                <label className="text-[9px] text-[#666]">{label}</label>
                                                <input
                                                    type="number" step={step ?? 1} value={val}
                                                    onChange={e => updateClip(selectedClip.trackId, selectedClip.clip.id, { transform: { ...selectedClip.clip.transform, [key]: Number(e.target.value) } as any })}
                                                    className="w-full rounded bg-[#1A1A1A] px-2 py-1.5 text-[10px] text-[#CCC] border border-[#222] hover:border-[#444] focus:outline-none focus:border-indigo-500 transition-colors"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedClip.clip.type === 'text' && (
                                <div className="space-y-3 pb-3 border-b border-[#222]">
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-[#666]">Content</label>
                                        <textarea
                                            value={(selectedClip.clip as any).content}
                                            onChange={e => updateClip(selectedClip.trackId, selectedClip.clip.id, { content: e.target.value } as any)}
                                            className="w-full rounded bg-[#1A1A1A] px-2 py-1.5 text-[10px] text-[#CCC] border border-[#222] hover:border-[#444] focus:outline-none focus:border-indigo-500 transition-colors min-h-[50px] resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-[#666]">Size</label>
                                            <input
                                                type="number" value={(selectedClip.clip as any).style?.fontSize ?? 48}
                                                onChange={e => updateClip(selectedClip.trackId, selectedClip.clip.id, { style: { ...(selectedClip.clip as any).style, fontSize: Number(e.target.value) } } as any)}
                                                className="w-full rounded bg-[#1A1A1A] px-2 py-1.5 text-[10px] text-[#CCC] border border-[#222] hover:border-[#444] focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            <button
                                onClick={handleDeleteSelected}
                                className="w-full rounded-md py-1.5 text-[10px] text-red-400 border border-red-900/30 hover:bg-red-900/10 transition-colors font-medium mt-2"
                            >
                                Delete Clip
                            </button>
                        </div>
                    </aside>
                )}

                {/* Central Playback Controls Bar (Directly above timeline) */}
                <div className="h-[40px] shrink-0 border-t border-[#1A1A1A] bg-[#0A0A0A] flex items-center justify-center relative">
                    {/* Timecode */}
                    <span className="absolute left-6 text-[10px] font-mono font-medium text-[#666]">
                        {formatTime(playheadMs)} / {project ? formatTime(project.settings.durationMs) : '00:00:00'}
                    </span>
                    
                    {/* Controls */}
                    <div className="flex items-center gap-6">
                        <button className="text-[#666] hover:text-white transition-colors" onClick={() => { setPlayhead(0); lastTimeRef.current = 0; }}>
                            <SkipBack size={12} />
                        </button>
                        <button className="text-[#E0E0E0] hover:text-white transition-colors drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" onClick={togglePlay}>
                            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        </button>
                        <button className="text-[#666] hover:text-white transition-colors" onClick={handleSplit}>
                            <Scissors size={12} />
                        </button>
                    </div>
                </div>

                {/* Bottom Timeline */}
                <footer className="h-[280px] shrink-0 border-t border-[#1A1A1A] bg-[#0A0A0A] flex flex-col relative">
                    <Timeline />
                </footer>
            </div>
        </div>
    );
}
