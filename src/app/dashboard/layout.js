"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
  };

  if (!isAuthenticated()) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeItem="dashboard" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          user={user}
          onLogout={handleLogout}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
