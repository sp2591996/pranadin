import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { FallbackNote } from "@/components/FallbackNote";
import { SkipLink } from "@/components/SkipLink";

/** Shell for the 5 tabs: header with "Me", main content, bottom navigation (phones) or header tab pills (tablet and up). */
export default function TabsLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <SkipLink />
      <AppHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-xl px-[var(--size-gutter)] pt-5 pb-[calc(var(--size-nav)+env(safe-area-inset-bottom)+24px)] focus:outline-none md:max-w-3xl md:pt-8 md:pb-16"
      >
        <FallbackNote />
        {children}
      </main>
      <BottomNav />
    </>
  );
}
