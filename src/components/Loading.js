'use client';
import { motion } from 'framer-motion';
import Image from 'next/image';

const Loading = ({ isLoading = false }) => {
  if (!isLoading) return null;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-50 bg-white/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo 動畫容器 */}
      <motion.div
        className="relative w-48 h-48"
        animate={{
          y: [-12, 12, -12],
        }}
        transition={{
          y: {
            repeat: Infinity,
            duration: 1.5,
            ease: 'easeInOut'
          }
        }}
      >
        <Image
          src="/logo-loading.png"
          alt="Loading Logo"
          width={192}
          height={192}
          className="w-full h-full object-contain"
          priority
          loading="eager"
        />
      </motion.div>
    </motion.div>
  );
};

export default Loading;

