"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { showCartAlert } from "@/utils/sweetalert";

export default function UserCommentComponent({ productId, onReviewSubmitted }) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5); // ✅ 預設 5 顆星
  const [hoverRating, setHoverRating] = useState(0); // ✅ 記錄 hover 狀態
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ 檢查是否登入
    if (!session?.user?.id) {
      showCartAlert.error("請先登入再提交評論！");
      return;
    }

    try {
      const res = await fetch("/api/products/productRate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          user_id: session.user.id,
          content: content,
          rating: rating,
        }),
      });

      if (!res.ok) throw new Error("提交失敗，請稍後再試！");

      const data = await res.json();

      // ✅ 確保 `user_name` 存在
      onReviewSubmitted({
        review_id: data.review_id,
        content: content,
        rating: rating,
        user_name: session.user.name,
        created_at: data.created_at || new Date().toISOString(),
      });

      showCartAlert.success("您的評論提交成功！");
      setContent(""); // ✅ 清空評論輸入框
      setRating(5); // ✅ 重置評分
    } catch (error) {
      console.error("❌ 提交錯誤:", error);
      showCartAlert.error("提交失敗，請稍後再試！");
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <label className="comment-label">為此商品評分：</label>
      <div className="star-container">
        {/* ⭐ 星星顯示 */}
        <div className="star-rating">
          {Array(5)
            .fill(1)
            .map((_, i) => {
              const score = i + 1;
              return (
                <span
                  key={score}
                  className={`star ${
                    score <= (hoverRating || rating) ? "star-on" : "star-off"
                  }`}
                  onMouseEnter={() => setHoverRating(score)} // ✅ 滑鼠移入時改變樣式
                  onMouseLeave={() => setHoverRating(0)} // ✅ 滑鼠移出時恢復
                  onClick={() => setRating(score)} // ✅ 點擊確定評分
                >
                  &#9733;
                </span>
              );
            })}
        </div>
      </div>

      <label className="comment-label mb-3">評論內容：</label>
      <div className="d-flex justify-content-center">
        <textarea
          className="comment-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
      <div className="d-flex justify-content-center">
        <button className="comment-submit mt-3" type="submit">
          提交評論
        </button>
      </div>
    </form>
  );
}
