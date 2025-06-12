// ### 路由保護說明

// 1. 如果要新增需要登入才能訪問的頁面：
//    - 請在 `middleware.js` 的 `matcher` 中加入新路由
//    - 格式為：`'/your-path/:path*'`
//    - 例如：`'/camping/orders/:path*'`

// 2. 路由權限等級：
//    - `/admin/*` - 僅管理員可訪問
//    - `/owner/*` - 僅營地主可訪問
//    - `/camping/*` - 需要登入的一般功能

// 3. 注意事項：
//    - 新增路由時請確認權限需求
//    - 測試時請確認未登入時會重定向到登入頁
//    - 確認不同角色的訪問權限是否正確
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// 使用 withAuth 整合認證邏輯
export default withAuth(
  // middleware 函數在每個匹配的路由請求之前執行
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // 定義路由類型
    const isAdminRoute = path.startsWith('/admin');
    const isOwnerRoute = path.startsWith('/owner');
    const isAuthRoute = path.startsWith('/auth');
    const isApiRoute = path.startsWith('/api');

    // 允許 API 和登入相關路由
    if (isAuthRoute || isApiRoute) {
      return NextResponse.next();
    }

    // 確保 token 存在
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    // 管理員身份檢查
    if (token.isAdmin) {
      if (isAdminRoute) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    // 營主身份檢查
    if (token.isOwner) {
      if (isOwnerRoute) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/owner', req.url));
    }

    // 一般用戶身份檢查
    if (!token.isAdmin && !token.isOwner) {
      // 一般用戶不能訪問後台和營主後台
      if (isAdminRoute || isOwnerRoute) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  },
  {
    // 配置授權檢查邏輯
    callbacks: {
      authorized: ({ token, req }) => {
        // 確保 token 存在且有效
        if (!token) return false;
      
        const path = req?.nextUrl?.pathname;
        
        // API 和登入相關路由不需要額外檢查
        if (path?.startsWith('/api/') || path?.startsWith('/auth/')) {
          return true;
        }

        // 根據路徑和角色進行檢查，但不執行重定向
        // 讓主要的 middleware 函數處理重定向邏輯
        return true;
      }
    },
    // 設置登入頁面路徑
    pages: {
      signIn: '/auth/login',  // 未登入時重定向到此頁面
    }
  }
);

// 設置需要保護的路由，有前往以下路徑需要登入，否則重定向到登入頁
export const config = {
  matcher: [
    '/admin/:path*',     // 管理員路由
    '/owner/:path*',     // 營主路由
    // '/',  // 添加根路徑
  ]
};
