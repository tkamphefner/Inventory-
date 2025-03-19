import { useState, useEffect } from 'react';

/**
 * A custom hook for implementing pagination.
 * 
 * @param {Array} data - The full dataset to paginate
 * @param {number} itemsPerPage - Number of items per page
 * @returns {Object} - Pagination state and controls
 */
export function usePagination(data = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState([]);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  useEffect(() => {
    // Reset to first page when data changes
    setCurrentPage(1);
  }, [data]);

  useEffect(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    setPaginatedData(data.slice(start, end));
  }, [data, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
}
