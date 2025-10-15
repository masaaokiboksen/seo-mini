import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SEO Mini - Keyword Generator",
  description: "Simple SEO keyword generator MVP using Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
