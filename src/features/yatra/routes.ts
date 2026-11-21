import type { Locale } from "@/lib/types";

export const yatraRoutes = {
  list: (l: Locale) => `/${l}/practice/yatra/`,
  detail: (l: Locale, id: string) => `/${l}/practice/yatra/${id}/`,
  planner: (l: Locale) => `/${l}/practice/yatra/plan/`,
};
