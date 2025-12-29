import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import { getQueueStats, getSpendingStats } from '../../lib/api';

export default function DashboardPage() {
  const [queueStats, setQueueStats] = useState<any>(null);
  const [spendingStats, setSpendingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [queue, spending] = await Promise.all([
      getQueueStats(),
      getSpendingStats(),
    ]);
    setQueueStats(queue);
    setSpendingStats(spending);
    setLoading(false);
  };

  if (loading && !queueStats) {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="mt-1 text-sm text-gray-600">
            Real-time metrics and system status
          </p>
        </div>

        {/* Queue Stats */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Status</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Pending Jobs"
              value={queueStats?.pending || 0}
              subtitle="Waiting to be processed"
            />
            <StatCard
              title="Processing"
              value={queueStats?.processing || 0}
              subtitle="Currently running"
            />
            <StatCard
              title="Completed"
              value={queueStats?.completed || 0}
              subtitle="Total completed"
            />
            <StatCard
              title="Failed"
              value={queueStats?.failed || 0}
              subtitle="Jobs that failed"
            />
          </div>
        </div>

        {/* Priority Breakdown */}
        {queueStats && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue by Priority</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <StatCard
                title="High Priority (Pro)"
                value={queueStats.byPriority?.high || 0}
              />
              <StatCard
                title="Medium Priority (Popular)"
                value={queueStats.byPriority?.medium || 0}
              />
              <StatCard
                title="Low Priority (Starter/Trial)"
                value={queueStats.byPriority?.low || 0}
              />
            </div>
          </div>
        )}

        {/* Spending Stats */}
        {spendingStats && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Monitoring</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <StatCard
                title="Today's Spending"
                value={`$${spendingStats.today?.totalCost?.toFixed(2) || '0.00'}`}
                subtitle={`${spendingStats.today?.jobCount || 0} jobs processed`}
              />
              <StatCard
                title="Last 7 Days"
                value={`$${spendingStats.last7Days?.total?.toFixed(2) || '0.00'}`}
                subtitle={`Avg: $${spendingStats.last7Days?.average?.toFixed(2) || '0.00'}/day`}
              />
            </div>
          </div>
        )}

        {/* Queue Info */}
        {queueStats && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-600">Average Wait Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {queueStats.averageWaitTime || 0} seconds
                </p>
              </div>
              {queueStats.oldestPendingJob && (
                <div>
                  <p className="text-sm text-gray-600">Oldest Pending Job</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(queueStats.oldestPendingJob).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500 text-center">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </Layout>
  );
}

