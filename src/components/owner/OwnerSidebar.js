'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  HiOutlineChartBar,
  HiOutlineClipboardCheck,
  HiOutlineHome,
  HiOutlineLocationMarker,
  HiOutlineCalendar,
  HiOutlineShoppingCart,
  HiOutlineChatAlt
} from 'react-icons/hi';

export default function OwnerSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { 
      href: '/owner', 
      label: '數據中心', 
      icon: <HiOutlineChartBar className="w-6 h-6" />
    },
    { 
      href: '/owner/campApply', 
      label: '營地申請', 
      icon: <HiOutlineClipboardCheck className="w-6 h-6" />
    },
    { 
      href: '/owner/campStatus', 
      label: '營地狀態', 
      icon: <HiOutlineHome className="w-6 h-6" />
    },
    { 
      href: '/owner/camp-sites', 
      label: '營位管理', 
      icon: <HiOutlineLocationMarker className="w-6 h-6" />
    },
    { 
      href: '/owner/activities', 
      label: '活動管理', 
      icon: <HiOutlineCalendar className="w-6 h-6" />
    },
    { 
      href: '/owner/bookings', 
      label: '訂單管理', 
      icon: <HiOutlineShoppingCart className="w-6 h-6" />
    },
    { 
      href: '/owner/messages', 
      label: '訊息中心', 
      icon: <HiOutlineChatAlt className="w-6 h-6" />
    }
  ];

  return (
    <aside className="w-64 bg-[#6B8E7B] min-h-screen h-full sticky top-0 shadow-lg font-['Noto_Sans_TC'] flex flex-col">
      <div className="px-6 py-8 border-b border-[#86A497]/30 flex-shrink-0">
        <div className="group cursor-pointer">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <Image
                src="/logo.png"
                alt="Camping KPI"
                fill
                sizes="(max-width: 768px) 120px, 150px"
                className="object-contain transition-all duration-300 
                         group-hover:brightness-110 animate-float"
                priority
              />
              <div className="absolute inset-0 bg-white/10 rounded-full blur-xl
                            animate-pulse-slow opacity-0 group-hover:opacity-100
                            transition-opacity duration-300" />
            </div>

            <div className="text-center space-y-1.5">
              <h1 className="text-xl font-semibold text-white tracking-wide
                           font-['PingFang_TC'] transition-all duration-300
                           group-hover:text-[#E8F1ED]">
                營主後台
              </h1>
              <p className="text-sm text-[#E8F1ED]/70 uppercase tracking-[0.2em]
                          transition-all duration-300 group-hover:tracking-[0.25em]">
                CAMP EXPLORER
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-3">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`
              group flex items-center px-4 py-3.5 text-base font-medium rounded-lg
              transition-all duration-200
              ${pathname === item.href 
                ? 'bg-[#A8C2B5] text-[#2C4A3B] shadow-md' 
                : 'text-[#E8F1ED] hover:bg-[#7FA192]/90 hover:text-white'}
            `}
          >
            <span className="mr-4 transition-transform duration-200 group-hover:scale-110">
              {item.icon}
            </span>
            <span className="tracking-wide text-[16px]">
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
} 