'use client';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

export default function AdminHeader() {
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <motion.header 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-16 bg-[#FAFAFA] border-b border-[#E8E4DE] z-10"
    >
      <div className="h-full px-8 flex items-center justify-end">
        {/* 右側功能區 */}
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-9 h-9 bg-[#8B7355] rounded-full flex items-center justify-center text-white text-sm shadow-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {session?.user?.name?.[0]?.toUpperCase() || 'A'}
            </motion.div>
            <span className="text-sm font-medium text-[#493A2A]">
              {session?.user?.name || '系統管理員'}
            </span>
          </div>
          <motion.button
            onClick={handleLogout}
            className="px-4 py-2 bg-white border-2 border-red-500 text-red-500 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            登出
          </motion.button>
        </motion.div>
      </div>
    </motion.header>
  );
} 