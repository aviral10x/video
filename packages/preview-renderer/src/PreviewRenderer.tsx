import React, { useEffect, useRef } from 'react';
import { Project, Clip } from '@video-editor/timeline-schema';
import * as PIXI from 'pixi.js';

interface PreviewRendererProps {
  project: Project;
  playheadMs: number;
}

export const PreviewRenderer: React.FC<PreviewRendererProps> = ({ project, playheadMs }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  // Initialize PixiJS Application
  useEffect(() => {
    if (!containerRef.current) return;

    const { width, height, backgroundColor } = project.settings;
    const bgHex = parseInt(backgroundColor.replace('#', ''), 16) || 0x000000;

    const app = new PIXI.Application();
    
    app.init({
       width,
       height,
       backgroundColor: bgHex,
       resolution: window.devicePixelRatio || 1,
       autoDensity: true,
    }).then(() => {
       if (containerRef.current) {
          containerRef.current.appendChild(app.canvas);
       }
       appRef.current = app;
    });

    return () => {
       if (appRef.current) {
           appRef.current.destroy(true, { children: true, texture: true });
           appRef.current = null;
       }
    };
  }, [project.settings]);

  // Render loop syncing to playheadMs
  useEffect(() => {
    const app = appRef.current;
    if (!app) return;

    // Clear previous children
    app.stage.removeChildren();

    const { width, height } = project.settings;

    // Find all active clips at the current playhead
    const activeClips = project.tracks
      .filter(track => !track.hidden)
      .flatMap(track => track.clips)
      .filter(clip => playheadMs >= clip.startAtMs && playheadMs < (clip.startAtMs + clip.durationMs));

    activeClips.forEach(clip => {
       if (clip.type === 'text') {
           const textClip = clip as any;
           const text = new PIXI.Text({
               text: textClip.content,
               style: {
                   fontFamily: textClip.style?.fontFamily || 'Arial',
                   fontSize: textClip.style?.fontSize || 48,
                   fill: textClip.style?.color || '#ffffff',
                   fontWeight: textClip.style?.fontWeight || 'bold'
               }
           });
           text.anchor.set(0.5);
           text.position.set(textClip.transform?.x || width / 2, textClip.transform?.y || height / 2);
           app.stage.addChild(text);
       } else if (clip.type === 'video') {
           // Placeholder for video until we add video proxy logic
           const placeholder = new PIXI.Text({
               text: `[Video: ${(clip as any).assetId}]`,
               style: { fill: '#cccccc', fontSize: 32 }
           });
           placeholder.anchor.set(0.5);
           placeholder.position.set(width / 2, height / 4);
           app.stage.addChild(placeholder);
       }
    });

    // Render explicitly once since we're currently modifying stage reactively based on playheadMs prop
    // In a real loop, we'd use app.ticker based on project playing state.
    app.render();

  }, [playheadMs, project]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center pointer-events-none overflow-hidden"
    />
  );
};
