import React, { useEffect, useRef } from 'react';
import { Project } from '@video-editor/timeline-schema';
import * as PIXI from 'pixi.js';

interface PreviewRendererProps {
    project: Project;
    playheadMs: number;
}

// In-module cache: maps assetId → HTMLVideoElement (for video clips)
const videoElementCache = new Map<string, HTMLVideoElement>();

export const PreviewRenderer: React.FC<PreviewRendererProps> = ({ project, playheadMs }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);

    // Initialize PixiJS
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
            if (containerRef.current) containerRef.current.appendChild(app.canvas);
            appRef.current = app;
        });

        return () => {
            if (appRef.current) {
                appRef.current.destroy(true, { children: true, texture: true });
                appRef.current = null;
            }
        };
    }, [project.settings]);

    // Render frame on each playheadMs tick
    useEffect(() => {
        const app = appRef.current;
        if (!app) return;
        app.stage.removeChildren();

        const { width, height } = project.settings;

        const activeClips = project.tracks
            .filter(t => !t.hidden)
            .flatMap(t => t.clips)
            .filter(clip => playheadMs >= clip.startAtMs && playheadMs < clip.startAtMs + clip.durationMs);

        activeClips.forEach(clip => {
            const tx = clip.transform?.x ?? width / 2;
            const ty = clip.transform?.y ?? height / 2;
            const scaleX = clip.transform?.scaleX ?? 1;
            const scaleY = clip.transform?.scaleY ?? 1;
            const rotation = ((clip.transform?.rotation ?? 0) * Math.PI) / 180;

            if (clip.type === 'text') {
                const textClip = clip as any;
                const text = new PIXI.Text({
                    text: textClip.content,
                    style: {
                        fontFamily: textClip.style?.fontFamily ?? 'Arial',
                        fontSize: textClip.style?.fontSize ?? 48,
                        fill: textClip.style?.color ?? '#ffffff',
                        fontWeight: textClip.style?.fontWeight ?? 'bold',
                        align: textClip.style?.textAlign ?? 'center',
                        dropShadow: {
                            alpha: 0.5,
                            blur: 4,
                            color: '#000000',
                            distance: 2,
                        },
                    },
                });
                text.anchor.set(clip.transform?.anchorX ?? 0.5, clip.transform?.anchorY ?? 0.5);
                text.position.set(tx, ty);
                text.scale.set(scaleX, scaleY);
                text.rotation = rotation;
                app.stage.addChild(text);

            } else if (clip.type === 'video') {
                const mediaClip = clip as any;
                const src: string | undefined = mediaClip.src;

                if (src) {
                    // Reuse or create HTMLVideoElement
                    let videoEl = videoElementCache.get(clip.id);
                    if (!videoEl) {
                        videoEl = document.createElement('video');
                        videoEl.src = src;
                        videoEl.crossOrigin = 'anonymous';
                        videoEl.muted = true;
                        videoEl.playsInline = true;
                        videoEl.preload = 'auto';
                        videoElementCache.set(clip.id, videoEl);
                    }

                    // Seek to the correct frame
                    const offsetSec = (playheadMs - clip.startAtMs) / 1000 + (mediaClip.sourceStartMs ?? 0) / 1000;
                    if (Math.abs(videoEl.currentTime - offsetSec) > 0.1) {
                        videoEl.currentTime = offsetSec;
                    }

                    try {
                        const texture = PIXI.Texture.from(videoEl);
                        const sprite = new PIXI.Sprite(texture);
                        sprite.width = width;
                        sprite.height = height;
                        sprite.anchor.set(0.5);
                        sprite.position.set(tx === width / 2 ? width / 2 : tx, ty === height / 2 ? height / 2 : ty);
                        sprite.scale.set(scaleX, scaleY);
                        sprite.rotation = rotation;
                        app.stage.addChild(sprite);
                    } catch {
                        // Texture not ready yet — show placeholder
                        const placeholder = new PIXI.Graphics();
                        placeholder.rect(0, 0, width, height).fill({ color: 0x111111 });
                        app.stage.addChild(placeholder);
                    }
                } else {
                    // No src (asset not yet uploaded) — draw dark placeholder
                    const placeholder = new PIXI.Graphics();
                    placeholder.rect(0, 0, width, height).fill({ color: 0x0f0f0f });
                    app.stage.addChild(placeholder);
                    const label = new PIXI.Text({ text: 'Video', style: { fill: '#555', fontSize: 24 } });
                    label.anchor.set(0.5);
                    label.position.set(width / 2, height / 2);
                    app.stage.addChild(label);
                }

            } else if (clip.type === 'image') {
                const mediaClip = clip as any;
                if (mediaClip.src) {
                    try {
                        const texture = PIXI.Texture.from(mediaClip.src);
                        const sprite = new PIXI.Sprite(texture);
                        sprite.width = width;
                        sprite.height = height;
                        sprite.anchor.set(clip.transform?.anchorX ?? 0.5, clip.transform?.anchorY ?? 0.5);
                        sprite.position.set(tx, ty);
                        sprite.scale.set(scaleX, scaleY);
                        sprite.rotation = rotation;
                        app.stage.addChild(sprite);
                    } catch {}
                }
            }
            // Audio clips have no visual representation in preview
        });

        app.render();
    }, [playheadMs, project]);

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex items-center justify-center pointer-events-none overflow-hidden"
        />
    );
};
