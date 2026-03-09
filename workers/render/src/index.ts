/**
 * @video-editor/render-worker
 *
 * Render job processor. Will integrate with Remotion's
 * server-side rendering in a future step.
 */

import type { RenderJob } from "@video-editor/shared";

export async function processRenderJob(job: RenderJob): Promise<void> {
    console.log(`[render-worker] Processing job ${job.id} …`);
    // TODO: integrate Remotion SSR rendering
}
