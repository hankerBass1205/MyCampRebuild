"use client";
import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { showCartAlert } from "@/utils/sweetalert";

export default function Page() {
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState({
    name: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "",
    max_discount: "",
    start_date: "",
    end_date: "",
    level_id: 1,
  });
  const [newCoupon, setNewCoupon] = useState({
    name: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "",
    max_discount: "",
    start_date: "",
    end_date: "",
    level_id: 1,
  })
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // 新增一個狀態來記錄當前頁數
  const itemsPerPage = 4; // 每頁顯示的項目數量

  useEffect(() => {
    const fetchCoupons = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/admin/coupons/read");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // console.log("Fetched coupons:", data);
        setCoupons(Array.isArray(data) ? data : []);
        setError(null);
      } catch (error) {
        console.error("Error fetching coupons:", error);
        setCoupons([]);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  //分頁計算
  const totalPages = Math.ceil(coupons.length / itemsPerPage); // 計算總頁數
  const startIndex = (currentPage - 1) * itemsPerPage; // 計算當前頁的起始索引
  const currentCoupons = coupons.slice(startIndex, startIndex + itemsPerPage); // 取得當前頁的項目

  //切換頁面
  const handlePageChange = (page) => {
    if(page >= 1 && page <= totalPages) { // 檢查頁數是否在有效範圍內
      setCurrentPage(page); // 更新當前頁數
    }
  }

  const handleCouponChange = async () => {
    if (!selectedCoupon) {
      console.error("No coupon selected. selectedCoupon is undefined or null");
      alert("請選擇一個優惠券進行編輯");
      return;
    }

    const couponId = selectedCoupon?.id;
    if (!couponId || couponId === "" || couponId === null) {
      console.error("Invalid coupon ID. selectedCoupon:", selectedCoupon);
      alert("優惠券 ID 無效，請檢查選擇的優惠券");
      return;
    }

    // console.log(
    //   "Updating coupon with ID:",
    //   couponId,
    //   "Selected Coupon:",
    //   selectedCoupon
    // );

    const coupon_code =
      document.getElementById("coupon_code")?.value ||
      selectedCoupon.coupon_code;
    const name =
      document.getElementById("exampleFormControlInput2")?.value ||
      selectedCoupon.name;
    const discount_type =
      document.getElementById("exampleFormControlInput3")?.value ||
      selectedCoupon.discount_type;
    const discount_value =
      document.getElementById("exampleFormControlInput4")?.value ||
      selectedCoupon.discount_value;
    const min_purchase =
      document.getElementById("exampleFormControlInput5")?.value ||
      selectedCoupon.min_purchase;
    const max_discount =
      document.getElementById("exampleFormControlInput6")?.value ||
      selectedCoupon.max_discount;
    const start_date =
      document.getElementById("exampleFormControlInput7")?.value ||
      selectedCoupon.start_date;
    const end_date =
      document.getElementById("exampleFormControlInput8")?.value ||
      selectedCoupon.end_date;
    const level_id =
      document.getElementById("exampleFormControlInput9")?.value ||
      selectedCoupon.level_id;

    const body = {
      coupon_code,
      name,
      discount_type,
      discount_value,
      min_purchase,
      max_discount,
      start_date,
      end_date,
      level_id,
    };

    try {
      const response = await fetch(`/api/admin/coupons/edit/${couponId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update coupon");
      }

      // console.log("API response data:", data);

      if (!data.coupon || !data.coupon.id) {
        throw new Error("Invalid response format from API");
      }

      setCoupons((prevCoupons) =>
        prevCoupons.map((c) =>
          c.id === couponId ? { ...data.coupon, id: Number(data.coupon.id) } : c
        )
      );
      showCartAlert.success("優惠券更新成功");
      // alert("優惠券更新成功");

      return data;
    } catch (error) {
      console.error("Error updating coupon:", error);
      alert("更新優惠券失敗: " + error.message);
    }
  };

  const handleCouponDelete = async (couponId) => {
    try {
      const response = await fetch(`/api/admin/coupons/delete/${couponId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      // console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete coupon");
      }
      // 根據後端回應更新 coupons 狀態
      // 假設後端返回 { message: "優惠券狀態更新成功，已設置為關閉 (status = 0)", couponId: couponId }
      setCoupons((prevCoupons) =>
        prevCoupons.map(
          (c) => (c.id === couponId ? { ...c, status: 0 } : c) // 更新 status 為 0
        )
      );
      showCartAlert.success("優惠券成功刪除");
    } catch (error) {
      console.error("Error deleting coupon:", error);
      alert("刪除優惠券失敗: " + error.message);
    }
  };
  const handleCouponOpen = async (couponId) => {
    try {
      const response = await fetch(`/api/admin/coupons/open/${couponId}`, {
        method: "POST",
      });
      const data = await response.json();
      // console.log(data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to open coupon");
      }

      setCoupons((prevCoupons) =>
        prevCoupons.map(
          (c) => (c.id === couponId ? { ...c, status: 1 } : c) // 更新 status 為 1
        )
      );
      showCartAlert.success("優惠券成功開啟");
    } catch (error) {
      console.error("Error opening coupon:", error);
      alert("開啟優惠券失敗: " + error.message);
    }
  };
  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return !Number.isNaN(date.valueOf());
  };
  const handleAddCoupon = async () => {
    console.log(newCoupon);
    if (!newCoupon.name || !newCoupon.coupon_code || !newCoupon.discount_type || !newCoupon.discount_value) {
      alert("請填寫所有必填欄位（名稱、代碼、折扣類型、折扣值）。");
      return;
    }
    if (!newCoupon.start_date || !isValidDate(newCoupon.start_date)) {
      alert("請設置有效的開始日期。");
      return;
    }
    if (!newCoupon.end_date || !isValidDate(newCoupon.end_date)) {
      alert("請設置有效的結束日期。");
      return;
    }

    try {
      const response = await fetch("/api/admin/coupons/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newCoupon),
      });
      
      const result = await response.json();
      // console.log("API", result);

      if (!response.ok) {
        throw new Error(result.message || "新增優惠券失敗");
      }

      // const validStartDate = result.coupon.start_date ? new Date(result.coupon.start_date) : null;
      // const validEndDate = result.coupon.end_date ? new Date(result.coupon.end_date) : null;

      // if (validStartDate && Number.isNaN(validStartDate.valueOf())) {
      //   throw new Error("開始日期格式錯誤");
      // }
      // if (validEndDate && Number.isNaN(validEndDate.valueOf())) {
      //   throw new Error("結束日期格式錯誤");
      // }

      const newCouponData = {
        ...result.coupon, // 使用 API 回傳的 coupon 物件
        created_at: result.coupon.created_at || new Date().toISOString(), // 使用當前時間作為 created_at
        updated_at: result.coupon.updated_at || new Date().toISOString(), // 使用當前時間作為 updated_at
      }

      setNewCoupon({
        name: "",
        coupon_code: Math.random().toString(36).substring(2, 10),
        discount_type: "",
        discount_value: "",
        min_purchase: "",
        max_discount: "",
        start_date: "",
        end_date: "",
        level_id: "",
      });

      setCoupons((prevCoupons) => [...prevCoupons, newCouponData]);
      showCartAlert.success("新增優惠券成功");
    } catch (error) {
      console.error("Error adding coupon:", error);
      alert("新增優惠券失敗: " + error.message);
    }
  };

  const handleCoupon = async (coupondata) => {
    // if (!coupondata || coupondata === "" || coupondata === null) {
    //   console.error("Invalid coupon ID provided:", coupondata);
    //   alert("請選擇一個優惠券");
    //   return;
    // }

    const coupon = coupons.find((c) => c.id === coupondata);
    // console.log("Coupon for ID:", coupondata, "Found Coupon:", coupon);

    if (coupon) {
      setSelectedCoupon(coupon);
    } else {
      console.error("Coupon not found for ID:", coupondata);
      alert("找不到優惠券");
    }
  };
  const handleDelete = async (couponId) => {
    const coupon = coupons.find((c) => c.id === couponId);
    if (coupon) {
      setSelectedCoupon(coupon);
    } else {
      alert("找不到優惠券");
    }
  };

  const handleCouponCodeChange = () => {
    if (!selectedCoupon) {
      alert("請先選擇一個優惠券");
      return;
    }

    const randomCode =
      "CAMP" + Math.random().toString(36).substr(2, 3).toUpperCase();
    setSelectedCoupon((prevCoupon) => ({
      ...prevCoupon,
      coupon_code: randomCode,
    }));
    const randomCode2 =
      "CAMP" + Math.random().toString(36).substr(2, 3).toUpperCase();
    setNewCoupon((prevCoupon) => ({
      ...prevCoupon,
      coupon_code: randomCode2,
    }))
  };

  return (
    <div>
      {loading ? (
        <div className="text-center">加載中...</div>
      ) : error ? (
        <div className="text-center text-red-500">錯誤：{error}</div>
      ) : (
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">優惠券管理</h1>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
              data-bs-toggle="modal"
              data-bs-target="#myNewModal"
            >
              新增優惠券
            </button>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        優惠券編號
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        優惠券代碼
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        優惠券名稱
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        折扣類型
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        折扣值
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最低消費金額
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        最高折抵金額
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        開始日期
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        結束日期
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        狀態
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        建立時間
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        更新時間
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        當前優惠券等級
                      </th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentCoupons.length > 0 ? (
                      currentCoupons.map((coupon) => (
                        <tr
                          className="hover:bg-gray-50"
                          key={
                            coupon?.id ||
                            `default-key-${Math.random()
                              .toString(36)
                              .substr(2, 9)}`
                          }
                        >
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.id || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.coupon_code || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.name || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.discount_type === "percentage"
                                ? `百分比`
                                : coupon?.discount_type === "fixed"
                                ? `固定值`
                                : coupon?.discount_value || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.discount_type === "percentage"
                                ? `${coupon?.discount_value}%`
                                : coupon?.discount_type === "fixed"
                                ? `NT$ ${coupon?.discount_value}`
                                : coupon?.discount_value || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.min_purchase || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.max_discount || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {(() => {
                                const localDate = new Date(coupon?.start_date); // 轉換為台灣時間
                                localDate.setHours(localDate.getHours() + 8); // 轉換為台灣時間
                                return localDate.toISOString().split("T")[0]; // 只顯示日期部分
                              })()}{" "}
                              開始
                              {/* {coupon.start_date ? new Date(coupon.start_date).toISOString().split("T")[0] : "N/A"} 開始 */}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {(() => {
                                const localDate = new Date(coupon?.end_date); // 轉換為台灣時間
                                localDate.setHours(localDate.getHours() + 8); // 轉換為台灣時間
                                return localDate.toISOString().split("T")[0]; // 只顯示日期部分
                              })()}{" "}
                              結束
                              {/* {coupon.end_date ? new Date(coupon.end_date).toISOString().split("T")[0] : "N/A"} 結束 */}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.status === 1 ? (
                                <div className="text-center bg-green-600 text-white font-bold px-2 py-1 rounded-full">
                                  <p className="m-0">開啟中</p>
                                </div>
                              ) : coupon?.status === 0 ? (
                                <div className="text-center bg-red-600 text-white font-bold px-2 py-1 rounded-full">
                                  <p className="m-0">關閉中</p>
                                </div>
                              ) : (
                                coupon?.status || "N/A"
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.created_at
                                ?.replace("T", " ")
                                .replace("Z", "")
                                .replace(".000", "") || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.updated_at
                                ?.replace("T", " ")
                                .replace("Z", "")
                                .replace(".000", "") || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.level_id || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              <button
                                type="button"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                data-bs-toggle="modal"
                                data-bs-target="#myModal"
                                onClick={() => handleCoupon(coupon?.id)}
                                disabled={!coupon?.id} // 如果 coupon?.id 不存在，則禁用按鈕
                              >
                                編輯
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="text-center text-sm text-gray-900">
                              {coupon?.status === 1 ? (
                                <button
                                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                  data-bs-toggle="modal"
                                  data-bs-target="#myModalDelete"
                                  onClick={() => handleDelete(coupon?.id)}
                                  disabled={!coupon?.id}
                                >
                                  關閉
                                </button>
                              ) : coupon?.status === 0 ? (
                                <button
                                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                  data-bs-toggle="modal"
                                  data-bs-target="#myModalOpen"
                                  onClick={() => handleDelete(coupon?.id)}
                                  disabled={!coupon?.id}
                                >
                                  開啟
                                </button>
                              ) : (
                                coupon?.status || "N/A"
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="15" className="text-center">
                          目前無資料
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* 分頁 */}
              {coupons.length > 0 &&(
                <div className="flex justify-center mt-4">
                  <nav aria-label="Page navigation">
                    <ul className="pagination">
                      <li>
                        <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage ===1 }
                        className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50">
                          上一頁
                        </button> 
                      </li>
                      {Array.from({length: totalPages}, (_, i) => i + 1).map((page) =>( // (_, i) => i + 1) 是什麼意思 ?  
                        <li key={page}>
                          <button
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 leading-tight border border-gray-300 ${
                          currentPage === page
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-500 bg-white hover:bg-gray-100 hover:text-gray-700"
                          }`}>
                            {page}
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50">
                          下一頁
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
          {/* 新增跳窗 */}
          <div
            className="modal fade"
            id="myNewModal"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            tabIndex={-1}
            aria-labelledby="staticBackdropLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="staticBackdropLabel">
                    新增跳窗
                  </h1>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="exampleFormControlInput1" className="form-label">
                      優惠券代碼
                    </label>
                    <p id="coupon_code">{newCoupon?.coupon_code || ""}</p>
                    <button
                      className="bg-blue-200 hover:bg-blue-300 px-4 py-2 rounded-md text-sm font-medium transition-colors mt-3"
                      onClick={handleCouponCodeChange}
                    >
                      代碼修改
                    </button>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exampleFormControlInput2" className="form-label">
                      優惠券名稱
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="exampleFormControlInput2"
                      placeholder="請輸入優惠券名稱"
                      value={newCoupon?.name || ""}
                      onChange={(e) => setNewCoupon({ ...newCoupon, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exampleFormControlInput3" className="form-label">
                      折扣類型
                    </label>
                    <select
                      className="form-select"
                      aria-label="Default select example"
                      value={newCoupon?.discount_type || ""}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount_type: e.target.value })}
                      required
                    >
                      <option value="percentage">百分比</option>
                      <option value="fixed">固定金額</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exampleFormControlInput4" className="form-label">
                      折扣值
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="exampleFormControlInput4"
                      placeholder="請輸入折扣值"
                      value={newCoupon?.discount_value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if(newCoupon.discount_type === "percentage" && parseFloat(value) > 100){
                          return; // 如果是百分比且超過100，則不允許輸入
                        }
                        setNewCoupon({ ...newCoupon, discount_value: value });
                      }}
                      min="0"
                      max={newCoupon.discount_type === "precentage" ? "100" : undefined }
                      step="1"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exampleFormControlInput5" className="form-label">
                      最低消費金額
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="exampleFormControlInput5"
                      placeholder="請輸入最低消費金額"
                      value={newCoupon?.min_purchase || ""}
                      onChange={(e) => setNewCoupon({ ...newCoupon, min_purchase: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exampleFormControlInput6" className="form-label">
                      最高折抵金額
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="exampleFormControlInput6"
                      placeholder="請輸入最高折抵金額"
                      value={newCoupon?.max_discount || ""}
                      onChange={(e) => setNewCoupon({ ...newCoupon, max_discount: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exampleFormControlInput7" className="form-label">
                      開始日期
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="exampleFormControlInput7"
                      value={newCoupon?.start_date || ""}
                      onChange={(e) => setNewCoupon({ ...newCoupon, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exampleFormControlInput8" className="form-label">
                      結束日期
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="exampleFormControlInput8"
                      value={newCoupon?.end_date || ""}
                      onChange={(e) => setNewCoupon({ ...newCoupon, end_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="exampleFormControlInput9" className="form-label">
                      當前優惠券等級
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="form-control"
                      id="exampleFormControlInput9"
                      value={newCoupon?.level_id || ""}
                      onChange={(e) => setNewCoupon({ ...newCoupon, level_id: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    關閉視窗
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleAddCoupon}
                  >
                    確定新增
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* 編輯跳窗 */}
          <div
            className="modal fade"
            id="myModal"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            tabIndex={-1}
            aria-labelledby="staticBackdropLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="staticBackdropLabel">
                    編輯跳窗
                  </h1>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label
                      htmlFor="exampleFormControlInput1"
                      className="form-label"
                    >
                      優惠券代碼
                    </label>
                    <p id="coupon_code">{selectedCoupon?.coupon_code || ""}</p>
                    <button
                      className="bg-blue-200 hover:bg-blue-300 px-4 py-2 rounded-md text-sm font-medium transition-colors mt-3"
                      onClick={handleCouponCodeChange}
                      disabled={!selectedCoupon}
                    >
                      代碼修改
                    </button>
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="exampleFormControlInput2"
                      className="form-label"
                    >
                      優惠券名稱
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="exampleFormControlInput2"
                      placeholder="name@example.com"
                      value={selectedCoupon?.name || ""}
                      onChange={(e) =>
                        setSelectedCoupon({
                          ...selectedCoupon,
                          name: e.target.value,
                        })
                      }
                      disabled={!selectedCoupon}
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="exampleFormControlInput3"
                      className="form-label"
                    >
                      折扣類型
                    </label>
                    <select
                      className="form-select"
                      aria-label="Default select example"
                      value={selectedCoupon?.discount_type || ""}
                      onChange={(e) =>
                        setSelectedCoupon({
                          ...selectedCoupon,
                          discount_type: e.target.value,
                        })
                      }
                      disabled={!selectedCoupon}
                    >
                      <option value="percentage">百分比</option>
                      <option value="fixed">固定金額</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="exampleFormControlInput4"
                      className="form-label"
                    >
                      折扣值
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="exampleFormControlInput4"
                      placeholder="name@example.com"
                      value={selectedCoupon?.discount_value || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if(selectedCoupon.discount_type === "percentage" && parseFloat(value) > 100){
                          return; // 如果是百分比且超過100，則不允許輸入
                        }
                        setSelectedCoupon({ ...selectedCoupon, discount_value: value });
                      }}
                      min="0"
                      max={selectedCoupon.discount_type === "precentage" ? "100" : undefined }
                      step="1"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="exampleFormControlInput5"
                      className="form-label"
                    >
                      最低消費金額
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="exampleFormControlInput5"
                      placeholder="name@example.com"
                      value={selectedCoupon?.min_purchase || ""}
                      onChange={(e) =>
                        setSelectedCoupon({
                          ...selectedCoupon,
                          min_purchase: e.target.value,
                        })
                      }
                      disabled={!selectedCoupon}
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="exampleFormControlInput6"
                      className="form-label"
                    >
                      最高折抵金額
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="exampleFormControlInput6"
                      placeholder="name@example.com"
                      value={selectedCoupon?.max_discount || ""}
                      onChange={(e) =>
                        setSelectedCoupon({
                          ...selectedCoupon,
                          max_discount: e.target.value,
                        })
                      }
                      disabled={!selectedCoupon}
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="exampleFormControlInput7"
                      className="form-label"
                    >
                      開始日期
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="exampleFormControlInput7"
                      value={
                        selectedCoupon?.start_date
                          ? new Date(selectedCoupon.start_date)
                              .toLocaleDateString("zh-TW", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })
                              .replace(/\//g, "-") // 轉換成 YYYY-MM-DD 格式
                          : ""
                      }
                      onChange={(e) =>
                        setSelectedCoupon({
                          ...selectedCoupon,
                          start_date: e.target.value,
                        })
                      }
                      disabled={!selectedCoupon}
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="exampleFormControlInput8"
                      className="form-label"
                    >
                      結束日期
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      id="exampleFormControlInput8"
                      value={
                        selectedCoupon?.end_date
                          ? new Date(selectedCoupon.end_date)
                              .toLocaleDateString("zh-TW", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })
                              .replace(/\//g, "-") // 轉換成 YYYY-MM-DD 格式
                          : ""
                      }
                      onChange={(e) =>
                        setSelectedCoupon({
                          ...selectedCoupon,
                          end_date: e.target.value,
                        })
                      }
                      disabled={!selectedCoupon}
                    />
                  </div>
                  <div className="mb-3">
                    <label
                      htmlFor="exampleFormControlInput9"
                      className="form-label"
                    >
                      當前優惠券等級
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="form-control"
                      id="exampleFormControlInput9"
                      value={selectedCoupon?.level_id || ""}
                      onChange={(e) =>
                        setSelectedCoupon({
                          ...selectedCoupon,
                          level_id: e.target.value,
                        })
                      }
                      disabled={!selectedCoupon}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    關閉視窗
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCouponChange}
                    disabled={!selectedCoupon}
                  >
                    確定編輯
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* 刪除跳窗 */}
          <div
            className="modal fade"
            id="myModalDelete"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            tabIndex={-1}
            aria-labelledby="staticBackdropLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="staticBackdropLabel">
                    刪除跳窗
                  </h1>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  你確定要刪除[ {selectedCoupon?.name || ""} ]嗎?
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    關閉視窗
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCouponDelete(selectedCoupon?.id)}
                  >
                    確定刪除
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* 開啟跳窗 */}
          <div
            className="modal fade"
            id="myModalOpen"
            data-bs-backdrop="static"
            data-bs-keyboard="false"
            tabIndex={-1}
            aria-labelledby="staticBackdropLabel"
            aria-hidden="true"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="staticBackdropLabel">
                    開啟跳窗
                  </h1>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  />
                </div>
                <div className="modal-body">
                  你確定要開啟[ {selectedCoupon?.name || ""} ]嗎?
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    data-bs-dismiss="modal"
                  >
                    關閉視窗
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleCouponOpen(selectedCoupon?.id)}
                  >
                    確定開啟
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
