"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PaymentModal from "@/components/product-cart/checkout/PaymentModal";
import styles from "@/styles/pages/product-cart/order-confirmation/order-confirmation.module.css";
import { showCartAlert } from "@/utils/sweetalert";
import { formatPrice } from "@/utils/formatPrice";

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    async function fetchOrder() {
      try {
        setLoading(true);
        const data = await fetchOrderDetails(orderId);
        setOrder(data);
      } catch (err) {
        setError(err.message);
        if (err.status === 403) {
          router.push("/member/purchase-history");
        } else if (err.status === 401) {
          router.push("/login");
        } else {
          console.error("取得訂單資訊錯誤:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <main className={styles.orderConfirmation}>
        <div className={styles.container}>
          <p className={styles.textCenter}>載入中...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.orderConfirmation}>
        <div className={styles.container}>
          <h2 className={styles.textCenter}>錯誤</h2>
          <p className={styles.textCenter}>{error}</p>
          {showCartAlert.error("這不是你的訂單！")}
        </div>
      </main>
    );
  }

  const showPaymentButton =
    order?.payment_status === 0 && order?.payment_method === "credit_card";

  async function fetchOrderDetails(orderId) {
    const res = await fetch(`/api/product-cart/orders/${orderId}`);
    if (!res.ok) {
      const errorData = await res.json();
      const error = new Error(errorData.error || "訂單資訊獲取失敗");
      error.status = res.status;
      throw error;
    }
    return await res.json();
  }

  return (
    <main className={styles.orderConfirmation}>
      <section className={styles.order}>
        <div className={styles.container}>
          <article className={styles.orderItem}>
            <ul>
              <li className={`${styles.item} ${styles.active}`}>
                <div className={styles.num}>1</div>
                <p>購物車</p>
              </li>
              <div className={`${styles.line} ${styles.active}`} />
              <li className={`${styles.item} ${styles.active}`}>
                <div className={styles.num}>2</div>
                <p>填寫訂單</p>
              </li>
              <div className={`${styles.line} ${styles.active}`} />
              <li className={`${styles.item} ${styles.active}`}>
                <div className={styles.num}>3</div>
                <p>訂單確認</p>
              </li>
            </ul>
          </article>
        </div>
      </section>
      <div className={styles.container}>
        <img
          src="/images/product-cart/completed.png"
          className={`d-flex mx-auto mb-5 mt-3 ${styles.okImg}`}
        />

        <h2 className={`${styles.textCenter} ${styles.orderTitleStyle}`}>
          訂單已完成
        </h2>
        <p className={`${styles.textCenter} ${styles.orderConfirP}`}>
          感謝您的訂購！您的訂單詳細資訊如下：
        </p>

        <section className={styles.orderInfo}>
          <div className={styles.orderTitleStyle}>收件人資料</div>
          <div className="p-4">
            <div className={styles.orderDetails}>
              <p className={`${styles.orderConfirP}`}>
                <strong>訂單編號：</strong> {order.order_id}
              </p>
              <p className={`${styles.orderConfirP}`}>
                <strong>訂單總額：</strong> NT${" "}
                {formatPrice(order.total_amount)}
              </p>
              <p className={`${styles.orderConfirP}`}>
                <strong>付款方式：</strong>{" "}
                {order.payment_method === "credit_card"
                  ? "信用卡付款"
                  : order.payment_method === "cod"
                  ? "貨到付款"
                  : "其他"}
              </p>
              <p className={`${styles.orderConfirP}`}>
                <strong>配送方式：</strong>{" "}
                {order.delivery_method === "home_delivery" ? (
                  <>
                    宅配到府
                    <span className={`ms-2 ${styles.couponNote}`}>
                      (運費 $100)
                    </span>
                  </>
                ) : order.delivery_method === "7-11" ? (
                  <>
                    寄送到 7-11
                    <span className={`ms-2 ${styles.couponNote}`}>
                      (運費 $60)
                    </span>
                  </>
                ) : (
                  "其他"
                )}
              </p>
              {order.used_coupon && (
                <p className={`${styles.orderConfirP}`}>
                  <strong>使用優惠卷: </strong>
                  {order.used_coupon}
                  <span className={`ms-2 ${styles.couponNote}`}>
                    (訂單金額已折抵)
                  </span>
                </p>
              )}
            </div>
            <div className={styles.recipientInfo}>
              <p className={`${styles.orderConfirP}`}>
                <strong>收件姓名：</strong> {order.recipient_name}
              </p>
              <p className={`${styles.orderConfirP}`}>
                <strong>聯絡電話：</strong> {order.recipient_phone}
              </p>
              <p className={`${styles.orderConfirP}`}>
                <strong>配送地址：</strong> {order.shipping_address}
              </p>
              <p className={`${styles.orderConfirP}`}>
                <strong>備註：</strong> {order.note || "無"}
              </p>
              <p className={`${styles.orderConfirP}`}>
                <strong>付款狀態：</strong>{" "}
                <span
                  className={
                    order.payment_status === 0
                      ? styles.paymentUnpaid
                      : styles.paymentPaid
                  }
                >
                  {order.payment_status === 0 ? "未付款" : "已付款"}
                </span>
              </p>
            </div>
          </div>
        </section>

        <section className={styles.orderItems}>
          <h3 className={`${styles.orderTitleStyle} mb-3`}>訂購商品</h3>
          <div className="p-4">
            <div className={styles.itemsList}>
              {order.items?.map((item) => (
                <div key={item.product_id} className={styles.item}>
                  <Link
                    href={`/products/${item.product_id}`}
                    className={styles.link}
                  >
                    <img
                      src={`/images/products/${item.product_image}`}
                      alt={item.product_name}
                      className={styles.itemImage}
                    />
                  </Link>
                  <div className={styles.itemInfo}>
                    <Link
                      href={`/products/${item.product_id}`}
                      className={styles.link}
                    >
                      <p
                        className={`${styles.itemName} ${styles.orderConfirP} ${styles.textCenter}`}
                      >
                        {item.product_name}
                      </p>
                    </Link>
                    <p
                      className={`${styles.orderConfirP} ${styles.textCenter}`}
                    >
                      數量：{item.quantity}
                    </p>
                    <p
                      className={`${styles.orderConfirP} ${styles.textCenter}`}
                    >
                      單價$ {formatPrice(item.product_price)}
                    </p>
                    <p
                      className={`${styles.orderConfirP} ${styles.textCenter}`}
                    >
                      小計：NT${" "}
                      {formatPrice(item.product_price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className={styles.textCenter}>
          {showPaymentButton ? (
            <button
              className={`${styles.btnGoToPayment} mt-3`}
              onClick={() => setShowModal(true)}
            >
              前往結帳
            </button>
          ) : (
            <Link href="/member/purchase-history">
              <button className={`${styles.btnGoToPayment} mt-3`}>
                回到訂單列表
              </button>
            </Link>
          )}
        </div>

        <PaymentModal
          orderId={order.order_id}
          totalAmount={order.total_amount}
          showModal={showModal}
          closeModal={() => setShowModal(false)}
        />
      </div>
    </main>
  );
}
