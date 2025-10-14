import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aratiri Admin",
  description: "Admin Dashboard for Aratiri Lightning Middleware",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
