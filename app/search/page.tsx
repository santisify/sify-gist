import { Suspense } from 'react';
import SearchPageClient from './page-client';

export default function SearchPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
