"use client";

import "@/styles/pages/product-cart/order-confirmation/style.css";

export default function OrderConfirmation() {
  return (
    <>
      <main className="order-confirmation">
        <section className="order">
          <div className="container">
            <article className="order-item">
              <ul>
                <li className="item active">
                  <div className="num">1</div>
                  <p>購物車</p>
                </li>
                <div className="line active" />
                <li className="item active">
                  <div className="num">2</div>
                  <p>填寫訂單</p>
                </li>
                <div className="line active" />
                <li className="item active">
                  <div className="num">3</div>
                  <p>訂單確認</p>
                </li>
              </ul>
            </article>
          </div>
        </section>
        <section className="completed">
          <div className="container">
            <img src="/images/product-cart/completed.png" />
            <h2>結帳成功</h2>
          </div>
        </section>
        <button className="submit">
          <a href="order-confirmation.html">回到商品頁</a>
        </button>
      </main>
    </>
  );
}
