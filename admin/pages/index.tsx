import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin login
    router.push('/admin/login');
  }, [router]);

  return null;
}

