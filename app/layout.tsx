import type { Metadata } from "next";
import "./globals.css";
import Head from 'next/head';

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
      <Head>
        <title>SignDoc – Signez vos PDF en ligne</title>
        <meta
          name="description"
          content="SignDoc vous permet de signer vos documents PDF en ligne, rapidement et en toute sécurité. Aucune installation requise. Essayez gratuitement dès maintenant !"
        />
        <meta
          name="keywords"
          content="signature électronique, signer PDF, signature en ligne, signature numérique, PDF signable, outil de signature, "
        />
      </Head>
      <body>{children}</body>
    </html>
  );
}
