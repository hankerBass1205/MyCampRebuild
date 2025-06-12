import { useEffect, useState } from 'react';

const PaginationArea = ({ totalPages, currentPage, setCurrentPage }) => {
  if (totalPages <= 1) return null; // 當 totalPages <= 1 時，隱藏元件

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      if (pageNumber !== currentPage) {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      console.warn(`⚠️ 無效的頁碼: ${pageNumber}`);
    }
  };

  const generatePageNumbers = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else {
        startPage = Math.max(1, endPage - 4);
      }
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="paginationArea">
      <div className="pagination d-flex justify-content-between">
        <button
          className="pageBtn"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fa-solid fa-caret-left"></i>
        </button>

        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            className={`pageBtn ${pageNumber === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}

        <button
          className="pageBtn"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="fa-solid fa-caret-right"></i>
        </button>
      </div>
    </div>
  );
};

export default PaginationArea;
