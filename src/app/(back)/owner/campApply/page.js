'use client';
import { Suspense } from 'react';
import CampApplyForm from '@/components/owner/campApply/CampApplyForm';

export default function CampApplyPage() {
  const loading = (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]" />
    </div>
  );

  return (
    <div className="h-full">
      <Suspense fallback={loading}>
        <div className="h-full flex flex-col pt-16">
          <h1 className="text-2xl font-bold text-[#2C4A3B] mb-6">營地申請</h1>
          <div className="flex-1 min-h-0">
            <CampApplyForm />
          </div>
        </div>
      </Suspense>
    </div>
  );
} 