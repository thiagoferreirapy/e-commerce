import type { Metadata, Viewport } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import { site } from "@/config/site";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getNavCategories } from "@/services/catalog";
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

// Viewport: cobre o notch (viewportFit) e tinge a status bar (themeColor) no app
// nativo. O zoom é mantido habilitado para preservar a acessibilidade do site web
// (o mesmo código serve a loja e o app).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#23272F",
};

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Navegação de categorias dinâmica (vinda do banco/admin).
  const navCategories = await getNavCategories();

  // Dados estruturados da organização (SEO).
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: site.name,
    description: site.description,
    url: site.url,
    telephone: site.phone,
  };

  // suppressHydrationWarning: a WebView (Capacitor) / extensões injetam atributos
  // (ex.: --safe-area-inset-*) em <html>/<body> antes da hidratação.
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <Header categories={navCategories} />
        <main className="flex-1">{children}</main>
        <Footer />
        <ToastViewport />
        <SyncProvider />
        <NavigationLoader />
      </body>
    </html>
  );
}
