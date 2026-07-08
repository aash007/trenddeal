import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { HeaderNav } from "@/components/header-nav";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrendDeal",
  description: "Wardrobe-led men's fashion deal intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="td-body min-h-full flex flex-col">
        <HeaderNav />
        <main className="max-w-5xl mx-auto px-4 py-5 w-full flex-1">{children}</main>
      </body>
    </html>
  );
}
