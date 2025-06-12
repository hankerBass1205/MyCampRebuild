export default function Pagination({ totalPages, currentPage, onPageChange }) {
  if (totalPages <= 1) return null; // 只有 1 頁時不顯示分頁按鈕

  return (
    <div className="pagination my-page-btn d-flex justify-content-center mt-4">
      {[...Array(totalPages)].map((_, index) => (
        <button
          key={index}
          className={`btn page-link ${
            currentPage === index + 1 ? "my-active" : ""
          }`}
          onClick={() => onPageChange(index + 1)}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
