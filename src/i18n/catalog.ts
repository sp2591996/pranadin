/**
 * UI string key registry (E-03 / E-02 contract).
 *
 * - Keys are the contract between code and Content. Code may only call
 *   `t()` with a key from here, so a typo fails `tsc`.
 * - `en` is a **developer placeholder**, not final copy. Content owns the
 *   real text in `app/content/ui/{en,hi,mr}.json`, which overrides it.
 *   The content test lists every key still on its placeholder; that list
 *   must be empty at content freeze.
 * - `note` tells translators where the string appears.
 * - Key naming: `<area>.<screen-or-component>.<element>`; plurals use the
 *   suffixes `.one` / `.other` (see `pluralCategory`).
 *
 * Dev-2: add keys for your screens here (same PR as the screen), then tell
 * Content in your stand-up so they can write the copy.
 */
export const catalog = {
  "app.name": { en: "PranaDin", note: "Product name. Do not translate; HI/MR use प्राणदिन (D-021)." },
  "app.tagline": { en: "Daily practice, calendar and journal", note: "Placeholder; Content to write. Under the name on onboarding and About." },
  "app.betaBadge": { en: "Beta", note: "Small badge in the header." },

  "nav.label": { en: "Main", note: "Screen-reader name of the bottom navigation." },
  "nav.today": { en: "Today", note: "Bottom nav tab." },
  "nav.practice": { en: "Practice", note: "Bottom nav tab." },
  "nav.calendar": { en: "Calendar", note: "Bottom nav tab." },
  "nav.journal": { en: "Journal", note: "Bottom nav tab." },
  "nav.me": { en: "Me and settings", note: "Header button label (icon only, read by screen readers)." },
  "nav.back": { en: "Back", note: "App bar back button." },
  "nav.skipToContent": { en: "Skip to main content", note: "Keyboard skip link." },

  "common.comingSoon": { en: "This screen is being built.", note: "Placeholder body on unfinished screens." },
  "common.offline": { en: "You are offline. Your practice and journal still work.", note: "Offline banner." },
  "common.availableInEnglish": { en: "Available in English", note: "Shown when an item has no reviewed translation yet." },
  "common.languageLabel": { en: "Language", note: "Label above the language switcher." },

  "root.choose": { en: "Choose your language", note: "Root page before redirect; shown in all three languages." },

  "today.title": { en: "Today", note: "Screen title." },
  "today.greeting.morning": { en: "Good morning", note: "Greeting 04:00–11:59 local time." },
  "today.greeting.afternoon": { en: "Good afternoon", note: "Greeting 12:00–16:59." },
  "today.greeting.evening": { en: "Good evening", note: "Greeting 17:00–20:59." },
  "today.greeting.night": { en: "Peaceful night", note: "Greeting 21:00–03:59." },

  "panchang.indicative": { en: "Indicative · may vary by region", note: "Required label on every computed panchang value (FR-8.1)." },
  "panchang.sunrise": { en: "Sunrise", note: "Panchang strip." },
  "panchang.sunset": { en: "Sunset", note: "Panchang strip." },
  "panchang.tithi": { en: "Tithi", note: "Panchang strip label." },
  "panchang.nakshatra": { en: "Nakshatra", note: "Panchang strip label." },
  "panchang.paksha.shukla": { en: "Shukla paksha", note: "Waxing fortnight." },
  "panchang.paksha.krishna": { en: "Krishna paksha", note: "Waning fortnight." },
  "panchang.until": { en: "until {time}", note: "After a tithi name: when it ends. {time} is a local time." },
  "panchang.defaultCity": { en: "{city} (default) · Change", note: "Shown when no city is chosen (FR-8)." },
  "panchang.adhik": { en: "Adhik", note: "Prefix for a leap lunar month." },

  "practice.title": { en: "Practice", note: "Screen title." },
  "calendar.title": { en: "Calendar", note: "Screen title." },
  "journal.title": { en: "Journal", note: "Screen title." },
  "journal.deviceOnly": { en: "Saved only on this phone. Clearing browser data deletes it.", note: "Under the editor (FR-10.4)." },

  "onboarding.title": { en: "Welcome", note: "Onboarding screen title." },
  "settings.title": { en: "Me", note: "Settings screen title." },
  "settings.clearData": { en: "Clear my data", note: "Destructive action in Settings." },
  "settings.privacy": { en: "Privacy and your data", note: "Settings row." },
  "settings.help": { en: "Help and safety", note: "Settings row, same place on every screen." },

  "trust.about": { en: "About PranaDin", note: "Trust page title." },
  "trust.privacy": { en: "Privacy notice", note: "Trust page title." },
  "trust.terms": { en: "Terms of use", note: "Trust page title." },
  "trust.disclaimer": { en: "Health and content disclaimer", note: "Trust page title." },
  "trust.safety": { en: "Help and safety", note: "Trust page title." },
  "trust.sources": { en: "Sources and credits", note: "Trust page title." },
  "trust.ai-use": { en: "How we use AI", note: "Trust page title." },
  "trust.corrections": { en: "Corrections", note: "Trust page title." },

  "notFound.title": { en: "Page not found", note: "404 page." },
  "notFound.home": { en: "Go to Today", note: "404 page link." },
} as const satisfies Record<string, { en: string; note: string }>;

export type MessageKey = keyof typeof catalog;
export type Messages = Record<MessageKey, string>;

export const MESSAGE_KEYS = Object.keys(catalog) as MessageKey[];
