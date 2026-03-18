// app/search/page.tsx
import { Suspense } from 'react';
import { getAllGists, Gist } from '@/lib/gists';
import SearchPageClientWrapper from './page-wrapper';

interface SearchPageProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  // 不使用动态参数，而是让客户端处理搜索
  const allGists = await getAllGists();
  
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <SearchPageClientWrapper gists={allGists} />
    </Suspense>
  );
}