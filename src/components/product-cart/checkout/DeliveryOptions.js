import { useState, useEffect, useRef } from "react";
import { useShip711StoreOpener } from "@/hooks/useShip711StoreOpener";

export default function DeliveryOptions({
  deliveryMethod,
  onChange,
  onChangeAddress,
}) {
  const { openWindow } = useShip711StoreOpener(
    "http://localhost:3000/api/product-cart/711location"
  );

  const [selectedStore, setSelectedStore] = useState(null);
  const isMounted = useRef(false); // 追蹤組件是否掛載

  useEffect(() => {
    isMounted.current = true;

    const handleMessage = (event) => {
      // console.log("📩 收到 7-11 API 回傳的門市資料", event);
      if (event.origin !== "http://localhost:3000") return;

      try {
        const storeData =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (storeData?.storeid && isMounted.current) {
          // console.log("✅ 更新選擇的門市:", storeData);
          setSelectedStore(storeData);
          onChange("7-11");

          // ✅ **更新父組件的地址輸入框**
          onChangeAddress(
            `寄送到7-11: ${storeData.storename} ${storeData.storeaddress}`
          );
        }
      } catch (error) {
        console.error("❌ 解析 7-11 門市資料錯誤:", error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      isMounted.current = false;
      window.removeEventListener("message", handleMessage);
    };
  }, [onChange, onChangeAddress]);

  return (
    <section className="d-p">
      <div className="container">
        <article className="delivery">
          <div className="main">
            <article className="title">
              <h3>宅配方式</h3>
            </article>

            <article className="content">
              <div className="item-content">
                {/* 7-11 運送選項 */}
                <div className="form-check label-mt">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="deliveryMethod"
                    id="delivery1"
                    value={"7-11"}
                    checked={deliveryMethod === "7-11"}
                    onChange={() => onChange("7-11")}
                  />
                  <label className="form-check-label w-100" htmlFor="delivery1">
                    <div className="d-flex justify-content-between">
                      <p>
                        7-11 付款
                        <br />
                        <button type="button" onClick={openWindow}>
                          選擇門市
                        </button>
                      </p>
                      <p>NT$60</p>
                    </div>
                  </label>

                  {/* ✅ 顯示選擇的門市資訊 */}
                  {deliveryMethod === "7-11" && (
                    <div className="store-info mt-3 p-2 border rounded">
                      {selectedStore ? (
                        <>
                          <p>
                            <strong>門市名稱:</strong> {selectedStore.storename}
                          </p>
                          <p>
                            <strong>門市地址:</strong>{" "}
                            {selectedStore.storeaddress}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted">請選擇門市</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 宅配到府選項 */}
                <div className="form-check label-mt">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="deliveryMethod"
                    id="delivery2"
                    value={"home_delivery"}
                    checked={deliveryMethod === "home_delivery"}
                    onChange={() => {
                      onChange("home_delivery");
                      setSelectedStore(null); // ✅ 切換宅配時，清除 7-11 門市資料
                      onChangeAddress(""); // ✅ 清除地址
                    }}
                  />
                  <label className="form-check-label w-100" htmlFor="delivery2">
                    <div className="d-flex justify-content-between">
                      <p>宅配到府</p>
                      <p>NT$100</p>
                    </div>
                  </label>
                </div>
              </div>
            </article>
          </div>
        </article>
      </div>
    </section>
  );
}
