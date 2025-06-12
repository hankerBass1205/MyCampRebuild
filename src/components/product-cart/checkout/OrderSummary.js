import { formatPrice } from "@/utils/formatPrice";

export default function OrderSummary({
  deliveryMethod,
  subtotal,
  totalAmount,
  couponDiscount,
}) {
  let deliveryCharge;

  if (deliveryMethod === "7-11") {
    deliveryCharge = 60;
  } else if (deliveryMethod === "home_delivery") {
    deliveryCharge = 100;
  }

  return (
    <section className="order-product">
      <div className="container">
        <div className="main">
          <article className="title">
            <h3>訂單資訊</h3>
          </article>
          <article className="content">
            <div className="item-content">
              <div className="subtotal d-flex">
                <p>商品小計:</p>
                <p>NT${formatPrice(subtotal)}</p>
              </div>

              <article className="discount d-flex">
                <p>運費 :</p>
                <p>NT${deliveryCharge}</p>
              </article>
              {couponDiscount > 0 && (
                <div className="discount d-flex">
                  <p>你使用的優惠券折扣:</p>
                  <p className="text-danger">
                    - NT${formatPrice(couponDiscount)}
                  </p>
                </div>
              )}
            </div>
          </article>
          <hr />
          <article className="total">
            <p>總計</p>
            <p>NT${formatPrice(totalAmount)}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
