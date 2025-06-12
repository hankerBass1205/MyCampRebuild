'use client';
import Link from 'next/link';
import { HomeIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Breadcrumb({ items, className = '' }) {
  return (
    <nav 
      className="w-full bg-transparent px-4 sm:px-6 lg:px-8"
      aria-label="麵包屑導航"
    >
      <div className={`max-w-[1440px] mx-auto ${className}`}>
        <ol className="flex items-center h-[30px] sm:h-[52px] text-sm text-gray-400 gap-1 px-4 sm:px-6 lg:px-8 m-0">
          {/* 首頁 */}
          <li className="flex items-center">
            <Link 
              href="/"
              className="flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HomeIcon className="w-3.5 h-3.5" />
            </Link>
          </li>

          {/* 動態項目 */}
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRightIcon className="w-3 h-3 mx-1 text-gray-300 flex-shrink-0" />
              {item.href ? (
                <Link 
                  href={item.href}
                  className="text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap no-underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-500 whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
} 