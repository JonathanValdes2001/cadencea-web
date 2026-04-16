import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import { AuthProvider } from "../lib/auth-context";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cadencea — Innovative Software for Music Creators",
  description:
    "Building the future of music creation. Innovative software and technology designed for music creators, by music creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-canvas text-ink antialiased">
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
