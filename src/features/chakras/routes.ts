import type { Locale } from "@/lib/types";

export const chakraRoutes = {
  list: (l: Locale) => `/${l}/practice/chakras/`,
  detail: (l: Locale, id: string) => `/${l}/practice/chakras/${id}/`,
};
