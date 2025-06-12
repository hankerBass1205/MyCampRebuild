"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaCalendarAlt, FaMapMarkerAlt, FaHeart } from "react-icons/fa";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

// ===== 自定義工具引入 =====
import { 
  showSystemAlert,     // 系統錯誤提示
  showFavoriteAlert    // 收藏相關提示
} from "@/utils/sweetalert";

import {
  favoriteToast,      // 收藏相關提示
  ToastContainerComponent // Toast 容器組件
} from "@/utils/toast";

export default function FavoritesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("../auth/login");
      return;
    }

    const fetchFavorites = async () => {
      try {
        // 獲取收藏列表
        const favResponse = await fetch("/api/camping/favorites");
        const favData = await favResponse.json();

        if (!favData.favorites?.length) {
          setFavorites([]);
          setLoading(false);
          // 無收藏時使用 SweetAlert
          await showFavoriteAlert.empty();
          return;
        }

        // 獲取收藏活動詳情
        const activitiesResponse = await fetch("/api/camping/activities/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activityIds: favData.favorites }),
        });

        if (!activitiesResponse.ok) {
          // API 錯誤使用 SweetAlert
          await showSystemAlert.error('獲取活動資料失敗');
          return;
        }

        const activitiesData = await activitiesResponse.json();
        setFavorites(activitiesData.activities || []);
      } catch (error) {
        // console.error("獲取收藏失敗:", error);
        // 未預期錯誤使用 SweetAlert
        await showSystemAlert.unexpectedError();
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session, router]);

  const handleRemoveFavorite = async (activityId) => {
    try {
      // 移除前先確認
      const result = await showFavoriteAlert.confirmRemove();
      if (!result.isConfirmed) return;

      const response = await fetch("/api/camping/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      });

      if (!response.ok) {
        // API 錯誤使用 SweetAlert
        await showFavoriteAlert.error('移除收藏失敗');
        return;
      }

      // 更新本地狀態
      setFavorites((prev) => prev.filter((fav) => fav.activity_id !== activityId));
      
      // 觸發全域事件
      window.dispatchEvent(new CustomEvent('favoritesUpdate', {
        detail: { type: 'remove' }
      }));
      
      // 成功提示使用 Toast
      favoriteToast.success('已移除收藏');
    } catch (error) {
      // console.error("移除收藏失敗:", error);
      // 未預期錯誤使用 SweetAlert
      await showSystemAlert.unexpectedError();
    }
  };

  const getImageUrl = (imageName) => {
    // 如果是完整的 URL（包括 http:// 或 https:// 開頭）
    if (imageName?.startsWith('http')) {
      return imageName;
    }
    
    // 如果有圖片名稱但不是完整 URL
    if (imageName) {
      try {
        // 確保圖片路徑正確（活動圖片存放在 activities 子目錄）
        return `/uploads/activities/${imageName}`;
      } catch (error) {
        // console.error('圖片路徑錯誤:', error);
        activityToast.error(error.message || "圖片路徑錯誤，請稍後再試");
        return '/default-activity.jpg';
      }
    }
    
    // 如果沒有圖片，返回預設圖片
    return '/default-activity.jpg';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">載入中...</div>
      </div>
    );
  }

  return (
    <div className="max-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">我的收藏</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">目前沒有收藏的活動</p>
          <Link
            href="/camping/activities"
            className="mt-4 inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            探索活動
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((activity) => (
            <div
              key={activity.activity_id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <Link href={`/camping/activities/${activity.activity_id}`}>
                <div className="relative h-48">
                  <Image
                    src={getImageUrl(activity.main_image)}
                    alt={activity.title || '活動圖片'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={true}
                    onError={(e) => {
                      // console.error('圖片載入敗:', e);
                      activityToast.error(e.message || "圖片載入失敗，請稍後再試");
                      e.currentTarget.src = '/default-activity.jpg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {activity.title}
                  </h2>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center">
                      <FaCalendarAlt className="mr-2" />
                      {format(new Date(activity.start_date), "yyyy/MM/dd", {
                        locale: zhTW,
                      })}
                      {" - "}
                      {format(new Date(activity.end_date), "yyyy/MM/dd", {
                        locale: zhTW,
                      })}
                    </p>
                    <p className="flex items-center">
                      <FaMapMarkerAlt className="mr-2" />
                      {activity.location}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-lg font-bold text-green-600">
                      NT$ {activity.min_price?.toLocaleString()}
                      {activity.min_price !== activity.max_price &&
                        ` ~ ${activity.max_price?.toLocaleString()}`}
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFavorite(activity.activity_id);
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <FaHeart className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      <ToastContainerComponent />
    </div>
  );
}
