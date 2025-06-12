"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProductCart } from "@/hooks/useProductCart";

// 子元件
import OrderSteps from "@/components/product-cart/checkout/OrderSteps";
import CartProducts from "@/components/product-cart/checkout/CartProducts";
import DeliveryOptions from "@/components/product-cart/checkout/DeliveryOptions";
import PaymentOptions from "@/components/product-cart/checkout/PaymentOptions";
import OrderSummary from "@/components/product-cart/checkout/OrderSummary";
import CustomerInfoForm from "@/components/product-cart/checkout/CustomerInfoForm";
import CouponSelector from "@/components/product-cart/checkout/CouponSelector";
import { showCartAlert } from "@/utils/sweetalert";

// 樣式
import "@/styles/pages/product-cart/fill-cart/style.css";
import { set } from "date-fns";

export default function FillCart() {
  const router = useRouter();
  const { cart, fetchCart, setProductCartCount } = useProductCart();
  if (cart.length === 0) {
    fetchCart();
  }

  const [deliveryMethod, setDeliveryMethod] = useState("home_delivery"); // 配送方式
  const [paymentMethod, setPaymentMethod] = useState("credit_card"); // 付款方式
  const [shippingAddress, setShippingAddress] = useState(""); // ✨ 7-11 門市地址狀態
  const [couponDiscount, setCouponDiscount] = useState(0); //優惠卷折扣金額
  const [selectedCoupon, setSelectedCoupon] = useState(null); // ✅ 新增，記錄被選擇的優惠券
  const [totalAmount, setTotalAmount] = useState(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    note: "",
  });

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeliveryChange = (method) => {
    setDeliveryMethod(method);

    // ✨ 當選擇 7-11 時，將 `shippingAddress` 設為 `customerInfo.address`
    if (method === "7-11" && shippingAddress) {
      setCustomerInfo((prev) => ({
        ...prev,
        address: shippingAddress,
      }));
    }

    // ✨ 當切換回宅配時，讓用戶能夠手動輸入地址
    if (method === "home_delivery") {
      setCustomerInfo((prev) => ({
        ...prev,
        address: "",
      }));
    }
  };

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product_price * item.quantity,
    0
  );

  useEffect(() => {
    let total = subtotal;
    if (deliveryMethod === "7-11") {
      total += 60;
    } else if (deliveryMethod === "home_delivery") {
      total += 100;
    }

    if (couponDiscount > 0) {
      total -= couponDiscount;
    }
    setTotalAmount(total);
  }, [subtotal, deliveryMethod, couponDiscount]); // ✅ 依賴 `subtotal` & `deliveryMethod`

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    // ✅ 檢查必填欄位 (備註 `note` 不檢查)
    const requiredFields = ["name", "email", "phone", "address"];
    const emptyFields = requiredFields.filter((field) => !customerInfo[field]);

    if (emptyFields.length > 0) {
      showCartAlert.error("請填寫完整訂購資訊！");
      return; // 🚫 停止提交
    }

    const payload = {
      cartItems: cart,
      deliveryMethod,
      paymentMethod,
      customerInfo,
      totalAmount,
      selectedCoupon,
      couponDiscount,
    };

    try {
      const res = await fetch("/api/product-cart/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("下單失敗，請稍後再試");
      }

      const data = await res.json();
      if (!data.success || !data.orderId) {
        throw new Error("無法獲取訂單 ID，請稍後再試");
      }

      setProductCartCount(0);
      router.push(`/product-cart/order-confirmation/${data.orderId}`);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <main className="fill-cart">
      <form onSubmit={handleSubmitOrder}>
        <OrderSteps />
        <CartProducts cart={cart} subtotal={subtotal} />

        <div className="container">
          <div className="row">
            {/* ✨ 寄送方式 */}
            <div className="col-md-6">
              <DeliveryOptions
                deliveryMethod={deliveryMethod}
                onChangeAddress={setShippingAddress}
                onChange={handleDeliveryChange}
              />
            </div>

            {/* ✨ 付款方式 */}
            <div className="col-md-6">
              <PaymentOptions
                paymentMethod={paymentMethod}
                onChange={handlePaymentChange}
              />
            </div>
          </div>
        </div>

        {/* ✨ 優惠券 */}
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <CouponSelector
                subtotal={subtotal}
                setCouponDiscount={setCouponDiscount}
                selectedCoupon={selectedCoupon}
                setSelectedCoupon={setSelectedCoupon} // 當前優惠卷狀態移致此層
              />
            </div>
            {/* 訂單摘要 */}
            <div className="col-md-6">
              <OrderSummary
                deliveryMethod={deliveryMethod}
                subtotal={subtotal}
                totalAmount={totalAmount}
                couponDiscount={couponDiscount}
              />
            </div>
          </div>
        </div>

        {/* ✨ 傳遞 `setCustomerInfo`，確保 7-11 地址同步更新 */}
        <CustomerInfoForm
          customerInfo={customerInfo}
          setCustomerInfo={setCustomerInfo}
          shippingAddress={shippingAddress}
          onChange={handleCustomerInfoChange}
          deliveryMethod={deliveryMethod}
        />

        <button type="submit" className="submit">
          送出訂單
        </button>
      </form>
    </main>
  );
}
