import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { I18nProvider } from "@/i18n/client";
import { isLocale, LOCALES } from "@/i18n/config";
import { loadMessages } from "@/content/load";
import { ThemeSync } from "@/components/ThemeSync";
import { fontClassName } from "../fonts";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const { messages } = loadMessages(isLocale(locale) ? locale : "en");
  return {
    title: { default: messages["common.appName"], template: `%s · ${messages["common.appName"]}` },
    description: messages["common.tagline"],
    applicationName: messages["common.appName"],
    icons: { icon: "/favicon.svg", apple: "/icons/apple-touch-icon.png" },
    manifest: "/manifest.webmanifest",
    robots: { index: false, follow: false }, // quiet beta; flip at launch (M2)
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF7F0" },
    { media: "(prefers-color-scheme: dark)", color: "#16110D" },
  ],
};

/** Root layout for every localized page: sets <html lang> per locale (WCAG 3.1.1). */
export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { messages, fallbackCount } = loadMessages(locale);
  return (
    <html lang={locale} className={fontClassName}>
      <body className="min-h-dvh antialiased">
        <I18nProvider locale={locale} messages={messages} fallbackCount={fallbackCount}>
          <ThemeSync />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
