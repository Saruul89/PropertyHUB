import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PropertyHub - Нэгдсэн үл хөдлөх хөрөнгийн удирдлагын систем",
  description: "Орон сууц, оффисын удирдлагын SaaS платформ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className={`${notoSans.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
