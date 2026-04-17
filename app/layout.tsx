import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "PayShield | Secure donations & fraud detection",
  description:
    "AI-powered fraud detection and secure transactions for confident giving.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", inter.variable)} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0A0F1E] font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
