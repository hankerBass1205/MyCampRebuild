import { Ubuntu } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from '@/components/providers/Providers';

// 設定 Ubuntu 字體
const ubuntu = Ubuntu({ 
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-ubuntu',
  display: 'swap',
});

// 設定 Gen Jyuu Gothic 本地字體
const genJyuuGothic = localFont({
  src: [
    {
      path: '../../public/fonts/GenJyuuGothic-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/GenJyuuGothic-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/GenJyuuGothic-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-genjyuu'
});

export const metadata = {
  title: {
    default: "露營探索家 | 探索自然的美好",
    template: "%s | 露營探索家"
  },
  description: "露營探索家提供最完整的露營體驗與活動規劃，讓您輕鬆預訂營地、參與活動、分享經驗，打造難忘的露營回憶。",
  keywords: ["露營", "露營預訂", "營地查詢", "露營活動", "營地管理", "戶外活動"],
  authors: [{ name: "露營探索家團隊" }],
  openGraph: {
    title: "露營探索家 | 探索自然的美好",
    description: "露營探索家提供最完整的露營體驗與活動規劃，讓您輕鬆預訂營地、參與活動、分享經驗，打造難忘的露營回憶。",
    url: "https://your-domain.com",
    siteName: "露營探索家",
    locale: "zh_TW",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW" className={`${ubuntu.variable} ${genJyuuGothic.variable}`} suppressHydrationWarning>
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" 
        />
      </head>
      <body className="overflow-x-hidden min-w-[320px]" suppressHydrationWarning={true}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

