import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aratiri Admin",
  description: "Admin Dashboard for Aratiri Lightning Middleware",
  icons: {
    icon: "/aratiri-admin-icon.svg",
    shortcut: "/aratiri-admin-icon.svg",
    apple: "/aratiri-admin-icon.svg",
  },
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
