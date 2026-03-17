import { Queue } from 'bullmq';
import Redis from 'ioredis';

// Upstash Redis requires TLS and specific BullMQ-compatible options
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisConnection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,  // Required by BullMQ
    enableReadyCheck: false,      // Upstash doesn't support INFO command
    tls: redisUrl.startsWith('rediss://') ? {} : undefined,
    lazyConnect: true,
});

// The queue where we drop render jobs
export const renderQueue = new Queue('video-render-queue', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 },
    },
});
