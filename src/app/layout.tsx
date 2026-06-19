import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Terminal from "@/components/Terminal";

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Billy Zhong — Portfolio",
  description: "Backend engineer portfolio — distributed systems, APIs, data pipelines.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${inter.variable}`}>
      <body className="antialiased font-sans">
        <Analytics />
        <MobileNav />
        <div className="flex max-w-[1180px] mx-auto">
          <Sidebar />
          <main className="flex-1 min-w-0 px-0 md:px-14 pb-19 md:pb-22">
            {children}
            <Terminal />
          </main>
        </div>
      </body>
    </html>
  );
}
