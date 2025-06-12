'use client';
import { Suspense } from 'react';
import CampList from '@/components/owner/campStatus/CampList';
import { motion } from 'framer-motion';
import { HiOutlineClipboardCheck } from 'react-icons/hi';

export default function CampsPage() {
  const loading = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center mb-8 mt-16"
        >
          <HiOutlineClipboardCheck className="w-8 h-8 text-[#6B8E7B] mr-3" />
          <h1 className="text-2xl font-bold text-[#2C4A3B]">營地審核狀態</h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Suspense fallback={loading}>
            <CampList />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
} 