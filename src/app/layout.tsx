import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import "./globals.css";

// Degular — the MOSH brand typeface (self-hosted, subset to the weights the UI uses).
const degular = localFont({
  src: [
    { path: "../fonts/Degular-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/Degular-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/Degular-RegularItalic.woff2", weight: "400", style: "italic" },
    { path: "../fonts/Degular-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/Degular-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../fonts/Degular-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/Degular-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-degular",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Helvetica Neue", "sans-serif"],
});

export const metadata: Metadata = {
  title: "UGC Suisse | Plateforme Premium de Contenu Créatif",
  description: "La plateforme suisse de référence pour connecter marques et créateurs de contenu UGC en Suisse romande.",
  keywords: ["UGC", "Suisse", "créateurs", "marques", "contenu", "influenceurs"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr-CH" suppressHydrationWarning>
      <body className={`${degular.variable} font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}



