import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '../lib/auth';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication for admin routes
    if (router.pathname.startsWith('/admin') && router.pathname !== '/admin/login') {
      if (!isAuthenticated()) {
        router.push('/admin/login');
        return;
      }
    }
    setLoading(false);
  }, [router.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return <Component {...pageProps} />;
}

