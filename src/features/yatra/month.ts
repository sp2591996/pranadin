import type { Locale } from "@/i18n/config";
import { formatDateKey } from "@/i18n/format";

/** Month name in the reader's language (1 = January). */
export const monthName = (m: number, locale: Locale) => formatDateKey(`2027-${String(m).padStart(2, "0")}-01`, locale, { month: "long" });
