import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { SITE } from "@/content/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${SITE.name} · Medical & Surgical Supplies`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "surgical instruments manufacturer",
    "surgical instruments Sialkot",
    "dental instruments",
    "medical instruments supplier",
    "private label surgical instruments",
    "Pakistan surgical instruments",
  ],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE.name,
    title: `${SITE.name} · Medical & Surgical Supplies`,
    description: SITE.description,
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: `${SITE.legalName}, surgical instrument manufacturer in Sialkot` }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.jpg"] },
  // Google Search Console: paste only the code from the HTML-tag method into GOOGLE_SITE_VERIFICATION.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: "#222866",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
