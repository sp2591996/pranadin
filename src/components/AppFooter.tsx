"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/client";
import { routes } from "@/lib/routes";

/** Deep-brown footer (D-033, after the reference prototype). Text is always light on it. */
export function AppFooter() {
  const { t, locale } = useI18n();
  const links = [
    { href: routes.trust(locale, "about"), label: t("me.about") },
    { href: routes.trust(locale, "privacy"), label: t("privacy.readNotice") },
    { href: routes.trust(locale, "disclaimer"), label: t("help.disclaimer") },
    { href: routes.trust(locale, "sources"), label: t("me.sources") },
  ];
  return (
    <footer className="app-footer border-t border-black/30 bg-[#241007] pb-[calc(var(--size-nav)+env(safe-area-inset-bottom))] text-[#EADBC4] lg:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <span className="font-deva text-2xl leading-none text-[#F3C35B]">ॐ</span>
            </span>
            <div>
              <p className="font-display text-[1.25rem] font-semibold text-[#FDF3E1]">
                {t("common.appName")}
                {locale === "en" && (
                  <span aria-hidden="true">
                    {" · "}
                    <span className="font-deva">प्राणदिन</span>
                  </span>
                )}
              </p>
              <p className="text-small text-[#D9C6A8]">{t("footer.tagline")}</p>
            </div>
          </div>
          <p className="text-small text-[#F0D69A]">
            <span aria-hidden="true" className="font-deva">
              ॐ सर्वे भवन्तु सुखिनः ·{" "}
            </span>
            {t("footer.blessing")}
          </p>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-5 sm:justify-start">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="inline-flex min-h-11 items-center text-small text-[#EADBC4] underline-offset-4 hover:text-[#FDF3E1] hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t border-white/10 pt-6 text-center text-small text-[#C9B596] sm:flex-row sm:text-left">
          <p>
            © {new Date().getFullYear()} {t("common.appName")}. {t("footer.copyright")}
          </p>
          <p>{t("footer.disclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
