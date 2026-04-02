import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "WageLock — Income Protection for Delivery Partners",
  description:
    "Automatic income protection for food delivery partners. When disruptions happen, we compensate your lost earnings instantly. No paperwork. No hassle.",
  keywords: ["income protection", "delivery partners", "gig workers", "insurance", "UPI payouts"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="antialiased min-h-screen font-sans">{children}</body>
    </html>
  );
}
