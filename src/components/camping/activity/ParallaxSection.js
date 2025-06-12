'use client';

import Link from 'next/link';

export default function ParallaxSection() {
  return (
    <div className="mt-14 relative w-screen left-[50%] right-[50%] mx-[-50vw] h-[250px] overflow-hidden shadow-[inset_0_0_30px_rgba(0,0,0,0.2)]">
      <div 
        className="absolute inset-0 bg-fixed bg-center bg-cover"
        style={{
          backgroundImage: "url('/uploads/activities/camp-detail-banner.webp')",
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative h-full flex items-center justify-center text-center max-w-[1440px] mx-auto px-4">
          <div className="text-white space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              探索更多精彩活動
            </h2>
            <p className="text-lg text-gray-200">
              與大自然共度美好時光，創造難忘的露營體驗
            </p>
            <div className="pt-3">
              <Link 
                href="/camping/activities" 
                className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full 
                         border-2 border-white/50 hover:border-white transition-all duration-300
                         shadow-lg hover:shadow-xl no-underline"
              >
                查看更多活動
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 