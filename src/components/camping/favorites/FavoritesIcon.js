'use client';
import { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

export function FavoritesIcon({ onClick }) {
  const { data: session } = useSession();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const fetchFavoritesCount = async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/camping/favorites');
      const data = await response.json();
      setFavoritesCount(data.favorites?.length || 0);
    } catch (error) {
      console.error('獲取收藏數量失敗:', error);
    }
  };

  useEffect(() => {
    fetchFavoritesCount();

    const handleFavoritesUpdate = (event) => {
      const { type } = event.detail;
      setFavoritesCount(prev => {
        const newCount = type === 'add' ? prev + 1 : prev - 1;
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
        return newCount;
      });
    };

    window.addEventListener('favoritesUpdate', handleFavoritesUpdate);
    return () => window.removeEventListener('favoritesUpdate', handleFavoritesUpdate);
  }, [session]);

  return (
    <div 
      onClick={onClick}
      className="relative cursor-pointer"
      style={{ 
        color: '#9B7A5A',
        position: 'relative',
        top: '2px'  // 整體圖標稍微往下調整
      }}
    >
      <FaHeart 
        style={{ 
          width: '24px', 
          height: '24px'
        }} 
      />
      {favoritesCount > 0 && (
        <span 
          className="num"
          style={{
            top: '-14px'  // 數字標籤往上調整
          }}
        >
          {favoritesCount}
        </span>
      )}
    </div>
  );
} 