'use client';

import { useSession } from 'next-auth/react';
import LoginForm from '@/components/auth/LoginForm';
import Loading from '@/components/Loading';

export default function LoginPage() {
  const { status } = useSession();

  // 如果正在檢查登入狀態，顯示 Loading 元件
  if (status === 'loading') {
    return <Loading isLoading={true} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-[#F3F4F6] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}