// app/login/page-wrapper.tsx
import { Suspense } from 'react';
import LoginPageClient from './page-client';

export default function LoginPageWrapper() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <LoginPageClient />
    </Suspense>
  );
}