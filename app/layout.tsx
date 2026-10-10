import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import PreviewBanner from "../components/PreviewBanner";
import { AuthProvider } from "../lib/auth-context";
import { isPreviewSite } from "../lib/site-channel.mjs";

// Preview deployments (the v2 site, branch previews, local runs) are never
// indexed and carry a banner; production is unaffected.
const isPreview = isPreviewSite();

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cadencea.app"),
  title: "Cadencea | Innovative Software for Music Creators",
  description:
    "Building the future of music creation. Innovative software and technology designed for music creators, by music creators.",
  openGraph: {
    title: "Cadencea | Innovative Software for Music Creators",
    description:
      "Building the future of music creation. Innovative software and technology designed for music creators, by music creators.",
    url: "/",
    siteName: "Cadencea",
    images: [
      {
        url: "/logo/og-social-card.png",
        width: 1200,
        height: 630,
        alt: "Cadencea",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cadencea | Innovative Software for Music Creators",
    description:
      "Building the future of music creation. Innovative software and technology designed for music creators, by music creators.",
    images: ["/logo/og-social-card.png"],
  },
  ...(isPreview
    ? { robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } }
    : {}),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nonce-based CSP requires request-time rendering so Next can apply the
  // middleware-provided nonce to every framework script.
  await headers();
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-canvas text-ink antialiased">
        {isPreview && <PreviewBanner />}
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
