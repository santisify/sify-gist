import { Metadata } from 'next';
import DiscoverClient from './page-client';

export const metadata: Metadata = {
  title: '发现 - Sify Gist',
  description: '浏览公开的代码片段，探索热门标签',
};

export default function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  return DiscoverPageInner(searchParams);
}

async function DiscoverPageInner(searchParams: Promise<{ topic?: string }>) {
  const { topic } = await searchParams;
  return <DiscoverClient initialTopic={topic} />;
}
