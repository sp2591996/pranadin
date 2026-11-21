import type { Locale } from "@/lib/types";

export const festivalRoutes = {
  list: (l: Locale) => `/${l}/calendar/festivals/`,
  detail: (l: Locale, id: string) => `/${l}/calendar/festivals/${id}/`,
};
