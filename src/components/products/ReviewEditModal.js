"use client";
import { Modal, Button, Form } from "react-bootstrap";

export default function ReviewEditModal({
  showEditModal,
  handleCloseModal,
  handleSaveEdit,
  editContent,
  editRating,
  setEditContent,
  setEditRating,
  setEditHoverRating,
  editHoverRating,
  handleDeleteReview,
  reviewId, // 新增參數
}) {
  const handleDelete = () => {
    handleDeleteReview(reviewId); // 用reviewId調用
    handleCloseModal(); // 刪除後關閉Modal
  };

  return (
    <Modal
      show={showEditModal}
      onHide={handleCloseModal}
      onExited={() => document.activeElement.blur()} // 關閉後移除焦點
    >
      <Modal.Header closeButton className="edit-review-modal-header">
        <Modal.Title className="edit-review-modal-title">編輯評論</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="editContent">
            <Form.Label>評論內容</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="輸入您的評論"
            />
          </Form.Group>
          <Form.Group controlId="editRating" className="mt-3">
            <Form.Label>評分</Form.Label>
            <div className="star-rating">
              {Array(5)
                .fill(1)
                .map((_, i) => {
                  const score = i + 1;
                  return (
                    <span
                      key={score}
                      className={`star ${
                        score <= (editHoverRating || editRating)
                          ? "star-on"
                          : "star-off"
                      }`}
                      onMouseEnter={() => setEditHoverRating(score)}
                      onMouseLeave={() => setEditHoverRating(0)}
                      onClick={() => setEditRating(score)}
                    >
                      ★
                    </span>
                  );
                })}
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100  ">
          <div>
            <Button className="edit-review-modal-btn-D" onClick={handleDelete}>
              刪除
            </Button>
          </div>

          <div>
            <Button
              className="edit-review-modal-btn-C"
              onClick={handleCloseModal}
            >
              取消
            </Button>
            <Button
              className="edit-review-modal-btn-S"
              onClick={handleSaveEdit}
            >
              儲存
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
