import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { getQueueStats, getSpendingStats } from '../../lib/api';

export default function QueuePage() {
  const [queueStats, setQueueStats] = useState<any>(null);
  const [spendingStats, setSpendingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [queue, spending] = await Promise.all([
      getQueueStats(),
      getSpendingStats(),
    ]);
    setQueueStats(queue);
    setSpendingStats(spending);
    setLoading(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Queue Monitoring</h2>
            <p className="mt-1 text-sm text-gray-600">
              Real-time queue status and job processing
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading queue data...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Queue Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Status</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {queueStats?.pending || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Processing</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {queueStats?.processing || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">
                    {queueStats?.completed || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-3xl font-bold text-red-600">
                    {queueStats?.failed || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Priority Breakdown */}
            {queueStats && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Jobs by Priority
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      High Priority (Pro Users)
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {queueStats.byPriority?.high || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Medium Priority (Popular Users)
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {queueStats.byPriority?.medium || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">
                      Low Priority (Starter/Trial)
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      {queueStats.byPriority?.low || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Queue Metrics */}
            {queueStats && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Metrics</h3>
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

            {/* Cost Info */}
            {spendingStats && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Costs</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Total Spending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${spendingStats.today?.totalCost?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Jobs Processed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {spendingStats.today?.jobCount || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

