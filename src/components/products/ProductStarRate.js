"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import UserCommentComponent from "./UserComment";
import ReviewEditModal from "./ReviewEditModal"; // 假設路徑
import { showCartAlert } from "@/utils/sweetalert";
import { FaRegEdit } from "react-icons/fa";

export default function ProductStarRateComponent() {
  const { productId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const { data: session } = useSession();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editHoverRating, setEditHoverRating] = useState(0);

  const onReviewSubmitted = (newReview) => {
    setReviews((prevReviews) => {
      const updatedReviews = [
        {
          id: newReview.review_id || `temp-${Date.now()}`,
          user_id: newReview.user_id,
          user_name: newReview.user_name,
          content: newReview.content,
          rating: newReview.rating,
          created_at: newReview.created_at || new Date().toISOString(),
        },
        ...prevReviews,
      ];
      const totalRatings = updatedReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const newAvgRating = totalRatings / updatedReviews.length;

      setAvgRating(newAvgRating);
      setTotalReviews(updatedReviews.length);
      return updatedReviews;
    });
  };

  //當評論更新重新fetch
  useEffect(() => {
    fetch(`/api/products/productRate/${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReviews(data.reviews);
          setAvgRating(Number(data.avg_rating) || 0);
          setTotalReviews(data.total_reviews);
        }
      })
      .catch((error) => console.error("獲取評論失敗:", error));
  }, [productId, avgRating]);

  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditContent(review.content);
    setEditRating(review.rating);
    setEditHoverRating(0);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;

    try {
      const res = await fetch(
        `/api/products/productRate/editReview/${editingReview.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent, rating: editRating }),
        }
      );
      if (!res.ok) throw new Error("更新評論失敗");

      setReviews((prevReviews) =>
        prevReviews.map((r) =>
          r.id === editingReview.id
            ? { ...r, content: editContent, rating: editRating }
            : r
        )
      );
      const totalRatings = reviews.reduce(
        (sum, r) =>
          r.id === editingReview.id ? sum + editRating : sum + r.rating,
        0
      );
      setAvgRating(totalRatings / reviews.length);

      setShowEditModal(false);
      setEditingReview(null);
      showCartAlert.success("更新評論成功");
    } catch (error) {
      console.error("儲存編輯失敗:", error);
      showCartAlert.error("更新評論失敗，請稍後再試");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      if (!editingReview) return;
      const result = await showCartAlert.confirm(
        "確定要移除此商品？",
        "移除後將無法復原"
      );

      if (!result.isConfirmed) return;

      const res = await fetch(
        `/api/products/productRate/editReview/${editingReview.id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "刪除評論失敗");
      }

      const updatedReviews = reviews.filter((r) => r.id !== reviewId);
      setReviews(updatedReviews);
      const totalRatings = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
      const newAvgRating =
        updatedReviews.length > 0 ? totalRatings / updatedReviews.length : 0;
      setAvgRating(newAvgRating);
      setTotalReviews(updatedReviews.length);

      showCartAlert.success("刪除評論成功");
      setShowEditModal(false); // 關閉Modal
      setEditingReview(null);
    } catch (error) {
      console.error("刪除評論失敗:", error);
      showCartAlert.error("刪除評論失敗，請稍後再試");
    }
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingReview(null);
  };

  return (
    <div className="container my-p-review-container">
      <section className="review-header">
        <h3>商品評論</h3>
        {totalReviews === 0 ? (
          <p>目前沒有任何評論</p>
        ) : (
          <p className="review-summary mt-3">
            <strong>平均評分:</strong> {avgRating.toFixed(1)} / 5 ⭐ (
            {totalReviews} 則評論)
          </p>
        )}
      </section>

      <ul className="review-list">
        {reviews.map((review, index) => (
          <li key={review.id || `review-${index}`} className="review-item">
            <div className="review-user">
              <strong className="review-username">{review.user_name}</strong>
              <span className="review-stars">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </span>
            </div>
            <p className="review-content">{review.content}</p>
            <p className="review-date">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
            {session?.user?.id === review.user_id && (
              <div className="d-flex">
                <button
                  className="edit-review-button"
                  onClick={() => handleEditReview(review)}
                >
                  <div className="w-100 d-flex align-items-center ">
                    <FaRegEdit className="edit-review-icon" />
                    <p className="review-btn-text mb-0">編輯評論</p>
                  </div>
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <UserCommentComponent
        productId={productId}
        onReviewSubmitted={onReviewSubmitted}
      />

      <ReviewEditModal
        showEditModal={showEditModal}
        handleCloseModal={handleCloseModal}
        handleSaveEdit={handleSaveEdit}
        editContent={editContent}
        editRating={editRating}
        setEditContent={setEditContent}
        setEditRating={setEditRating}
        setEditHoverRating={setEditHoverRating}
        editHoverRating={editHoverRating}
        handleDeleteReview={handleDeleteReview}
        reviewId={editingReview?.id} // 安全傳遞reviewId
      />
    </div>
  );
}
