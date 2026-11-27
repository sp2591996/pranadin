import type { Locale } from "@/lib/types";

export const yatraRoutes = {
  list: (l: Locale) => `/${l}/yatra/`,
  detail: (l: Locale, id: string) => `/${l}/yatra/${id}/`,
  planner: (l: Locale) => `/${l}/yatra/plan/`,
};
