import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://anylong.vercel.app"),

  title: {
    default: "anylong | Compact Intl duration formatter",
    template: "%s | anylong",
  },

  description:
    "Compact zero-dependency duration formatter for JavaScript and TypeScript. Any duration in — milliseconds, ISO 8601, shorthand, Dates — localized string out via native Intl.DurationFormat.",

  keywords: [
    "duration formatting",
    "duration",
    "intl",
    "durationformat",
    "i18n",
    "javascript",
    "typescript",
    "npm",
    "zero dependencies",
    "localization",
    "iso 8601",
    "humanize",
  ],

  authors: [{ name: "kirilinsky", url: "https://github.com/kirilinsky" }],

  creator: "kirilinsky",
  publisher: "kirilinsky",
  applicationName: "anylong",
  category: "Developer Tools",

  openGraph: {
    type: "website",
    url: "https://anylong.vercel.app",
    title: "anylong — duration formatting for any locale",
    description:
      "Compact zero-dependency duration formatter. Milliseconds, ISO 8601, shorthand strings, and Dates in — localized strings out via native Intl.DurationFormat.",
    siteName: "anylong",
    locale: "en_US",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "anylong — duration formatting for any locale",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "anylong — duration formatting for any locale",
    description:
      "Compact zero-dependency duration formatter built on native Intl.DurationFormat.",
    images: ["/og.jpg"],
    creator: "@kirilinsky",
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "https://anylong.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
