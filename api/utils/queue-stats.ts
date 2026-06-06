// Queue statistics and monitoring utilities

import { query } from '../db';

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  byPriority: {
    high: number; // priority >= 10 (Pro)
    medium: number; // priority >= 5 (Popular)
    low: number; // priority < 5 (Starter/Trial)
  };
  averageWaitTime: number; // seconds
  oldestPendingJob: Date | null;
}

/**
 * Get current queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
  try {
    // Get counts by status
    const statusResult = await query<{ status: string; count: number }>(
      `
        SELECT status, COUNT(*)::int as count
        FROM jobs
        WHERE status IN ('pending', 'processing', 'completed', 'failed')
        GROUP BY status
      `
    );

    const counts: Record<string, number> = {};
    statusResult.rows.forEach((row: { status: string; count: number }) => {
      counts[row.status] = row.count;
    });

    // Get counts by priority
    const priorityResult = await query<{ priority: number; count: number }>(
      `
        SELECT priority, COUNT(*)::int as count
        FROM jobs
        WHERE status = 'pending'
        GROUP BY priority
      `
    );

    const byPriority = {
      high: 0, // priority >= 10
      medium: 0, // priority >= 5 and < 10
      low: 0, // priority < 5
    };

    priorityResult.rows.forEach((row: { priority: number; count: number }) => {
      if (row.priority >= 10) {
        byPriority.high += row.count;
      } else if (row.priority >= 5) {
        byPriority.medium += row.count;
      } else {
        byPriority.low += row.count;
      }
    });

    // Get oldest pending job
    const oldestResult = await query<{ created_at: Date }>(
      `
        SELECT created_at
        FROM jobs
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
      `
    );

    const oldestPendingJob = oldestResult.rows[0]?.created_at || null;

    // Calculate average wait time (time from created to started for completed jobs)
    const waitTimeResult = await query<{ avg_wait_seconds: number }>(
      `
        SELECT 
          AVG(EXTRACT(EPOCH FROM (started_at - created_at)))::numeric as avg_wait_seconds
        FROM jobs
        WHERE status = 'completed'
          AND started_at IS NOT NULL
          AND created_at IS NOT NULL
          AND started_at > created_at
          AND created_at >= NOW() - INTERVAL '24 hours'
      `
    );

    const averageWaitTime = Number(waitTimeResult.rows[0]?.avg_wait_seconds ?? 0);

    return {
      pending: counts.pending || 0,
      processing: counts.processing || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      byPriority,
      averageWaitTime: Math.round(averageWaitTime),
      oldestPendingJob,
    };
  } catch (err) {
    console.error('[queue-stats] Failed to get queue stats:', err);
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byPriority: { high: 0, medium: 0, low: 0 },
      averageWaitTime: 0,
      oldestPendingJob: null,
    };
  }
}

/**
 * Get estimated wait time for a job based on queue position
 */
export async function getEstimatedWaitTime(queuePosition: number): Promise<number> {
  try {
    const stats = await getQueueStats();
    
    if (stats.averageWaitTime === 0) {
      // Default estimate: 30 seconds per job
      return queuePosition * 30;
    }

    // Estimate based on average wait time and current processing capacity
    const processingCapacity = 10; // MAX_CONCURRENT_JOBS
    const jobsAhead = queuePosition;
    
    // Estimate: (jobs ahead / processing capacity) * average wait time
    return Math.round((jobsAhead / processingCapacity) * stats.averageWaitTime);
  } catch (err) {
    console.error('[queue-stats] Failed to get estimated wait time:', err);
    return queuePosition * 30; // Fallback estimate
  }
}

