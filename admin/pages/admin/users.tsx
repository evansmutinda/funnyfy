import Layout from '../../components/Layout';

export default function UsersPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            View and manage users, subscriptions, and usage
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            User management interface coming soon. This will show:
          </p>
          <ul className="mt-4 list-disc list-inside space-y-2 text-gray-600">
            <li>List of all users with subscription status</li>
            <li>User details and usage statistics</li>
            <li>Subscription management (upgrade/downgrade/cancel)</li>
            <li>Usage history and job history</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}

