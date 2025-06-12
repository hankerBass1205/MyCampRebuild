// Component: OrderSteps.jsx
export default function OrderSteps() {
  return (
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
            <div className="line" />
            <li className="item">
              <div className="num">3</div>
              <p>訂單確認</p>
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
}
