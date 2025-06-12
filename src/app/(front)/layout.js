'use client';

// ===== 核心套件引入 =====
import { CartSidebar } from "@/components/camping/cart/CartSidebar";
import ChatIcon from "@/components/camping/Chat/ChatIcon";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Header from "@/components/layout/header";
// import Footer from "@/components/layout/footer";
// 測試用 Footer
import NewFooter from "@/components/layout/NewFooter";
import UpIcon from "@/components/up-icon/up-icon";
import CouponIcon from "@/components/home/get-coupon-icon/get-coupon-icon"
import Loading from "@/components/Loading";
import "bootstrap/dist/css/bootstrap.min.css";
import { ProductCartProvider } from "@/hooks/useProductCart"; //商品購物車hooks
import { ProductCartSidebar } from "@/components/product-cart/ProductCartSidebar"; //商品購物車側邊欄
import { ToastContainerComponent } from "@/utils/toast";

// ===== 前台布局元件 =====
export default function FrontLayout({ children }) {
  // ===== 狀態管理 =====
  const { data: session, status } = useSession(); // 用戶登入狀態
  const router = useRouter(); // 路由導航
  const pathname = usePathname(); // 當前路徑
  const [isCartOpen, setIsCartOpen] = useState(false); // 購物車側邊欄開關
  const [isProductCartOpen, setIsProductCartOpen] = useState(false); // 商品購物車側邊欄開關
  const [firstLoading, setFirstLoading] = useState(true); // 首次載入狀態

  // ===== 用戶角色導向處理 =====
  useEffect(() => {
    // 只有在已登入且是特定角色時才進行導向
    if (status !== 'loading' && session?.user) {
      const { isOwner, isAdmin } = session.user;

      // 如果是擁有者，導向擁有者後台
      if (isOwner) {
        router.replace('/owner');
        return;
      }

      // 如果是管理員，導向管理員後台
      if (isAdmin) {
        router.replace('/admin');
        return;
      }
    }

    // 當登入狀態確認後，關閉首次載入狀態
    if (status !== 'loading') {
      setFirstLoading(false);
    }
  }, [session, status, router]);

  // ===== Bootstrap JS 動態引入 =====
  useEffect(() => {
    require('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  // ===== 滾動效果處理 =====
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('header');
      const header_logo = document.querySelector('.header-logo');
      const up_icon = document.querySelector('.up-icon');
      

      // 根據滾動位置添加或移除 active 類
      if (window.scrollY > 0) {
        header?.classList.add('active');
        header_logo?.classList.add('active');
        up_icon?.classList.add('active');
      } else {
        header?.classList.remove('active');
        header_logo?.classList.remove('active');
        up_icon?.classList.remove('active');
      }
    };

    // 監聽滾動事件
    window.addEventListener('scroll', handleScroll);
    // 初始化時執行一次，確保頁面刷新時狀態正確
    handleScroll();

    // 清理監聽器
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // ===== 載入中狀態處理 =====
  if (firstLoading && status === 'loading') {
    return <Loading isLoading={true} />;
  }

  // ===== 判斷是否為首頁 =====
  const isHomePage = pathname === '/';

  // ===== 渲染前台布局 =====
  return (
    <>
      <ProductCartProvider>
        <Header />
        <div
          className="pt-[100px] md:pt-[150px] min-h-screen"
          suppressHydrationWarning // 抑制 hydration 警告
        >
          {/* 購物車側邊欄 */}
          <CartSidebar
            isOpen={isCartOpen}
            setIsOpen={setIsCartOpen}
            zIndex={2000}
          />

          {/* 商品購物車側邊欄 */}
          <ProductCartSidebar
            isOpen={isProductCartOpen}
            setIsOpen={setIsProductCartOpen}
            zIndex={2000}
          />

          {/* 客服聊天圖標（僅對非管理員的登入用戶顯示） */}
          {(!session?.user?.isAdmin) && <ChatIcon />}

          {/* 頁面主要內容 */}
          {children}

          {/* 使用統一的 ToastContainer */}
          <ToastContainerComponent />
        </div>
        {/* <Footer /> */}
        <NewFooter />
        {isHomePage && <CouponIcon />}
        {/* 回到頂部按鈕（僅在首頁顯示） */}
        {isHomePage && <UpIcon />}
      </ProductCartProvider>
    </>
  );
}
