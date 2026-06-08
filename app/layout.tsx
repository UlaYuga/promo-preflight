import type { Metadata } from "next";
import { Inter_Tight, JetBrains_Mono, Manrope } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import { TourContainer } from "@/components/tour-container";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans"
});

const interTight = Inter_Tight({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter-tight"
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://promo-preflight-production.up.railway.app"),
  title: {
    default: "Promo Preflight",
    template: "%s | Promo Preflight"
  },
  description:
    "Deterministic pre-launch review workflow for synthetic campaign scenarios, with a separate authenticated API contract.",
  applicationName: "Promo Preflight",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false }
  },
  openGraph: {
    title: "Promo Preflight",
    description:
      "Deterministic pre-launch review workflow for synthetic campaign scenarios, with a separate authenticated API contract.",
    url: "https://promo-preflight-production.up.railway.app/",
    siteName: "Promo Preflight",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <I18nProvider>
          <TourContainer />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
