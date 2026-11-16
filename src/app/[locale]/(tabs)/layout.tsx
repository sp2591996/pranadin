import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SkipLink } from "@/components/SkipLink";

/** Shell for the 4 tabs: header with "Me", main content, bottom navigation. */
export default function TabsLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <>
      <SkipLink />
      <AppHeader />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-xl px-[var(--gutter)] pt-4 pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+24px)] focus:outline-none"
      >
        {children}
      </main>
      <BottomNav />
    </>
  );
}
