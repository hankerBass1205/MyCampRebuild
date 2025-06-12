import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="member-pagination">
      <nav className="pagination-nav">
        <button
          className="pagination-button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="上一頁"
        >
          <FiChevronLeft />
        </button>

        <div className="page-numbers">
          {getPageNumbers().map((page) => (
            <button
              key={page}
              className={`page-item ${currentPage === page ? "active" : ""}`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          className="pagination-button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="下一頁"
        >
          <FiChevronRight />
        </button>
      </nav>

      <div className="page-status">
        第 {currentPage} 頁 / 共 {totalPages} 頁
      </div>
    </div>
  );
};

export default Pagination;
