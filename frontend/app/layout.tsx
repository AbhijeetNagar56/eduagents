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

import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "EduAgents - Human-AI Co-Learning Platform",
  description: "Automated assignment evaluation and faculty review powered by two-step Gemini AI and Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">EduAgents</span>
              <span>— Human-AI Co-Learning Agent</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-blue-600 transition">GitHub</a>
              <span>•</span>
              <span>Next.js 16 · FastAPI · Supabase · Gemini</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
