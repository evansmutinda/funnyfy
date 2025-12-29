// API client for admin dashboard

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://funnyfyapp.vercel.app';
import { authenticatedFetch } from './auth';

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  averageWaitTime: number;
  oldestPendingJob: string | null;
}

export interface SpendingStats {
  today: {
    totalCost: number;
    jobCount: number;
  };
  last7Days: {
    daily: Array<{ date: string; cost: number; jobs: number }>;
    total: number;
    average: number;
  };
}

export interface SecurityLog {
  id: string;
  event_type: string;
  user_id: string | null;
  ip_address: string | null;
  success: boolean;
  details: any;
  created_at: string;
}

// Get queue statistics
export async function getQueueStats(): Promise<QueueStats | null> {
  try {
    const response = await authenticatedFetch(`${API_BASE}/api/admin/queue-stats`);
    const data = await response.json();
    
    if (data.ok) {
      return data.queue;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch queue stats:', err);
    return null;
  }
}

// Get spending statistics
export async function getSpendingStats(): Promise<SpendingStats | null> {
  try {
    const response = await authenticatedFetch(`${API_BASE}/api/admin/queue-stats`);
    const data = await response.json();
    
    if (data.ok) {
      return data.spending;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch spending stats:', err);
    return null;
  }
}

// Get security logs
export async function getSecurityLogs(limit: number = 100): Promise<SecurityLog[]> {
  try {
    const response = await authenticatedFetch(
      `${API_BASE}/api/admin/security-logs?limit=${limit}`
    );
    const data = await response.json();
    
    if (data.ok) {
      return data.events || [];
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch security logs:', err);
    return [];
  }
}

