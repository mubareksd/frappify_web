import ProtectedAppShell from '@/components/layout/dashboard/protected-app-shell';
import { authOptions } from '@/lib/auth-options';
import { getCurrentSession, getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';

interface ProtectedLayoutProps {
  children?: React.ReactNode;
}

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await getCurrentSession();
  const user = await getCurrentUser();

  if (!user) {
    redirect(authOptions?.pages?.signIn || '/login');
  }

  return (
    <ProtectedAppShell
      user={{
        name: session?.user?.name,
        email: session?.user?.email,
        username: session?.user?.username,
        image: session?.user?.image,
      }}
    >
      {children}
    </ProtectedAppShell>
  );
}