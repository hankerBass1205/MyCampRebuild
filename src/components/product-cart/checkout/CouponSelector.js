"use client";
import { useEffect, useState } from "react";
import { showCartAlert } from "@/utils/sweetalert";

export default function CouponSelector({
  subtotal = 0,
  selectedCoupon = null,
  setSelectedCoupon = () => {},
  setCouponDiscount = () => {},
}) {
  const [coupons, setCoupons] = useState([]); // ✅ 優惠券列表
  const [selectedCouponId, setSelectedCouponId] = useState(""); // ✅ 記錄選擇的 `id`

  // ✅ 獲取使用者優惠券
  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/get-coupon/usersCoupon");
      if (!res.ok) throw new Error("獲取優惠券失敗");

      const data = await res.json();
      setCoupons(data.coupons || []); // ✅ 避免 `undefined`
    } catch (error) {
      console.error("獲取優惠券失敗:", error);
    }
  };

  // ✅ 計算折扣
  const handleCouponDiscount = () => {
    if (!selectedCoupon) {
      setCouponDiscount(0);
      return;
    }

    if (subtotal >= selectedCoupon.min_purchase) {
      let discount;
      switch (selectedCoupon.discount) {
        case "fixed":
          discount = selectedCoupon.discount_value;
          setCouponDiscount(discount);
          break;
        case "percentage":
          discount = Math.floor(
            subtotal * (1 - selectedCoupon.discount_value / 100)
          );
          setCouponDiscount(
            discount < selectedCoupon.max_discount
              ? discount
              : selectedCoupon.max_discount
          );
          break;
        default:
          setCouponDiscount(0);
      }
    } else {
      showCartAlert.error(
        `優惠券最低消費滿 ${selectedCoupon.min_purchase} 才可使用`
      );
      // ✅ 回復預設狀態
      setSelectedCoupon(null);
      setCouponDiscount(0);
      setSelectedCouponId(""); // ✅ `select` 回到預設選項
    }
  };

  // ✅ 優惠券選擇處理
  const handleCouponChange = (event) => {
    const selectedId = event.target.value;
    setSelectedCouponId(selectedId); // ✅ 記錄 `select` 選擇值

    const coupon = coupons.find((c) => c.id.toString() === selectedId);
    setSelectedCoupon(coupon || null);
  };

  // ✅ 初始載入優惠券
  useEffect(() => {
    fetchCoupons();
  }, []);

  // ✅ 監聽 `selectedCoupon` 變化，自動計算折扣
  useEffect(() => {
    handleCouponDiscount();
  }, [selectedCoupon]);

  return (
    <section className="coupon">
      <div className="container">
        <div className="main">
          <article className="title">
            <h3>選擇優惠券</h3>
          </article>
          <article className="content mt-3">
            <p className="coupon-label">可使用的優惠券</p>
            <select
              className="coupon-select mt-3"
              value={selectedCouponId}
              onChange={handleCouponChange}
            >
              <option value="">請選擇優惠券</option>
              {coupons.length === 0 ? (
                <option value="" disabled>
                  無可用優惠券
                </option>
              ) : (
                coupons.map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.name}
                  </option>
                ))
              )}
            </select>
          </article>
        </div>
      </div>
    </section>
  );
}
