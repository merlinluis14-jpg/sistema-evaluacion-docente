import type { Metadata, Viewport } from "next";

import { NextAuthProvider } from "@/providers/NextAuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://evaluacion-docenteuptex.org"),
  title: "Sistema de Evaluación Docente UPTex",
  description: "Plataforma institucional para la evaluación docente de UPTex",
  icons: {
    icon: "/uptexlogo.png",
    shortcut: "/uptexlogo.png",
    apple: "/uptexlogo.png",
  },
  openGraph: {
    title: "Sistema de Evaluación Docente UPTex",
    description: "Plataforma institucional para la evaluación docente de UPTex",
    siteName: "UPTex Evaluación Docente",
    type: "website",
    locale: "es_MX",
    images: [
      {
        url: "/uptexlogo.png",
        width: 512,
        height: 512,
        alt: "UPTex",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Sistema de Evaluación Docente UPTex",
    description: "Plataforma institucional para la evaluación docente de UPTex",
    images: ["/uptexlogo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}
