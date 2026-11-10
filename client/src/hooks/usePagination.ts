import { useState, useMemo } from 'react';

interface UsePaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  initialPage?: number;
}

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (count: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination({
  totalItems,
  itemsPerPage: initialItemsPerPage = 10,
  initialPage = 1,
}: UsePaginationProps): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage]
  );

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  const nextPage = () => {
    if (canGoNext) setCurrentPage((p) => p + 1);
  };

  const prevPage = () => {
    if (canGoPrev) setCurrentPage((p) => p - 1);
  };

  const handleSetPage = (page: number) => {
    const safeP = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(safeP);
  };

  const handleSetItemsPerPage = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex,
    endIndex,
    setCurrentPage: handleSetPage,
    setItemsPerPage: handleSetItemsPerPage,
    nextPage,
    prevPage,
    canGoNext,
    canGoPrev,
  };
}
