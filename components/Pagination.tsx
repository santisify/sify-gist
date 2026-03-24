'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange?: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, total, onPageChange }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (showEllipsisStart) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (showEllipsisEnd) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        共 {total} 条结果，第 {currentPage} / {totalPages} 页
      </div>
      
      <div className="flex items-center gap-1">
        {/* 上一页 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            color: currentPage <= 1 ? 'var(--color-text-muted)' : 'var(--color-text-main)',
          }}
        >
          上一页
        </button>

        {/* 页码 */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <button
                key={index}
                onClick={() => handlePageChange(page)}
                className={`w-8 h-8 text-sm rounded-md transition-colors ${
                  page === currentPage 
                    ? 'font-medium' 
                    : ''
                }`}
                style={{
                  backgroundColor: page === currentPage ? 'var(--color-primary)' : 'transparent',
                  color: page === currentPage ? 'white' : 'var(--color-text-main)',
                }}
              >
                {page}
              </button>
            ) : (
              <span key={index} className="w-8 h-8 flex items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                {page}
              </span>
            )
          ))}
        </div>

        {/* 下一页 */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            color: currentPage >= totalPages ? 'var(--color-text-muted)' : 'var(--color-text-main)',
          }}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
