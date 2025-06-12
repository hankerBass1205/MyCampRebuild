export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">隱私權政策</h1>
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. 資料收集範圍</h2>
          <p>我們收集的個人資料包括：</p>
          <ul className="list-disc pl-6">
            <li>基本帳戶資訊（姓名、電子郵件）</li>
            <li>Google Calendar 授權資訊</li>
            <li>訂單和預訂資訊</li>
            <li>LINE 通知授權資訊</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. 使用目的</h2>
          <ul className="list-disc pl-6">
            <li>提供露營預訂服務</li>
            <li>處理訂單和付款</li>
            <li>發送訂單確認和提醒</li>
            <li>同步預訂資訊到您的 Google Calendar</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 第三方服務</h2>
          <p>我們使用以下第三方服務：</p>
          <ul className="list-disc pl-6">
            <li>Google 登入和 Calendar API</li>
            <li>LINE 通知服務</li>
            <li>LINE Pay 支付服務</li>
            <li>綠界金流服務</li>
          </ul>
        </section>
      </div>
    </div>
  );
} 