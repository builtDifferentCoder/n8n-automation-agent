import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Qualification Ops | Internal Automation Dashboard",
  description: "Internal ops dashboard for lead qualification automation system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8fafc] text-[#0f172a] antialiased selection:bg-[#10b981]/20 selection:text-[#065f46]">
        {children}
      </body>
    </html>
  );
}
