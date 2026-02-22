import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "accepted.fyi — Real College Admissions Data from Real Students",
  description:
    "See what it actually takes to get into college. Crowdsourced, verified admissions data — GPA, test scores, extracurriculars, and outcomes.",
  openGraph: {
    title: "accepted.fyi — Real College Admissions Data",
    description:
      "Crowdsourced, verified admissions data from real students. Browse GPA, SAT, ACT scores, and outcomes for thousands of schools.",
    type: "website",
    siteName: "accepted.fyi",
  },
  twitter: {
    card: "summary_large_image",
    title: "accepted.fyi",
    description:
      "See what it actually takes to get into college. Real admissions data from real students.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
