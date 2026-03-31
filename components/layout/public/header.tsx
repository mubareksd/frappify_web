import Link from "next/link";

import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from '@/lib/session';
import { redirect } from 'next/navigation';


export async function Header() {
  const session = await getCurrentSession();
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-screen-xl mx-auto flex h-16 items-center justify-between">
        <Link className="flex items-center justify-center" href="/">
          <span className="ml-2 text-lg font-semibold text-foreground">
            {env.NEXT_PUBLIC_APP_NAME}
          </span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Button asChild variant="default" size="sm">
            <Link
              href="https://play.google.com/store/apps/details?id=et.kinet.frappify"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get the App
            </Link>
          </Button>
          {session ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
