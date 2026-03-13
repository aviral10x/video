'use client';

import React, { useEffect } from 'react';
import { useEditorStore } from '@video-editor/editor-core';
import { Timeline } from '@/components/editor/Timeline';
export default function EditorPage() {
  const { setProject, project } = useEditorStore();

  useEffect(() => {
    // Inject mock project data on mount for testing MVP
    if (!project) {
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
  return (
    <div className="flex h-screen w-full flex-col bg-stone-950 text-slate-200">
      {/* Top Navbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-800 bg-stone-900/50 px-4">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded bg-indigo-500" />
          <h1 className="text-sm font-semibold tracking-wide text-stone-100">Hybrid Editor</h1>
        </div>
        <div className="flex gap-2">
          <button className="rounded px-3 py-1.5 text-xs font-medium text-stone-300 hover:bg-stone-800 transition-colors">
            Share
          </button>
          <button className="rounded bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors">
            Export
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Assets/Tools) */}
        <aside className="flex w-16 shrink-0 flex-col items-center border-r border-stone-800 bg-stone-900/30 py-4 gap-4">
            {['Media', 'Audio', 'Text', 'Transitions', 'Filters'].map((item, idx) => (
              <button key={item} className="flex h-12 w-12 flex-col items-center justify-center rounded-lg hover:bg-stone-800/80 text-stone-400 hover:text-stone-200 transition-all">
                  <div className="h-5 w-5 mb-1 rounded bg-stone-700/50" />
                  <span className="text-[9px] font-medium">{item}</span>
              </button>
            ))}
        </aside>

        {/* Left Panel (Tool Options / Asset Library) */}
        <section className="w-64 shrink-0 border-r border-stone-800 bg-stone-900/30 p-4">
          <h2 className="text-sm font-semibold text-stone-200 mb-4">Project Assets</h2>
          <div className="flex h-full items-center justify-center rounded-lg border-2 border-dashed border-stone-800">
             <p className="text-xs text-stone-500">Drag & Drop Media</p>
          </div>
        </section>

        {/* Center Canvas Area */}
        <main className="flex flex-1 flex-col items-center justify-center bg-black/40 p-8 relative">
          {/* Canvas Wrapper */}
          <div className="relative aspect-video w-full max-w-4xl rounded-lg bg-stone-900 shadow-2xl overflow-hidden ring-1 ring-stone-800/50">
             <div className="absolute inset-0 flex items-center justify-center">
                 <p className="text-sm text-stone-500">Preview Renderer (PixiJS)</p>
             </div>
          </div>
          
          {/* Playback Controls */}
          <div className="absolute bottom-4 flex items-center gap-4 rounded-full border border-stone-800 bg-stone-900/80 px-4 py-2 backdrop-blur-md">
             <button className="text-stone-300 hover:text-white">◁</button>
             <button className="text-stone-300 hover:text-white">▷</button>
             <div className="w-px h-4 bg-stone-700" />
             <span className="text-xs font-mono text-stone-400">00:00:00</span>
          </div>
        </main>

        {/* Right Settings Panel */}
        <aside className="w-72 shrink-0 border-l border-stone-800 bg-stone-900/30 p-4">
          <h2 className="text-sm font-semibold text-stone-200 mb-4">Properties</h2>
          <div className="space-y-4">
             <div className="rounded-lg bg-stone-800/30 p-3">
                 <p className="text-xs text-stone-400">Select an item on the timeline to view properties.</p>
             </div>
          </div>
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
