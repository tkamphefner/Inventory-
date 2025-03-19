"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip protection for login page to avoid redirect loops
    if (pathname === '/auth/login') {
      return;
    }

    // If authentication check is complete and user is not authenticated, redirect to login
    if (!loading && !isAuthenticated()) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, loading, router, pathname]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If on login page or authenticated, render children
  if (pathname === '/auth/login' || isAuthenticated()) {
    return children;
  }

  // Return null during redirect to avoid flash of content
  return null;
}
