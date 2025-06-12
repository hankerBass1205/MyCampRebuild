"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      href: "/admin/camping/review",
      label: "審核管理",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      )
    },
    // {
    //   href: "/admin/camping/list",
    //   label: "營區管理",
    //   icon: (
    //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    //     </svg>
    //   )
    // },
    {
      href: "/admin/camping/categories",
      label: "商品類別管理",
      icon: "📁",
    },
    {
      href: "/admin/camping/products",
      label: "商品管理",
      icon: "📦",
    },
    {
      href: "/admin/camping/orders",
      label: "商品訂單管理",
      icon: "📝",
    },
    {
      href: "/admin/camping/users",
      label: "使用者管理",
      icon: "👥",
    },
    {
      href: "/admin/coupons",
      label: "優惠券管理",
      icon: "🎫",
    },
    {
      href: "/admin/camping/articles",
      label: "官方文章管理",
      icon: "📰",
    },
    {
      href: "/admin/messages",
      label: "客服訊息管理",
      icon: "💬",
    },
    {
      href: "/admin/notifications",
      label: "通知管理",
      icon: "🔔",
    },
    {
      href: "/admin/logout",
      label: "登出系統",
      icon: "🚪",
    },
  ];

  return (
    <motion.aside 
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-64 bg-white shadow-lg h-screen flex flex-col"
    >
      {/* 左上角標題區 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-4 px-3 border-b border-[#E8E4DE] bg-[#FAFAFA]"
      >
        <Link href="/admin/dashboard" className="group block no-underline">
          <div className="flex items-center gap-3 ms-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-[#8B7355] rounded-lg flex items-center justify-center shadow-md"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </motion.div>
            <div>
              <h2 className="text-[#8B7355] font-semibold text-lg mb-0">露營管理平台</h2>
              <p className="text-[#9B8C7D] text-xs mb-0">Admin Dashboard</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* 選單區域 */}
      <nav className="flex-1 py-4 overflow-y-auto bg-[#FAFAFA]">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group relative flex items-center mx-3 px-4 py-3 text-sm font-medium
                rounded-lg transition-all duration-200 ease-in-out no-underline
                ${
                  pathname === item.href
                    ? "text-white bg-[#8B7355] shadow-sm"
                    : "text-[#7C6B5A] hover:bg-[#F5F3F0] hover:text-[#8B7355]"
                }
              `}
            >
              <span className={`
                mr-3 flex items-center justify-center w-5 h-5
                ${pathname === item.href ? 'text-white' : 'text-[#7C6B5A]'}
              `}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      
      {/* 底部資訊 */}
      <div className="px-5 py-4 border-t border-[#E8E4DE] bg-[#FAFAFA]">
        <div className="text-xs text-[#7C6B5A] text-center">
          © 2024 露營平台
        </div>
      </div>
    </motion.aside>
  );
}
