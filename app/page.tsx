import { Suspense } from 'react';
import HomePageClient from './page-client';

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="container-main py-6">
        <div className="flex justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      </div>
    }>
      <HomePageClient />
    </Suspense>
  );
}
