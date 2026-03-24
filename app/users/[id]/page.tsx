import { Metadata } from 'next';
import UserProfileClient from './page-client';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `User Profile - Sify Gist`,
  };
}

export default async function UserPage({ params }: Props) {
  const { id } = await params;
  return <UserProfileClient userId={id} />;
}
