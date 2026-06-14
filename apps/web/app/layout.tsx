import React from "react";
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./Providers";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "EcoESCOM — Plataforma de residuos",
  description: "Sistema de gestión de residuos ESCOM / IPN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
