import fs from "node:fs";
import path from "node:path";
import { parseCredits } from "@/lib/audio-credits";

/** Build-time only (reads public/audio/CREDITS.md). Server Component. */
export function loadAudioCredits() {
  const file = path.join(process.cwd(), "public", "audio", "CREDITS.md");
  return fs.existsSync(file) ? parseCredits(fs.readFileSync(file, "utf8")) : [];
}

interface Labels {
  title: string;
  intro: string;
  author: string;
  licence: string;
  source: string;
  ai: string;
  generated: string;
  team: string;
  madeForApp: string;
  publicDomain: string;
  sourceTitle: string;
  /** Translated track names by audio file (e.g. "nature/rain.mp3"). */
  trackNames: Record<string, string>;
}

/** Standard credit phrases are shown in the user's language; names, titles and licence codes stay as published. */
function phrase(labels: Labels, text: string, kind: "author" | "licence") {
  if (kind === "author" && /^PranaDin team/i.test(text)) return { text: labels.team, lang: undefined };
  if (kind === "licence" && /^Made for this app/i.test(text)) return { text: labels.madeForApp, lang: undefined };
  if (kind === "licence" && /^Public domain$/i.test(text)) return { text: labels.publicDomain, lang: undefined };
  return { text, lang: "en" as const };
}

/** "Audio credits" section of the Sources page: one entry per recording, from CREDITS.md. */
export function AudioCredits({ labels }: { labels: Labels }) {
  const credits = loadAudioCredits();
  return (
    <section aria-labelledby="audio-credits-h" className="mt-8">
      <h2 id="audio-credits-h">{labels.title}</h2>
      <p className="mb-3 text-text-muted">{labels.intro}</p>
      <ul className="divide-y divide-divider rounded-lg border border-divider bg-surface" data-testid="audio-credits">
        {credits.map((c) => (
          <li key={c.file} className="flex flex-col gap-1 px-4 py-3">
            <span className="font-semibold [overflow-wrap:anywhere]">
              {labels.trackNames[c.file] ?? c.title}
              {c.aiGenerated ? (
                <span className="ms-2 rounded-full bg-primary-tint px-2 py-0.5 text-[0.875rem] font-semibold text-on-primary-tint">{labels.ai}</span>
              ) : null}
            </span>
            <span className="text-[0.875rem] leading-5 text-text-muted [overflow-wrap:anywhere]">
              {labels.author}: <span lang={phrase(labels, c.author, "author").lang}>{phrase(labels, c.author, "author").text}</span>
            </span>
            <span className="text-[0.875rem] leading-5 text-text-muted [overflow-wrap:anywhere]">
              {labels.licence}: <span lang={phrase(labels, c.licence, "licence").lang}>{phrase(labels, c.licence, "licence").text}</span>
            </span>
            {!c.aiGenerated ? (
              <span className="text-[0.875rem] leading-5 text-text-muted [overflow-wrap:anywhere]">
                {labels.sourceTitle}: <span lang="en">{c.title}</span>
              </span>
            ) : null}
            {c.link ? (
              <a href={c.link} rel="noopener noreferrer" className="min-h-11 py-2 text-[0.875rem] leading-5 text-primary underline [overflow-wrap:anywhere]">
                {labels.source}: <span lang="en">{c.link.replace(/^https:\/\//, "")}</span>
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[0.875rem] leading-5 text-text-muted">
        {labels.generated}
      </p>
    </section>
  );
}
