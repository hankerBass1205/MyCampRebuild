"use client";
import "@/styles/pages/finish/style.css"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Finish() {
  const { orderId } = useParams(); // ✅ 確保這裡是 orderId
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    console.log("📢 訂單 ID:", orderId); // 確保抓到正確的 orderId

    fetch(`/api/products-lease/order/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("🎯 訂單數據:", data);
        setOrder(data);
      })
      .catch((error) => {
        console.error("❌ 獲取訂單時出錯:", error);
      })
      .finally(() => setLoading(false));
  }, [orderId]);
  console.log("📢 訂單 ID:", order); // 確保抓到正確的 orderId

  if (loading) return <p>Loading...</p>;
  if (!order) return <p>找不到訂單資訊</p>;

  return (
    <>
      <div className="finish">
        <section className="completed">
          <div className="container">
            <img src="/images/product-cart/completed.png" />
            <h2>租借成功</h2>
            <p className="danger">租接領取時間保留10分鐘 超過視為取消</p>
            <p className="danger">取件請出示訂單標號後3碼</p>
            <div className="main">
              <article className="title">
                <h3>顧客資料</h3>
              </article>
              <article className="content">
                <div className="item-content">
                  <div className="mb-3">
                    <p className="id"><span className="title">訂單號:</span> {order[0].order_id}</p>
                  </div>
                  <div className="mb-3">
                    <p className="product"><span className="title">產品:</span>{order[0].product_id}</p>
                  </div>
                  <div className="mb-3">
                    <p className="price"><span className="title">價錢:</span>{order[0].price}</p>
                  </div>
                  <div className="mb-3">
                    <p>
                    <span className="title">租借日期:</span>
                      <span className="start">
                        {order[0].appointment_starts
                          .replace("T", " ")
                          .replace("Z", "")
                          .replace(".000", "")}{" "}
                      </span>
                      &nbsp;
                      -
                      &nbsp;
                      <span className="end">
                        {order[0].appointment_end
                          .replace("T", " ")
                          .replace("Z", "")
                          .replace(".000", "")}{" "}
                      </span>
                    </p>
                  </div>
                  <div className="mb-3">
                    <p className="name"><span className="title">客戶名稱:</span>{order[0].name}</p>
                  </div>
                  <div className="mb-3">
                    <p className="telephone"><span className="title">客戶電話:</span>{order[0].telephone}</p>
                  </div>
                  <div className="mb-3">
                    <p className="address"><span className="title">客戶地址:</span>{order[0].address}</p>
                  </div>
                  <div className="mb-3">
                    <p className="email"><span className="title">客戶信箱:</span>{order[0].email}</p>
                  </div>
                  <div className="mb-3">
                    <p className="notes"><span className="title">客戶備註:</span>{order[0].notes || "無"}</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
        <button className="submit">
          <Link href="/products-lease">回到商品頁</Link>
          {/* <a className="d-flex m-auto btn-add-cart" href="order-confirmation.html">回到商品頁</a> */}
        </button>
      </div>
    </>
  );
}
