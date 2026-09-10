'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

export default function NotificationsPage() {
  const router = useRouter();

  useEffect(() => {
    // Check user role and route to their dashboard with notifications active
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          if (data.user.role === 'admin') {
            router.replace('/admin');
          } else if (data.user.role === 'supervisor') {
            router.replace('/dashboard/faculty');
          } else {
            router.replace('/dashboard/leader');
          }
        } else {
          router.replace('/login');
        }
      })
      .catch(() => {
        router.replace('/login');
      });
  }, [router]);

  return <LoadingScreen label="Opening Notification Center..." />;
}
