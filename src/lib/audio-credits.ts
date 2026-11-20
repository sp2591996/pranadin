/**
 * Parses the credits table in `public/audio/CREDITS.md` (pure; the page reads
 * the file at build time). Columns, in order: file, title, author, licence,
 * link, note. An optional header named "AI-generated" (yes/no) marks AI audio,
 * and a note that says "AI-generated" does the same. None yet.
 */
export interface AudioCredit {
  file: string;
  title: string;
  author: string;
  licence: string;
  link: string | null;
  note: string;
  aiGenerated: boolean;
}

const cells = (line: string) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

export function parseCredits(md: string): AudioCredit[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const head = lines.findIndex((l) => /^\|\s*File in app\s*\|/i.test(l));
  if (head < 0) return [];
  const names = cells(lines[head]!).map((c) => c.toLowerCase());
  const col = (re: RegExp, fallback: number) => {
    const i = names.findIndex((n) => re.test(n));
    return i >= 0 ? i : fallback;
  };
  const iFile = col(/^file/, 0);
  const iTitle = col(/title/, 1);
  const iAuthor = col(/author/, 2);
  const iLicence = col(/licen[cs]e/, 3);
  const iLink = col(/page|link|url/, 4);
  const iNote = col(/note/, 5);
  const iAi = names.findIndex((n) => /ai/.test(n) && /generated/.test(n));
  const out: AudioCredit[] = [];
  for (const line of lines.slice(head + 1)) {
    if (!line.trim().startsWith("|")) break;
    const c = cells(line);
    if (c.every((x) => /^[-:\s]*$/.test(x))) continue;
    const link = c[iLink] ?? "";
    const note = c[iNote] ?? "";
    out.push({
      file: c[iFile] ?? "",
      title: c[iTitle] ?? "",
      author: c[iAuthor] ?? "",
      licence: c[iLicence] ?? "",
      link: /^https:\/\//.test(link) ? link : null,
      note,
      aiGenerated: (iAi >= 0 && /^(yes|true|y)$/i.test(c[iAi] ?? "")) || /AI-generated/i.test(note),
    });
  }
  return out.filter((r) => r.file);
}
