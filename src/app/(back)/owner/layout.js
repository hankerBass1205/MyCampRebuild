'use client';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import OwnerHeader from '@/components/owner/OwnerHeader';
import OwnerSidebar from '@/components/owner/OwnerSidebar';

export default function OwnerLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status === 'loading') return;

    if (!session) {
      router.replace('/auth/login');
      return;
    }

    if (!session.user?.isOwner) {
      router.replace('/auth/login');
      return;
    }

    setIsAuthorized(true);
  }, [session, status, router]);

  if (status === 'loading' || !isAuthorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6B8E7B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="flex h-screen overflow-hidden">
        <OwnerSidebar />
        <div className="flex-1 flex flex-col">
          <OwnerHeader />
          <main className="flex-1 overflow-y-auto bg-[#F8F9FA]">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 