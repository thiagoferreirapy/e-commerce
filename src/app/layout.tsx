import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import { site } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastViewport } from "@/components/ui/ToastViewport";
import { SyncProvider } from "@/components/system/SyncProvider";
import { NavigationLoader } from "@/components/system/NavigationLoader";
import "./globals.css";

// Tipografia única (substituto livre da Proxima Nova: Montserrat — sans
// geométrica-humanista) para títulos e corpo. Para usar a Proxima Nova real,
// troque por next/font/local apontando para os .woff2 licenciados, ou pelo kit
// do Adobe Fonts, mantendo a variável --font-sans.
const sans = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: ["capacete", "escapamento", "acessórios moto", "pneu moto", "jaqueta motociclista"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Dados estruturados da organização (SEO).
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phone,
  };

  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ToastViewport />
        <SyncProvider />
        <NavigationLoader />
      </body>
    </html>
  );
}
