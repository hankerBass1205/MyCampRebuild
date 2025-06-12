'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle } from 'react-icons/fa';

export default function SuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3); // 3秒倒數

  useEffect(() => {
    // 通知原視窗付款成功
    if (window.opener) {
      window.opener.postMessage('LINE_PAY_SUCCESS', '*');
      
      // 倒數計時
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // 倒數結束後關閉視窗
            window.close();
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      // 如果沒有 opener（直接開啟），5秒後導向訂單頁面
      const timer = setTimeout(() => {
        router.push('/camping/checkout/complete');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">付款成功！</h1>
        <p className="text-gray-600 mb-6">
          感謝您的購買，您可以在訂單管理中查看訂單詳細資訊。
        </p>
        {window.opener && (
          <p className="text-sm text-gray-500">
            視窗將在 {countdown} 秒後自動關閉...
          </p>
        )}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/camping/checkout/complete')}
            className="w-full bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
          >
            查看訂單
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            返回首頁
          </button>
        </div>
      </div>
    </div>
  );
}