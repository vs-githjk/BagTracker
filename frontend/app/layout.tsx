import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "BagTrack — Baggage Risk Dashboard",
  description: "Proactive baggage missed-connection risk detection",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex">
        <Sidebar />
        <main className="flex-1 overflow-auto min-h-screen">{children}</main>
      </body>
    </html>
  );
}
