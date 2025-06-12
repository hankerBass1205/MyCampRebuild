'use client';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-[#F3F4F6]
                    p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <ForgotPasswordForm />
      </div>
    </div>
  );
} 