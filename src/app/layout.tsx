import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Dara Aroma Dashboard",
  description: "Dara Aroma Management Dashboard",
};

import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ChatBot from "@/components/ChatBot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-200`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <DataProvider>
            {children}
            <ChatBot />
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
