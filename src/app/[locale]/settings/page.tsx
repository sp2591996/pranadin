import { SimpleScreen } from "@/components/SimpleScreen";
import { SettingsLinks } from "@/components/SettingsLinks";

/** "Me" / settings (E-11, Dev-2). Trust links are here now so they are reachable in 2 taps (FR-13). */
export default function SettingsPage() {
  return (
    <SimpleScreen titleKey="settings.title">
      <SettingsLinks />
    </SimpleScreen>
  );
}
