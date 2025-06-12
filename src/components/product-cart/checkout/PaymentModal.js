"use client";

import { Modal, Button } from "react-bootstrap";
import { useState } from "react";
import styles from "@/styles/pages/product-cart/order-confirmation/order-confirmation.module.css";

export default function PaymentModal({
  orderId,
  totalAmount,
  showModal,
  closeModal,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingECPay, setLoadingECPay] = useState(false);

  // ✅ 觸發 LINE Pay 付款流程
  const handleLinePay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/product-cart/linepay/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, amount: totalAmount }),
      });

      const data = await res.json();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl; // ✅ 跳轉到 LINE Pay 付款頁面
      } else {
        console.error("❌ LINE Pay 付款請求失敗:", data.error);
        alert("付款請求失敗，請稍後再試！");
      }
    } catch (error) {
      console.error("❌ LINE Pay 付款請求錯誤:", error);
      alert("付款發生錯誤，請稍後再試！");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 觸發 ECPay 付款流程
  const handleECPay = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/product-cart/ecpay/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (data.success && data.form) {
        // ✅ **將 Form 插入畫面並提交**
        const div = document.createElement("div");
        div.innerHTML = data.form;
        document.body.appendChild(div);
        document.getElementById("ecpayForm").submit();
      } else {
        console.error("❌ 付款請求失敗:", data.error);
        alert("付款請求失敗，請稍後再試！");
      }
    } catch (error) {
      console.error("❌ 付款請求錯誤:", error);
      alert("付款發生錯誤，請稍後再試！");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={showModal}
      onHide={closeModal}
      centered
      className={styles.modalContainer}
    >
      <Modal.Header closeButton className={styles.paymentModalHeader}>
        <Modal.Title>選擇付款方式</Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.modalBody}>
        <div className={`mt-4 ${styles.buttonGroup}`}>
          <Button
            variant="success"
            onClick={handleLinePay}
            disabled={loading}
            className={styles.linePayBtn}
          >
            {loading ? "請稍候..." : "使用 LINE Pay"}
          </Button>
          <Button
            onClick={handleECPay}
            disabled={loadingECPay}
            className={styles.ecpayBtn}
          >
            {loadingECPay ? "請稍候..." : "信用卡付款"}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
