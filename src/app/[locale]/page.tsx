import { LocaleHomeRedirect } from "@/components/RootRedirect";

/** `/en/` → `/en/today/` (or onboarding on first run). Static export has no server redirects. */
export default function LocaleHome() {
  return <LocaleHomeRedirect />;
}
