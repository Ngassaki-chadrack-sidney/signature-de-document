import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signature de documents PDF",
  description: "APP Next de signature de documents PDF.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
