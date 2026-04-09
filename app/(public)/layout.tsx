import { Header } from "@/components/layout/public/header";
import { Footer } from "@/components/layout/public/footer";

export default function PublicRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="antialiased flex flex-col min-h-screen items-center justify-center"
    >
      <Header />
      <main className="flex-1 container px-4 md:px-6 mx-auto">{children}</main>
      <Footer />
    </div>
  );
}