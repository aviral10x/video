'use client';

import React, { useEffect, useRef } from 'react';
import { useEditorStore } from '@video-editor/editor-core';
import { Timeline } from '@/components/editor/Timeline';
import { PreviewWrapper } from '@/components/editor/PreviewWrapper';
import { Play, Pause, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { TextClip, MediaClip } from '@video-editor/timeline-schema';

export default function EditorPage() {
  const { setProject, project, isPlaying, setIsPlaying, setPlayhead, playheadMs, addClip, updateClip, selectedClipId } = useEditorStore();
  const lastTimeRef = useRef<number>(0);
  const frameRef = useRef<number>(0);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);

  const handleExport = async () => {
    if (!project) return;
    setIsExporting(true);
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });
      const data = await res.json();
      if (data.success) {
         alert(`Render Job Queued! Job ID: ${data.jobId}`);
      } else {
         alert(`Export Failed: ${data.error}`);
      }
    } catch (err) {
      alert('Network error while exporting.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = () => {
     if (!project) return;
     setIsSaving(true);
     // Mock DB Save by stashing the Zod JSON to LocalStorage
     localStorage.setItem('video-editor-project', JSON.stringify(project));
     setTimeout(() => {
        setIsSaving(false);
        alert('Project Saved to LocalStorage!');
     }, 500);
  };

  const handleAddText = () => {
    if (!project) return;
    const textTrackId = project.tracks.find(t => t.type === 'video_overlay' || t.name === 'V2')?.id;
    if (!textTrackId) return;

    const newTextClip: TextClip = {
      id: uuidv4(),
      type: 'text',
      startAtMs: playheadMs,
      durationMs: 3000,
      content: 'Double Click to Edit',
      transform: { x: project.settings.width / 2, y: project.settings.height / 2, scaleX: 1, scaleY: 1, rotation: 0, anchorX: 0.5, anchorY: 0.5 },
      style: { fontFamily: 'Inter', fontSize: 64, color: '#ffffff', textAlign: 'center', fontWeight: 'bold' } 
    };

    addClip(textTrackId, newTextClip);
  };

  const handleDropMedia = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    if (!project) return;
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    // For MVP, we just take the first file, mock an asset, and add a clip to V1
    const file = files[0];
    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    const isAudio = file.type.startsWith('audio');

    if (!isVideo && !isImage && !isAudio) {
       alert('Unsupported file type');
       return;
    }

    const mockAssetUrl = URL.createObjectURL(file); // Temporary browser URL for Preview
    const targetTrackId = isAudio 
       ? project.tracks.find(t => t.type === 'audio')?.id 
       : project.tracks.find(t => t.type === 'video_main' || t.name === 'V1')?.id;

    if (!targetTrackId) return;

    const newMediaClip: MediaClip = {
       id: uuidv4(),
       type: isVideo ? 'video' : isImage ? 'image' : 'audio',
       assetId: uuidv4(),
       startAtMs: playheadMs,
       durationMs: 5000, // Default 5s
       sourceStartMs: 0,
       volume: 1,
       // @ts-ignore - runtime injection for MVP preview
       src: mockAssetUrl 
    };

    addClip(targetTrackId, newMediaClip);
  };

  const selectedClip = React.useMemo(() => {
     if (!project || !selectedClipId) return null;
     for (const track of project.tracks) {
        const clip = track.clips.find(c => c.id === selectedClipId);
        if (clip) return { clip, trackId: track.id };
     }
     return null;
  }, [project, selectedClipId]);

  useEffect(() => {
    // Inject mock project data on mount for testing MVP
    if (!project) {
       // Attempt to load from storage first
       const saved = localStorage.getItem('video-editor-project');
       if (saved) {
          try {
             setProject(JSON.parse(saved));
             return;
          } catch(e) {}
       }
       setProject({
          id: 'test-proj-1',
          name: 'My Awesome Video',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          settings: { width: 1920, height: 1080, fps: 30, durationMs: 15000, backgroundColor: '#000000' },
          assets: {},
          tracks: [
             {
                id: 'track-v1',
                type: 'video_main',
                name: 'V1',
                hidden: false,
                muted: false,
                clips: [
                   { id: 'clip-1', type: 'video', assetId: 'mock-abc', startAtMs: 1000, durationMs: 5000, sourceStartMs: 0, volume: 1 }
                ]
             },
             {
                id: 'track-v2',
                type: 'video_overlay',
                name: 'V2',
                hidden: false,
                muted: false,
                clips: [
                   { id: 'clip-3', type: 'text', startAtMs: 2000, durationMs: 2000, 
                     content: 'Subscribe!', transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, anchorX: 0.5, anchorY: 0.5 },
                     style: { fontFamily: 'Inter', fontSize: 48, color: '#ffffff', textAlign: 'center', fontWeight: 'bold' } 
                   }
                ]
             },
             {
                id: 'track-a1',
                type: 'audio',
                name: 'A1',
                hidden: false,
                muted: false,
                clips: [
                   { id: 'clip-2', type: 'audio', assetId: 'mock-xyz', startAtMs: 0, durationMs: 15000, sourceStartMs: 0, volume: 0.5 }
                ]
             }
          ]
       });
    }
  }, [project, setProject]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const loop = (time: number) => {
      if (lastTimeRef.current !== 0) {
        const delta = time - lastTimeRef.current;
        setPlayhead(useEditorStore.getState().playheadMs + delta);
      }
      lastTimeRef.current = time;
      frameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(frameRef.current);
  }, [isPlaying, setPlayhead]);

  const togglePlay = () => {
     lastTimeRef.current = 0;
     setIsPlaying(!isPlaying);
  };

  const formatTime = (ms: number) => {
     const totalSeconds = Math.floor(ms / 1000);
     const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
     const s = (totalSeconds % 60).toString().padStart(2, '0');
     const msFormatted = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
     return `${m}:${s}:${msFormatted}`;
  };

  return (
    <div className="flex h-screen w-full flex-col bg-stone-950 text-slate-200">
      {/* Top Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-800 bg-stone-900/50 px-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-indigo-500" />
          <h1 className="text-sm font-semibold tracking-wide text-stone-100">Hybrid Editor</h1>
        </div>
        <div className="flex gap-2">
          <button 
             onClick={handleSave}
             disabled={isSaving}
             className="rounded px-3 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button 
             onClick={handleExport}
             disabled={isExporting}
             className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Assets/Tools) */}
        <aside className="flex w-16 shrink-0 flex-col items-center border-r border-stone-800 bg-stone-900/30 py-4 gap-4">
            {['Media', 'Audio', 'Text', 'Transitions', 'Filters'].map((item) => (
              <button 
                key={item} 
                onClick={item === 'Text' ? handleAddText : undefined}
                className="flex h-12 w-12 flex-col items-center justify-center rounded-lg hover:bg-stone-800/80 text-stone-400 hover:text-stone-200 transition-all"
              >
                  <div className="h-5 w-5 mb-1 rounded bg-stone-700/50 flex items-center justify-center">
                     {item === 'Text' && <Plus size={12} />}
                  </div>
                  <span className="text-[9px] font-medium">{item}</span>
              </button>
            ))}
        </aside>

        {/* Left Panel (Tool Options / Asset Library) */}
        <section className="w-64 shrink-0 border-r border-stone-800 bg-stone-900/30 p-4">
          <h2 className="text-sm font-semibold text-stone-200 mb-4">Project Assets</h2>
          <div 
             onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
             onDragLeave={() => setIsDraggingOver(false)}
             onDrop={handleDropMedia}
             className={`flex h-48 items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
                isDraggingOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-stone-800 bg-stone-900/50'
             }`}
          >
             <p className="text-xs text-stone-500 text-center px-4">
                Drag & Drop <br/>Video, Audio, or Image
             </p>
          </div>
        </section>

        {/* Center Canvas Area */}
        <main className="flex flex-1 flex-col items-center justify-center bg-black/40 p-8 relative">
          {/* Canvas Wrapper */}
          <div className="relative aspect-video w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden ring-1 ring-stone-800/50 flex items-center justify-center bg-black">
             <PreviewWrapper />
          </div>
          
          {/* Playback Controls */}
          <div className="absolute bottom-4 flex items-center gap-4 rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 backdrop-blur-md">
             <button className="text-stone-300 hover:text-white transition-colors" onClick={() => setPlayhead(0)}>◁</button>
             <button className="text-stone-300 hover:text-white transition-colors" onClick={togglePlay}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
             </button>
             <div className="w-px h-4 bg-stone-700" />
             <span className="text-xs font-mono text-stone-400 w-16 text-center">{formatTime(playheadMs)}</span>
          </div>
        </main>

        {/* Right Settings Panel */}
        <aside className="w-72 shrink-0 border-l border-stone-800 bg-stone-900/30 p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-stone-200 mb-4">Properties</h2>
          {selectedClip ? (
             <div className="space-y-6">
                {/* Generic Properties */}
                <div className="space-y-3">
                   <h3 className="text-xs font-semibold uppercase text-stone-500">Transform</h3>
                   <div className="grid grid-cols-2 gap-2">
                       <div className="space-y-1">
                          <label className="text-[10px] text-stone-400">Position X</label>
                          <input 
                            type="number" 
                            value={selectedClip.clip.transform?.x || 0}
                            onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { transform: { ...selectedClip.clip.transform, x: Number(e.target.value) } as any })}
                            className="w-full rounded bg-stone-800 px-2 py-1 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-stone-400">Position Y</label>
                          <input 
                            type="number" 
                            value={selectedClip.clip.transform?.y || 0}
                            onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { transform: { ...selectedClip.clip.transform, y: Number(e.target.value) } as any })}
                            className="w-full rounded bg-stone-800 px-2 py-1 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] text-stone-400">Scale</label>
                          <input 
                            type="number" 
                            step={0.1}
                            value={selectedClip.clip.transform?.scaleX || 1}
                            onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { transform: { ...selectedClip.clip.transform, scaleX: Number(e.target.value), scaleY: Number(e.target.value) } as any })}
                            className="w-full rounded bg-stone-800 px-2 py-1 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                       </div>
                   </div>
                </div>

                {/* Text-Specific Properties */}
                {selectedClip.clip.type === 'text' && (
                   <div className="space-y-3 pt-4 border-t border-stone-800">
                      <h3 className="text-xs font-semibold uppercase text-stone-500">Text Settings</h3>
                      <div className="space-y-2">
                         <label className="text-[10px] text-stone-400">Content</label>
                         <textarea 
                            value={(selectedClip.clip as any).content}
                            onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { content: e.target.value } as any)}
                            className="w-full rounded bg-stone-800 px-2 py-1 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                            <label className="text-[10px] text-stone-400">Font Size</label>
                            <input 
                              type="number" 
                              value={(selectedClip.clip as any).style?.fontSize || 48}
                              onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { style: { ...(selectedClip.clip as any).style, fontSize: Number(e.target.value) } as any })}
                              className="w-full rounded bg-stone-800 px-2 py-1 text-xs text-stone-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] text-stone-400">Color</label>
                            <input 
                              type="color" 
                              value={(selectedClip.clip as any).style?.color || '#ffffff'}
                              onChange={(e) => updateClip(selectedClip.trackId, selectedClip.clip.id, { style: { ...(selectedClip.clip as any).style, color: e.target.value } as any })}
                              className="w-full h-6 rounded bg-stone-800 cursor-pointer"
                            />
                         </div>
                      </div>
                   </div>
                )}
             </div>
          ) : (
             <div className="rounded-lg bg-stone-800/30 p-3">
                 <p className="text-xs text-stone-400">Select an item on the timeline to view properties.</p>
             </div>
          )}
        </aside>
      </div>

      {/* Bottom Timeline Section */}
      <footer className="flex h-64 shrink-0 flex-col border-t border-stone-800 bg-stone-900/50">
        {/* Timeline Header (Tools) */}
        <div className="flex h-10 items-center border-b border-stone-800/50 px-4 bg-stone-900">
           <div className="flex gap-2">
              <button className="rounded px-2 py-1 text-xs text-stone-400 hover:bg-stone-800 hover:text-stone-200">Split</button>
              <button className="rounded px-2 py-1 text-xs text-stone-400 hover:bg-stone-800 hover:text-stone-200">Delete</button>
           </div>
           <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-stone-500">Zoom</span>
              <input type="range" className="w-24 accent-indigo-500" />
           </div>
        </div>
        
        {/* Timeline Tracks Area */}
        <Timeline />
      </footer>
    </div>
  );
}
