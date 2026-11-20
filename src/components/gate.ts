import { PREFS_KEY } from "@/lib/storage/schema";

/** Pages a first-time user may open before accepting the safety note (onboarding and the trust pages it links to). */
export const OPEN = /^\/(en|hi|mr)\/(onboarding|info)\//;
const LOCALE_PREFIX = /^\/(en|hi|mr)\//;

/**
 * US-03 / QA-04: no app screen until "I understand" is accepted. Onboarding
 * writes `onboarded: true` only after that step, so the flag is the gate.
 *
 * `gateScript` runs inline in <head> before first paint (hard loads and deep
 * links, e.g. the reminder `.ics` URL); <OnboardingGate/> (client) covers in-app
 * navigation. If storage can't be read at all (some private modes), nobody is
 * locked out: the onboarding screen would never be able to save either.
 */
export function gateScript(): string {
  return `(function(){try{var p=location.pathname;if(${OPEN}.test(p))return;var v=JSON.parse(localStorage.getItem(${JSON.stringify(PREFS_KEY)})||"null");if(!v||v.onboarded!==true){var l=(p.match(${LOCALE_PREFIX})||[])[1]||"en";location.replace("/"+l+"/onboarding/")}}catch(e){}})();`;
}

