import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "BagTrack — Baggage Risk Dashboard",
  description: "Proactive baggage missed-connection risk detection",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 min-h-screen flex">
        <ThemeProvider>
          <Sidebar />
          <main className="flex-1 overflow-auto min-h-screen">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
