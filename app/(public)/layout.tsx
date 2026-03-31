import { Header } from "@/components/layout/public/header";
import { Footer } from "@/components/layout/public/footer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <
      >
        <Header />
        <main className="flex-1 container px-4 md:px-6">{children}</main>
        <Footer />
      </>
  );
}