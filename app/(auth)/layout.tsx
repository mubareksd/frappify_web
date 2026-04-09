import { env } from '@/lib/env';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user) {
    redirect(`${env.PUBLIC_APP_URL}/`);
  }
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {children}
    </div>
  );
}