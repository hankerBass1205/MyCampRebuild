'use client';
import { Suspense } from 'react';
import ActivityList from '@/components/owner/activities/ActivityList';

export default function ActivitiesPage() {
  const loading = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={loading}>
        <ActivityList />
      </Suspense>
    </div>
  );
} 