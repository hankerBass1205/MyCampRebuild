'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaCheckCircle } from 'react-icons/fa';

export default function EcpaySuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/camping/checkout/complete');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">付款成功！</h1>
        <p className="text-gray-600 mb-6">
          感謝您的購買，您可以在訂單管理中查看訂單詳細資訊。
        </p>
        <p className="text-sm text-gray-500 mb-4">
          5 秒後自動導向訂單頁面...
        </p>
        <button
          onClick={() => router.push('/camping/checkout/complete')}
          className="w-full bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
        >
          立即查看訂單
        </button>
      </div>
    </div>
  );
} 