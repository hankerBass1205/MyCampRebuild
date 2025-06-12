export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">服務條款</h1>
      <div className="prose max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. 服務說明</h2>
          <p>本平台提供露營場地預訂服務，包括：</p>
          <ul className="list-disc pl-6">
            <li>露營場地查詢和預訂</li>
            <li>線上支付功能</li>
            <li>訂單管理系統</li>
            <li>通知服務</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. 使用規範</h2>
          <ul className="list-disc pl-6">
            <li>用戶需要提供真實資訊</li>
            <li>遵守預訂和取消政策</li>
            <li>不得進行惡意預訂或騷擾行為</li>
            <li>遵守營地現場規則</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. 支付條款</h2>
          <p>我們支援以下支付方式：</p>
          <ul className="list-disc pl-6">
            <li>信用卡支付（透過綠界金流）</li>
            <li>LINE Pay</li>
          </ul>
        </section>
      </div>
    </div>
  );
}