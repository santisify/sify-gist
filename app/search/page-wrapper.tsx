// app/search/page-wrapper.tsx
import { Suspense } from 'react';
import SearchPageClient from './page-client';

interface SearchPageWrapperProps {
  gists: any[];
}

export default function SearchPageWrapper({ gists }: SearchPageWrapperProps) {
  return <SearchPageClient gists={gists} />;
}