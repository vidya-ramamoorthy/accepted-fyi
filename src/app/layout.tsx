import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { PostHogProvider } from "@/components/PostHogProvider";
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
  metadataBase: new URL("https://accepted.fyi"),
  title: {
    default: "accepted.fyi — Real College Admissions Data from Real Students",
    template: "%s | accepted.fyi",
  },
  description:
    "See what it actually takes to get into top colleges. Browse real admissions outcomes — GPA, SAT, ACT, extracurriculars — from thousands of verified students. Free.",
  verification: {
    google: "LnaYoeCY5QWDV9rTD6pI_iTiat5MP2Sp5W3IQLh5zwo",
  },
  openGraph: {
    title: "accepted.fyi — Real College Admissions Data",
    description:
      "Crowdsourced, verified admissions data from real students. Browse GPA, SAT, ACT scores, and outcomes for thousands of schools.",
    type: "website",
    siteName: "accepted.fyi",
    url: "https://accepted.fyi",
  },
  twitter: {
    card: "summary_large_image",
    title: "accepted.fyi",
    description:
      "See what it actually takes to get into college. Real admissions data from real students.",
  },
  alternates: {
    canonical: "https://accepted.fyi",
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
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}
