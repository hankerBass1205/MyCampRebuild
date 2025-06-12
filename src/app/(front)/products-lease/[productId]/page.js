"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import '@/styles/pages/lease-product/style.css'


// ===== 日期處理工具引入 =====
import locale from "antd/locale/zh_TW";                     // 引入 Ant Design 繁體中文語言包
import { DatePicker, ConfigProvider } from "antd";          // 引入 Ant Design 日期選擇器和全局配置
import dayjs from "dayjs";                                  // 引入日期處理工具
import "dayjs/locale/zh-tw";                               // 引入 dayjs 繁體中文語言包

import "../styles/detail.css";
import ComponentsImageSwiper from "../../../../components/products-lease/imageSwiper";
import { showCartAlert } from "@/utils/sweetalert"; // 老大做好的 SweetAlert


// ===== 組件常量定義 =====
const { RangePicker } = DatePicker;  


export default function ProductDetail() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  

  //數量狀態
  const [quantity, setQuantity] = useState(1);

   // 設定日期限制
    const today = dayjs().startOf("day");
    const maxDate = dayjs().add(1, "year"); // 最多可以搜尋一年內的活動
    const maxRangeDays = 90;

  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    dateRange: [
      searchParams.get("startDate")
        ? dayjs(searchParams.get("startDate"))
        : null,
      searchParams.get("endDate") ? dayjs(searchParams.get("endDate")) : null,
    ],
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });

  
  // 當 URL 參數改變時更新表單
  useEffect(() => {
    setFilters({
      keyword: searchParams.get("keyword") || "",
      dateRange: [
        searchParams.get("startDate")
          ? dayjs(searchParams.get("startDate"))
          : null,
        searchParams.get("endDate") ? dayjs(searchParams.get("endDate")) : null,
      ],
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
    });
  }, [searchParams]);

  const [days, setDays] = useState(1);

  

  // 處理日期變更
  const handleDateChange = (dates) => {
    if (!dates || dates.length !== 2) {
      setFilters((prev) => ({ ...prev, dateRange: [null, null] }));
      setDays(1);
      return;
    }

    const [start, end] = dates;

    // 驗證日期範圍
    if (start && end) {
      const dayCount = end.diff(start, "days") + 1; // 计算天数（包含起始日）

      if (dayCount > maxRangeDays) {
        message.warning("搜尋日期範圍不能超過 90 天");
        return;
      }

      setFilters((prev) => ({ ...prev, dateRange: [start, end] }));
      setDays(dayCount);
    }

    // setFilters((prev) => ({ ...prev, dateRange: [start, end] }));
  
  };

  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  //數量狀態

  // ✅ 讀取商品資訊
  useEffect(() => {
    fetch(`/api/products-lease/${productId}`)
      .then((res) => res.json())
      .then((data) => setProduct(data))
      .catch((error) => console.error("Error fetching product", error));
  }, [productId]);

  // ✅ 點擊「加入購物車」的處理函式

  if (!product)
    return <div className="container mt-5 text-center">載入中...</div>;

  const addCoupon = async () => {
  if (!session?.user?.id) {
    alert("請先登入");
    return;
  }

  // ✅ 1. 獲取表單輸入值
  const user_id = session.user.id; // 取得用戶 ID
  const name = document.getElementById("name")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const telephone = document.getElementById("phone")?.value.trim();
  const address = document.getElementById("address")?.value.trim();
  const notes = document.getElementById("textarea")?.value.trim();
  const startDate = filters.dateRange[0]?.format("YYYY-MM-DD HH:mm:ss");
  const endDate = filters.dateRange[1]?.format("YYYY-MM-DD HH:mm:ss");
  const price = (product.price / 10) * days; // 計算總價

  // ✅ 2. 基本驗證
  if (!name || !email || !telephone || !address || !startDate || !endDate) {
    // alert("請填寫完整的顧客資訊和租借日期！");
    showCartAlert.error("請填寫完整的顧客資訊和租借日期！");
    return;
  }

  // ✅ 3. 準備數據發送請求
  const body = {
    user_id,
    name,
    email,
    telephone,
    address,
    notes,
    price,
    appointment_starts: startDate,
    appointment_end: endDate,
    product_id: productId, // 傳遞當前商品 ID
    order_id: crypto.randomUUID() // 初始值為 null
  };

  console.log("📌 傳送的數據:", body);

  try {
    const response = await fetch("/api/products-lease/user-lease", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text(); // 讀取伺服器回應的原始文字
    console.log("🔍 伺服器回應:", text);

    const data = response.ok ? JSON.parse(text) : { message: text }; // 解析 JSON 或使用原始文字作為錯誤訊息
    if (response.ok && data.order_id) {
      showCartAlert.success("商品成功加入租借清單！");
      
      router.push(`/products-lease/finish/${data.order_id}`);

    } else {
      alert(`❌ 發生錯誤：${data.message}`);
    }
  } catch (error) {
    console.error("🚨 無法添加租借訂單:", error);
    alert("❌ 系統錯誤，請稍後再試");
  }
};

  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: "var(--font-zh)", // 使用 globals.css 中定義的中文字體
        },
        components: {
          DatePicker: {
            // 基礎顏色
            colorBgContainer: "#F8F8F8", // 背景色（淺灰白）
            colorPrimary: "#B6AD9A", // 主色調（淡褐色）
            colorBorder: "#E8E4DE", // 邊框（淺米色）
            colorText: "#7C7267", // 文字（淺褐灰）
            colorTextDisabled: "#D3CDC6", // 禁用文字（淺灰）
            colorBgContainerDisabled: "#F8F8F8", // 禁用背景

            // 輸入框外觀
            borderRadius: 8, // 圓角
            controlHeight: 40, // 高度

            // 輸入框 hover 和 focus 狀態
            hoverBorderColor: "#C5BDB1", // hover 邊框（中淺褐）
            activeBorderColor: "#B6AD9A", // focus 邊框（淡褐色）

            // 日期格子的狀態
            cellHoverBg: "#E8E4DE", // 日期 hover（淺米色）
            cellActiveWithRangeBg: "#D3CDC6", // 選中範圍（淺灰）
            cellHoverWithRangeBg: "#E8E4DE", // 範圍 hover（淺米色）

            // 選中狀態
            activeBg: "#C5BDB1", // 選中背景（中淺褐）

            // 控制按鈕（月份切換等）
            controlItemBgActive: "#D3CDC6", // 控制項選中（淺灰）
            controlItemBgHover: "#E8E4DE", // 控制項 hover（淺米色）
          },
        },
      }}
      locale={locale}
    >
    <div className="container mt-5">
      <div className="row">
        {/* 主圖片輪播 */}
        <div className="col-lg-8">
        {product.images.length > 0 && (
            <div className="image-wrapper">
              <Image
                src={`/images/products/${product.images[0].image_path}`}
                layout="fill" /* 填滿父容器 */
                objectFit="contain" /* 完整顯示圖片 */
                alt={product.name}
                className="lease-img"
              />
            </div>
          )}
        </div>

        {/* 商品資訊 */}
        <div className="col-lg-4 p-info">
          <div>
            <h2 className="text-p-name">{product.name}</h2>
          </div>
          <div className="mt-5">
            <h4 className="text-p-price font-bold">只接受"到店領取"及"現場付款"</h4>
            <p>保障雙方權益</p>
          </div>
          <div className="mt-5">
            <h4 className="text-p-price">${Math.round(product.price / 10)}/<span className="lease-day"> { days } </span> 天</h4>
          </div>
          {/*  */}

          <div className="col-span-2">
              <RangePicker
                value={filters.dateRange}
                onChange={handleDateChange}
                format="YYYY/MM/DD"
                placeholder={["開始日期", "結束日期"]}
                className="w-full"
                allowClear
                showToday
                disabledDate={(current) => {
                  // 禁用今天之前的日期
                  if (current && current < today) {
                    return true;
                  }
                  // 禁用一年後的日期
                  if (current && current > maxDate) {
                    return true;
                  }
                  return false;
                }}
                style={{
                  height: "40px",
                }}
              />
            </div>
          {/*  */}
          <div className="mt-5">
            <p>{product.description}</p>
          </div>

          {/* 數量 */}
          {/* <div className="quantity item-style d-flex mt-5">
            <button
              onClick={() => {
                if (quantity <= 1) return;
                setQuantity(quantity - 1);
              }}
            >
              -
            </button>
            <input
              className="w-100 text-center"
              type="text"
              value={quantity}
              readOnly
            />
            <button
              onClick={() => {
                setQuantity(quantity + 1);
              }}
            >
              +
            </button>
          </div> */}
        </div>
      </div>
      <section className="lease-product mt-5">
      <div className="main">
          <article className="title">
            <h3>產品圖片</h3>
          </article>
          <article className="content">
            <div className="item-content">
            <div className="mb-3 d-flex flex-wrap product-buttom" >
                {product.images.map((img, index) => (
                      <Image
                        className="col-6 p-3" key={index} src={`/images/products/${img.image_path}`}
                        width="300"
                        height={300}
                        alt={product.name}
                      />
                ))}
                </div>
            </div>
          </article>
        </div>
      </section>
      <section className="customer-information lease-product mt-5">
      <div className="container">
        <div className="main">
          <article className="title">
            <h3>顧客資料</h3>
          </article>
          <article className="content">
            <div className="item-content">
              <div className="mb-3">
                <label htmlFor="name" className="form-label">
                  顧客名稱:
                </label>
                <input type="text" className="form-control" id="name" />
              </div>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  電子信箱:
                </label>
                <input type="email" className="form-control" id="email" />
              </div>
              <div className="mb-3">
                <label htmlFor="phone" className="form-label">
                  電話號碼:
                </label>
                <input type="tel" className="form-control" id="phone" />
              </div>
              <div className="mb-3">
                <label htmlFor="address" className="form-label">
                  地址:
                </label>
                <input type="text" className="form-control" id="address" />
              </div>
              <div className="mb-3">
                <label htmlFor="textarea" className="form-label">
                  備註:
                </label>
                <textarea
                  className="form-control"
                  id="textarea"
                  rows={3}
                  defaultValue={""}
                />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
    <div className="my-4 d-flex justify-content-center">
            {/* ✅ 按鈕綁定 `handleAddToCart` */}
            <button
              className="btn btn-add-cart w-auto"
              onClick={addCoupon}
            >
              加入購物車
            </button>
    </div>
    </div>
    </ConfigProvider>
  );
}
