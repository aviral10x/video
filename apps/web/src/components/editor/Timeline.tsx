import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '@video-editor/editor-core';
import { Track, Clip } from '@video-editor/timeline-schema';

// Constants for timeline scaling
const PIXELS_PER_SECOND = 50;

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const frames = Math.floor((ms % 1000) / (1000 / 30)); // Assuming 30fps
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
}

import { motion } from 'framer-motion';

const TimelineClip = ({ trackId, clip }: { trackId: string, clip: Clip }) => {
  const { updateClip, trimClip, moveClipTime, playheadMs, selectedClipId, selectClip } = useEditorStore();
  const isSelected = selectedClipId === clip.id;
  
  const widthStr = `${(clip.durationMs / 1000) * PIXELS_PER_SECOND}px`;
  const leftStr = `${(clip.startAtMs / 1000) * PIXELS_PER_SECOND}px`;

  // Colors based on clip type
  const bgColors = {
    video: 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200',
    audio: 'bg-teal-600/30 border-teal-500/50 text-teal-200',
    image: 'bg-amber-600/30 border-amber-500/50 text-amber-200',
    text: 'bg-fuchsia-600/30 border-fuchsia-500/50 text-fuchsia-200'
  };
  const colorClass = bgColors[clip.type] || bgColors.video;

  return (
    <motion.div 
      drag="x"
      dragMomentum={false}
      onDragEnd={(e, info) => {
         const deltaMs = (info.offset.x / PIXELS_PER_SECOND) * 1000;
         moveClipTime(trackId, clip.id, clip.startAtMs + deltaMs);
      }}
      onClick={(e) => { e.stopPropagation(); selectClip(clip.id); }}
      className={`absolute h-8 rounded border flex items-center px-2 cursor-grab active:cursor-grabbing transition-colors ${colorClass} ${isSelected ? 'ring-2 ring-white z-10' : 'hover:brightness-110 z-0'}`}
      style={{ width: widthStr, left: leftStr }}
    >
        <span className="text-[10px] truncate max-w-full font-medium select-none pointer-events-none">
            {clip.type === 'text' ? (clip as any).content : 'Media Clip'}
        </span>
        
        {/* Basic trim handles (visual only for MVP Phase 2 start) */}
        {isSelected && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-white/50 cursor-col-resize hover:bg-white transition-colors" />
            <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 cursor-col-resize hover:bg-white transition-colors" />
          </>
        )}
    </motion.div>
  );
}

const TimelineTrack = ({ track }: { track: Track }) => {
  return (
    <div className="flex h-12 w-full rounded bg-stone-800/30 ring-1 ring-stone-800 flex items-center px-4 relative group">
        <span className="text-xs font-medium text-stone-500 w-16 shrink-0 truncate uppercase" title={track.name}>
          {track.name}
        </span>
        
        {/* Track Body / Grid */}
        <div className="flex-1 h-full relative border-l border-stone-800/50 overflow-hidden bg-stone-900/10 group-hover:bg-stone-800/20 transition-colors">
             {track.clips.map(clip => (
                <TimelineClip key={clip.id} trackId={track.id} clip={clip} />
             ))}
        </div>
    </div>
  );
}

export const Timeline = () => {
   const { project, playheadMs, selectClip } = useEditorStore();
   
   if (!project) {
     return (
        <div className="flex-1 flex items-center justify-center">
            <p className="text-stone-500 text-sm">No project loaded.</p>
        </div>
     );
   }

   const playheadLeft = `${(playheadMs / 1000) * PIXELS_PER_SECOND}px`;

   return (
       <div 
         className="flex-1 overflow-auto relative p-4 flex flex-col gap-2 bg-stone-900/50 select-none pb-24"
         onClick={() => selectClip(null)}
       >
         {/* Ruler Header placeholder (optional) */}
         <div className="absolute top-0 left-[80px] right-0 h-4 border-b border-stone-800 pointer-events-none" />

         {/* Tracks */}
         {project.tracks.map(track => (
            <TimelineTrack key={track.id} track={track} />
         ))}

         {/* Playhead Marker */}
         <div 
           className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-50 shadow-[0_0_8px_rgba(244,63,94,0.5)] cursor-ew-resize transition-transform duration-75"
           style={{ transform: `translateX(calc(${playheadLeft} + 80px))` }} // 80px offset for the track label width + padding
         >
            <div className="absolute -top-1 -left-1.5 h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-rose-500" />
         </div>
       </div>
   );
}
