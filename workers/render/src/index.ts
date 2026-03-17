/**
 * @video-editor/render-worker
 *
 * BullMQ worker that processes render jobs dispatched from /api/export.
 * Each job payload is a validated Project JSON from the universal timeline schema.
 *
 * Run this worker separately:
 *   node -r ts-node/register workers/render/src/index.ts
 */

import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// ─── Config ──────────────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const QUEUE_NAME = 'video-render-queue';

const connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Worker ───────────────────────────────────────────────────────────────────

const worker = new Worker(
    QUEUE_NAME,
    async (job: Job) => {
        const project = job.data;
        const jobId = job.id ?? 'unknown';

        console.log(`[render-worker] Starting job ${jobId} for project ${project.id}`);
        await job.updateProgress(5);

        // 1. Dynamic import Remotion (heavy — only loaded in worker process)
        const { bundle } = await import('@remotion/bundler');
        const { renderMedia, selectComposition } = await import('@remotion/renderer');

        // 2. Bundle the Remotion entry point
        const entryPoint = path.resolve(
            __dirname,
            '../../../packages/export-adapter/src/index.ts'
        );

        console.log(`[render-worker] Bundling from ${entryPoint}`);
        await job.updateProgress(10);

        const bundleLocation = await bundle({
            entryPoint,
            onProgress: (progress: number) => {
                const mapped = Math.round(10 + progress * 0.2);
                job.updateProgress(mapped).catch(() => {});
            },
        });

        await job.updateProgress(30);

        // 3. Derive composition settings from project JSON
        const { fps, durationMs, width, height } = project.settings;
        const durationInFrames = Math.round((durationMs / 1000) * fps);

        // 4. Select composition
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: 'Main',
            inputProps: { project },
        });

        await job.updateProgress(35);

        // 5. Render to temp file
        const outputDir = path.join(os.tmpdir(), 'video-editor-renders');
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, `${jobId}.mp4`);

        await renderMedia({
            composition: { ...composition, durationInFrames, fps, width, height },
            serveUrl: bundleLocation,
            codec: 'h264',
            outputLocation: outputPath,
            inputProps: { project },
            onProgress: ({ progress }: { progress: number }) => {
                const mapped = Math.round(35 + progress * 55);
                job.updateProgress(mapped).catch(() => {});
            },
        });

        await job.updateProgress(90);
        console.log(`[render-worker] Rendered to ${outputPath}`);

        // 6. Upload to Supabase Storage
        const fileBuffer = fs.readFileSync(outputPath);
        const storagePath = `${project.id}/${jobId}.mp4`;

        const { error: uploadError } = await supabase.storage
            .from('renders')
            .upload(storagePath, fileBuffer, { contentType: 'video/mp4', upsert: true });

        // Cleanup temp file
        try { fs.unlinkSync(outputPath); } catch {}

        if (uploadError) {
            throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage.from('renders').getPublicUrl(storagePath);
        await job.updateProgress(100);

        console.log(`[render-worker] Job ${jobId} complete → ${urlData.publicUrl}`);

        return { outputUrl: urlData.publicUrl };
    },
    {
        connection: connection as any,
        concurrency: 2,
    }
);

worker.on('completed', (job, result) => {
    console.log(`[render-worker] ✅ Job ${job.id} completed:`, result);
});

worker.on('failed', (job, err) => {
    console.error(`[render-worker] ❌ Job ${job?.id} failed:`, err.message);
});

worker.on('progress', (job, progress) => {
    console.log(`[render-worker] Job ${job.id} progress: ${progress}%`);
});

console.log(`[render-worker] 🚀 Listening on queue "${QUEUE_NAME}" via ${REDIS_URL}`);
