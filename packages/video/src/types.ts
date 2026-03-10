import type { TranscriptWord, TemplateConfig } from "@video-editor/shared";

export interface ProjectAssetInput {
    assetType: "vfx" | "sfx" | "broll" | "music";
    fileUrl?: string;
    name: string;
    config?: Record<string, unknown>;
    startSec?: number;
    endSec?: number;
    durationMs?: number;
}

export interface VideoCompositionProps {
    sourceVideoUrl: string;
    transcriptWords: TranscriptWord[];
    templateConfig: TemplateConfig;
    hookText: string;
    ctaText: string;
    zoomTimestamps: number[];
    durationInFrames: number;
    fps: number;
    projectAssets?: ProjectAssetInput[];
}

