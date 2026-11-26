import { AppFooter } from "@/components/AppFooter";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { FallbackNote } from "@/components/FallbackNote";
import { SkipLink } from "@/components/SkipLink";

/**
 * Shell for the tabs (D-033, after the reference prototype): header, main
 * content, dark footer, and the bottom bar on phones (header pills on wide
 * screens). Page roots are narrow by default; a root with class `wide` uses
 * the full desktop width (see globals.css).
 */
export default function TabsLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SkipLink />
      <AppHeader />
      <main id="main" tabIndex={-1} className="page-main mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-6 focus:outline-none sm:px-6 sm:pt-8 lg:pb-16">
        <FallbackNote />
        {children}
      </main>
      <AppFooter />
      <BottomNav />
    </div>
  );
}
