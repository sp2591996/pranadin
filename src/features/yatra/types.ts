import type { FestivalTradition, Txt } from "@/features/festivals/types";

export type { Txt };
export type DayPart = "morning" | "afternoon" | "evening";
export type BudgetBand = "budget" | "mid" | "comfort";
export interface Range {
  min: number;
  max: number;
}
export interface Gateway {
  nearest: Txt;
  km: number;
  how: Txt;
}
export interface ItineraryView {
  days: 1 | 2 | 3;
  title: Txt;
  plan: { part: DayPart; text: Txt }[][];
}
export interface PlaceView {
  id: string;
  name: Txt;
  state: Txt;
  stateKey: string;
  traditions: FestivalTradition[];
  deity: Txt;
  significance: Txt;
  tagline: Txt;
  overview: Txt;
  story: Txt;
  storySource: Txt;
  bestMonths: number[];
  seasons: { months: number[]; rating: "best" | "good" | "difficult"; weather: Txt }[];
  reach: { air: Gateway; rail: Gateway; road: { how: Txt; km: number } };
  localTransport: Txt;
  festivals: { festivalId: string; name: Txt; note: Txt }[];
  nearby: { name: Txt; km: number; note: Txt }[];
  photos: { file: string; caption: Txt; credit: string; ai: boolean; source?: string }[];
  sources: { label: string; url: string }[];
  sights: { id: string; name: Txt; desc: Txt; timings: Txt; dress: Txt }[];
  darshan: { tips: Txt[]; online: Txt };
  itineraries: ItineraryView[];
  stay: { title: Txt; body: Txt }[];
  food: { title: Txt; body: Txt }[];
  satvik: Txt;
  budget: { bands: Record<BudgetBand, Range>; note: Txt };
  health: Txt[];
  etiquette: Txt[];
}
