import { formatPrice } from "@/utils/formatPrice";

// Component: CartProducts.jsx
export default function CartProducts({ cart, subtotal }) {
  // console.log({ cart });

  return (
    <section className="cart-product">
      <div className="container">
        <div className="main">
          <article className="title">
            <h3>購物車</h3>
          </article>
          <article className="content">
            <div className="header">
              <p>商品資料</p>
              <p className="text-center">單價</p>
              <p className="text-center">數量</p>
              <p className="text-center">小計</p>
            </div>
            <hr />
            <div className="item-content">
              {/* Render each cart item */}
              {cart.map((item, index) => (
                <div className="item" key={index}>
                  <div className="name-pic item-style">
                    <div className="image">
                      <img
                        src={`/images/products/${item.product_image}`}
                        alt=""
                      />
                    </div>
                    <p className="name">{item.product_name}</p>
                  </div>

                  <div className="quantity item-style">
                    <p className="mobileLabel">商品單價：</p>
                    <p className="text-center">
                      NT${formatPrice(item.product_price)}
                    </p>
                  </div>
                  <div className="quantity item-style">
                    <p className="mobileLabel">數量：</p>
                    <p className="text-center">{item.quantity}</p>
                  </div>
                  <div className="subtotal item-style">
                    <p className="mobileLabel">單筆小計：</p>
                    <p className="text-center">
                      NT${formatPrice(item.product_price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Add more items dynamically later */}
            </div>
          </article>
          <hr />
          <article className="total">
            <p>總計 :</p>
            {/* Render the total amount */}

            <p>NT${formatPrice(subtotal)}</p>
          </article>
        </div>
      </div>
    </section>
  );
}
