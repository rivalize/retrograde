import type { Metadata } from "next";
import { Orbitron, Rajdhani } from "next/font/google";
import "./globals.css";
import SiteHeader from "../components/site-header";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display"
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "Retrograde | Trust Infrastructure for the Agentic Economy",
  description:
    "Retrograde scans endpoints, smart contracts, and repositories across major chains before agents or developers deploy capital.",
  metadataBase: new URL("https://retrograde.local")
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${rajdhani.variable}`}>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}