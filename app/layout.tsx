import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import PreviewBanner from "../components/PreviewBanner";
import { ToastProvider } from "../components/ui/Toast";
import { CartProvider } from "../components/plugins/CartContext";
import { V2FlagProvider } from "../components/v2/common/V2Flag";
import { AuthProvider } from "../lib/auth-context";
import { isPreviewSite } from "../lib/site-channel.mjs";
import { pluginStoreOpen } from "../lib/plugins/store-gate.mjs";

// Preview deployments (the v2 site, branch previews, local runs) are never
// indexed and carry a banner; production is unaffected. Client components get
// the flag through V2FlagProvider and never call isPreviewSite() themselves.
const isPreview = isPreviewSite();
// The plugin store (Plugins link, cart button, /cart, product pages) is open on
// previews and wherever its go-live switch is on (lib/plugins/store-gate.mjs).
const storeOpen = pluginStoreOpen();

const description =
  "Cadencea Vault organizes your DAW projects, shows BPM, key and tags, and backs up every session bit for bit. Free app for Windows and macOS. Pay only for cloud space.";
const socialTitle = "Cadencea Vault — every project, every DAW, one lossless vault";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cadencea.app"),
  title: {
    default: "Cadencea — Lossless project vault for music producers",
    template: "%s | Cadencea",
  },
  description,
  openGraph: {
    title: socialTitle,
    description,
    url: "/",
    siteName: "Cadencea",
    images: [
      {
        url: "/logo/og-social-card.png",
        width: 1200,
        height: 630,
        alt: "Cadencea Vault",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: socialTitle,
    description,
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-sm focus:bg-canvas focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-dropdown"
        >
          Skip to content
        </a>
        {isPreview && <PreviewBanner />}
        <AuthProvider>
          <V2FlagProvider showV2={isPreview}>
            <ToastProvider>
              <CartProvider>
                <Navbar showStore={storeOpen} />
                <main id="main">{children}</main>
                <Footer showStore={storeOpen} />
                <CookieBanner />
              </CartProvider>
            </ToastProvider>
          </V2FlagProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
