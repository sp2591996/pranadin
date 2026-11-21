/**
 * City list for sunrise and panchang (FR-8.3). Geo data is code; display
 * names in HI/MR come from content (`glossary` or a future `cities.json`),
 * with these English names as the fallback.
 *
 * Coordinates are city centres (4 decimals ≈ 10 m), plenty for ±2 min sunrise.
 * TODO(PR-9 / Product Q7): extend to ≥ 40 Indian cities; confirm the diaspora list.
 */
import type { TimeZone } from "./types";

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  tz: TimeZone;
  country: string;
}

const IN = "Asia/Kolkata";

export const CITIES: readonly City[] = [
  // India (Maharashtra first: the beachhead, D-006)
  { id: "mumbai", name: "Mumbai", lat: 19.076, lng: 72.8777, tz: IN, country: "IN" },
  { id: "pune", name: "Pune", lat: 18.5204, lng: 73.8567, tz: IN, country: "IN" },
  { id: "thane", name: "Thane", lat: 19.2183, lng: 72.9781, tz: IN, country: "IN" },
  { id: "nagpur", name: "Nagpur", lat: 21.1458, lng: 79.0882, tz: IN, country: "IN" },
  { id: "nashik", name: "Nashik", lat: 19.9975, lng: 73.7898, tz: IN, country: "IN" },
  { id: "chhatrapati-sambhajinagar", name: "Chhatrapati Sambhajinagar", lat: 19.8762, lng: 75.3433, tz: IN, country: "IN" },
  { id: "kolhapur", name: "Kolhapur", lat: 16.705, lng: 74.2433, tz: IN, country: "IN" },
  { id: "new-delhi", name: "New Delhi", lat: 28.6139, lng: 77.209, tz: IN, country: "IN" },
  { id: "chennai", name: "Chennai", lat: 13.0827, lng: 80.2707, tz: IN, country: "IN" },
  { id: "kolkata", name: "Kolkata", lat: 22.5726, lng: 88.3639, tz: IN, country: "IN" },
  { id: "bengaluru", name: "Bengaluru", lat: 12.9716, lng: 77.5946, tz: IN, country: "IN" },
  { id: "hyderabad", name: "Hyderabad", lat: 17.385, lng: 78.4867, tz: IN, country: "IN" },
  { id: "ahmedabad", name: "Ahmedabad", lat: 23.0225, lng: 72.5714, tz: IN, country: "IN" },
  { id: "surat", name: "Surat", lat: 21.1702, lng: 72.8311, tz: IN, country: "IN" },
  { id: "jaipur", name: "Jaipur", lat: 26.9124, lng: 75.7873, tz: IN, country: "IN" },
  { id: "lucknow", name: "Lucknow", lat: 26.8467, lng: 80.9462, tz: IN, country: "IN" },
  { id: "varanasi", name: "Varanasi", lat: 25.3176, lng: 82.9739, tz: IN, country: "IN" },
  { id: "patna", name: "Patna", lat: 25.5941, lng: 85.1376, tz: IN, country: "IN" },
  { id: "bhopal", name: "Bhopal", lat: 23.2599, lng: 77.4126, tz: IN, country: "IN" },
  { id: "indore", name: "Indore", lat: 22.7196, lng: 75.8577, tz: IN, country: "IN" },
  { id: "ujjain", name: "Ujjain", lat: 23.1765, lng: 75.7885, tz: IN, country: "IN" },
  { id: "chandigarh", name: "Chandigarh", lat: 30.7333, lng: 76.7794, tz: IN, country: "IN" },
  { id: "amritsar", name: "Amritsar", lat: 31.634, lng: 74.8723, tz: IN, country: "IN" },
  { id: "haridwar", name: "Haridwar", lat: 29.9457, lng: 78.1642, tz: IN, country: "IN" },
  { id: "guwahati", name: "Guwahati", lat: 26.1445, lng: 91.7362, tz: IN, country: "IN" },
  { id: "bhubaneswar", name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, tz: IN, country: "IN" },
  { id: "thiruvananthapuram", name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, tz: IN, country: "IN" },
  { id: "kochi", name: "Kochi", lat: 9.9312, lng: 76.2673, tz: IN, country: "IN" },
  { id: "panaji", name: "Panaji (Goa)", lat: 15.4909, lng: 73.8278, tz: IN, country: "IN" },
  // Diaspora
  { id: "london", name: "London", lat: 51.5074, lng: -0.1278, tz: "Europe/London", country: "GB" },
  { id: "leicester", name: "Leicester", lat: 52.6369, lng: -1.1398, tz: "Europe/London", country: "GB" },
  { id: "edison-nj", name: "Edison, New Jersey", lat: 40.5187, lng: -74.4121, tz: "America/New_York", country: "US" },
  { id: "new-york", name: "New York", lat: 40.7128, lng: -74.006, tz: "America/New_York", country: "US" },
  { id: "chicago", name: "Chicago", lat: 41.8781, lng: -87.6298, tz: "America/Chicago", country: "US" },
  { id: "houston", name: "Houston", lat: 29.7604, lng: -95.3698, tz: "America/Chicago", country: "US" },
  { id: "san-jose", name: "San Jose (Bay Area)", lat: 37.3382, lng: -121.8863, tz: "America/Los_Angeles", country: "US" },
  { id: "toronto", name: "Toronto", lat: 43.6532, lng: -79.3832, tz: "America/Toronto", country: "CA" },
  { id: "dubai", name: "Dubai", lat: 25.2048, lng: 55.2708, tz: "Asia/Dubai", country: "AE" },
  { id: "singapore", name: "Singapore", lat: 1.3521, lng: 103.8198, tz: "Asia/Singapore", country: "SG" },
  { id: "kathmandu", name: "Kathmandu", lat: 27.7172, lng: 85.324, tz: "Asia/Kathmandu", country: "NP" },
  { id: "sydney", name: "Sydney", lat: -33.8688, lng: 151.2093, tz: "Australia/Sydney", country: "AU" },
  { id: "melbourne", name: "Melbourne", lat: -37.8136, lng: 144.9631, tz: "Australia/Melbourne", country: "AU" },
  { id: "auckland", name: "Auckland", lat: -36.8485, lng: 174.7633, tz: "Pacific/Auckland", country: "NZ" },
  { id: "port-louis", name: "Port Louis", lat: -20.1609, lng: 57.5012, tz: "Indian/Mauritius", country: "MU" },
];

/** FR-2: skipping the city step uses New Delhi, labelled as the default. */
export const DEFAULT_CITY_ID = "new-delhi";

const byId = new Map(CITIES.map((c) => [c.id, c]));

export function getCity(id: string | null | undefined): City {
  return (id && byId.get(id)) || byId.get(DEFAULT_CITY_ID)!;
}

/** Display names in Devanagari (D-030: the whole app is in the chosen language). Drafts, like other hi/mr text. */
const HI: Record<string, string> = {
  mumbai: "मुंबई", pune: "पुणे", thane: "ठाणे", nagpur: "नागपुर", nashik: "नासिक",
  "chhatrapati-sambhajinagar": "छत्रपति संभाजीनगर", kolhapur: "कोल्हापुर", "new-delhi": "नई दिल्ली",
  chennai: "चेन्नई", kolkata: "कोलकाता", bengaluru: "बेंगलुरु", hyderabad: "हैदराबाद", ahmedabad: "अहमदाबाद",
  surat: "सूरत", jaipur: "जयपुर", lucknow: "लखनऊ", varanasi: "वाराणसी", patna: "पटना", bhopal: "भोपाल",
  indore: "इंदौर", ujjain: "उज्जैन", chandigarh: "चंडीगढ़", amritsar: "अमृतसर", haridwar: "हरिद्वार",
  guwahati: "गुवाहाटी", bhubaneswar: "भुवनेश्वर", thiruvananthapuram: "तिरुवनंतपुरम", kochi: "कोच्चि",
  panaji: "पणजी (गोवा)", london: "लंदन", leicester: "लेस्टर", "edison-nj": "एडिसन, न्यू जर्सी",
  "new-york": "न्यूयॉर्क", chicago: "शिकागो", houston: "ह्यूस्टन", "san-jose": "सैन जोस (बे एरिया)",
  toronto: "टोरंटो", dubai: "दुबई", singapore: "सिंगापुर", kathmandu: "काठमांडू", sydney: "सिडनी",
  melbourne: "मेलबर्न", auckland: "ऑकलैंड", "port-louis": "पोर्ट लुई",
};
const MR: Record<string, string> = {
  ...HI,
  nagpur: "नागपूर", nashik: "नाशिक", kolhapur: "कोल्हापूर", "new-delhi": "नवी दिल्ली", bengaluru: "बंगळुरू",
  hyderabad: "हैदराबाद", varanasi: "वाराणसी", indore: "इंदूर", chandigarh: "चंदीगड", haridwar: "हरिद्वार",
  guwahati: "गुवाहाटी", bhubaneswar: "भुवनेश्वर", thiruvananthapuram: "तिरुवनंतपुरम", kochi: "कोची",
  panaji: "पणजी (गोवा)", london: "लंडन", leicester: "लेस्टर", "edison-nj": "एडिसन, न्यू जर्सी",
  "new-york": "न्यू यॉर्क", houston: "ह्यूस्टन", "san-jose": "सॅन होजे (बे एरिया)", dubai: "दुबई",
  singapore: "सिंगापूर", kathmandu: "काठमांडू", sydney: "सिडनी", melbourne: "मेलबर्न", auckland: "ऑकलंड",
  "port-louis": "पोर्ट लुई", mumbai: "मुंबई", amritsar: "अमृतसर", ahmedabad: "अहमदाबाद", surat: "सुरत",
  lucknow: "लखनौ", patna: "पाटणा", bhopal: "भोपाळ", ujjain: "उज्जैन", chennai: "चेन्नई", kolkata: "कोलकाता",
  jaipur: "जयपूर", chicago: "शिकागो", toronto: "टोरांटो",
};

/** City name for display in a locale (English name where no translation exists). */
export function cityName(city: City, locale: "en" | "hi" | "mr"): string {
  return (locale === "hi" ? HI[city.id] : locale === "mr" ? MR[city.id] : undefined) ?? city.name;
}

/** True if the query matches the city's English or translated name. */
export function cityMatches(city: City, q: string): boolean {
  const s = q.trim().toLowerCase();
  return !s || [city.name, HI[city.id] ?? "", MR[city.id] ?? "", city.id].some((n) => n.toLowerCase().includes(s));
}
