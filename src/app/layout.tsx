import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { DataModeProvider } from "@/contexts/DataModeContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
    <html lang="fr-CH">
      <body className={`${inter.variable} font-sans antialiased`}>
        <DataModeProvider>
          <AuthProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthProvider>
        </DataModeProvider>
        <Toaster />
      </body>
    </html>
  );
}


