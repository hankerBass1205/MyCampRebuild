import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function CustomerInfoForm({
  customerInfo, // 父層傳進來的客戶資訊狀態
  onChange, // 父層傳進來的更新函式 (例如 setCustomerInfo)
  shippingAddress, // 運送地址 (若使用 7-11, 自動帶入)
  deliveryMethod,
  setCustomerInfo, // 父層的 setState，用於其它更新
}) {
  // 用來儲存錯誤訊息
  const [errors, setErrors] = useState({
    phone: "",
    email: "",
  });

  // 取得目前的 Session
  const { data: session } = useSession();

  // 當 shippingAddress 改變時，帶入 address
  useEffect(() => {
    if (shippingAddress) {
      setCustomerInfo((prev) => ({
        ...prev,
        address: shippingAddress,
      }));
    }
  }, [shippingAddress, setCustomerInfo]);

  // 「使用會員資料」Checkbox 切換時
  const handleAutoInfo = (event) => {
    if (event.target.checked && session) {
      // 若勾選且有 session => 帶入使用者資料
      if (deliveryMethod === "7-11") {
        setCustomerInfo((prev) => ({
          ...prev,
          name: session?.user?.name || "",
          email: session?.user?.email || "",
          phone: session?.user?.phone || "",
        }));
      } else {
        setCustomerInfo((prev) => ({
          ...prev,
          name: session?.user?.name || "",
          email: session?.user?.email || "",
          phone: session?.user?.phone || "",
          address: session?.user?.address || "",
        }));
      }
    } else {
      // 取消勾選 => 看需求是否要清空
      if (deliveryMethod === "7-11") {
        setCustomerInfo((prev) => ({
          ...prev,
          name: "",
          email: "",
          phone: "",
        }));
      } else {
        setCustomerInfo((prev) => ({
          ...prev,
          name: "",
          email: "",
          phone: "",
          address: "",
        }));
      }
    }
  };

  // 在失焦時進行驗證
  const handleBlur = (e) => {
    const { name, value } = e.target;

    // 驗證手機：09 開頭，共 10 碼
    if (name === "phone") {
      const phonePattern = /^09\d{8}$/;
      if (!phonePattern.test(value)) {
        setErrors((prev) => ({
          ...prev,
          phone: "手機號碼須以 09 開頭，共 10 碼",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
    }

    // 驗證 Email: 包含 "@" 與 ".com"
    if (name === "email") {
      if (!value.includes("@") || !value.includes(".com")) {
        setErrors((prev) => ({
          ...prev,
          email: "請輸入有效的信箱（需包含 @ 和 .com）",
        }));
      } else {
        setErrors((prev) => ({ ...prev, email: "" }));
      }
    }
  };

  return (
    <section className="customer-information">
      <div className="container">
        <div className="main">
          {/* 訂購資料標題 */}
          <article className="title">
            <h3>訂購資料</h3>
          </article>

          {/* 右側 Checkbox：使用會員資料 */}
          <div className="mt-3 ms-3 form-check d-flex justify-content-start">
            <input
              type="checkbox"
              className="form-check-input"
              id="autoFill"
              onChange={handleAutoInfo}
            />
            <label className="form-check-label ms-2" htmlFor="autoFill">
              使用會員資料
            </label>
          </div>

          <article className="content">
            <div className="item-content">
              {/* 收件人名稱 */}
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  收件人名稱:
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  name="name"
                  value={customerInfo.name}
                  onChange={onChange}
                  onBlur={handleBlur} // 若需要在失焦時驗證，也可做
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  電子信箱:
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={onChange}
                  onBlur={handleBlur} // 失焦檢查
                />
                {/* 錯誤訊息 */}
                {errors.email && (
                  <small style={{ color: "red" }}>{errors.email}</small>
                )}
              </div>

              {/* 手機 */}
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">
                  電話號碼:
                </label>
                <input
                  type="tel"
                  className="form-control"
                  id="phone"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={onChange}
                  onBlur={handleBlur} // 失焦檢查
                />
                {/* 錯誤訊息 */}
                {errors.phone && (
                  <small style={{ color: "red" }}>{errors.phone}</small>
                )}
              </div>

              {/* 地址 */}
              <div className="mb-3">
                <label htmlFor="address" className="form-label">
                  寄送地址:
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="address"
                  name="address"
                  value={customerInfo.address}
                  onChange={onChange}
                  onBlur={handleBlur} // 可加可不加，看是否要驗證
                />
              </div>

              {/* 備註 */}
              <div className="mb-3">
                <label htmlFor="textarea" className="form-label">
                  備註:
                </label>
                <textarea
                  className="form-control"
                  id="textarea"
                  name="note"
                  rows={3}
                  value={customerInfo.note}
                  onChange={onChange}
                  // 是否要在失焦時驗證看需求
                  onBlur={handleBlur}
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
