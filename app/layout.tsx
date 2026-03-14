import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; 
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aplicație Salvare Alimente",
  description: "Salvează mâncarea, salvează bugetul",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning este crucial aici pentru next-themes
    <html lang="ro" suppressHydrationWarning>
      <head>
        {/* CSS-ul Leaflet încărcat prin CDN pentru a evita blocajele Tailwind v4 */}
        <link 
          rel="stylesheet" 
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin="" 
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-neutral-900 text-gray-900 dark:text-white`}>
        <Providers>
          <Navbar />
          <div className="pt-14"> {/* Added padding to offset fixed navbar */}
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}