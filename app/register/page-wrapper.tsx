// app/register/page-wrapper.tsx
import { Suspense } from 'react';
import RegisterPageClient from './page-client';

export default function RegisterPageWrapper() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <RegisterPageClient />
    </Suspense>
  );
}