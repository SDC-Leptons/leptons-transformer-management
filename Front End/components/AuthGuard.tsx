"use client";
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/hooks/useUser';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.replace('/login');
    }
  }, [user, loading, isAuthPage, router]);

  if (!isAuthPage && (loading || !user)) {
    return null; // or a loading spinner
  }
  return <>{children}</>;
}
