import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "front-signature — Signez vos PDF en ligne",
    template: "%s | front-signature",
  },
  description:
    "Application web pour signer vos documents PDF en ligne, rapidement et en toute sécurité. Aucune installation requise.",
  keywords: [
    "signature électronique",
    "signer PDF",
    "signature en ligne",
    "signature numérique",
    "outil de signature",
    "electronic signature",
    "sign PDF",
    "online signature",
    "document signing",
  ],
  authors: [
    {
      name: "NGASSAKI Chadrack Sidney",
      url: "https://github.com/chadrackngassaki",
    },
  ],
  creator: "NGASSAKI Chadrack Sidney",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: "en_US",
    siteName: "front-signature",
    title: "front-signature — Signez vos PDF en ligne",
    description:
      "Application web pour signer vos documents PDF en ligne, rapidement et en toute sécurité.",
  },
  twitter: {
    card: "summary_large_image",
    title: "front-signature — Signez vos PDF en ligne",
    description:
      "Application web pour signer vos documents PDF en ligne, rapidement et en toute sécurité.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
