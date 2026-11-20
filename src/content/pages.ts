/**
 * Page-text helpers for `{{feedbackLink}}` (SCHEMA.md rule 6). Pure, so tested.
 */
const TOKEN = /\{\{feedbackLink\}\}/;

/**
 * With a URL, fills in the link. Without one (D-022), removes each sentence
 * that contains the link, plus a directly preceding question that only leads
 * into it ("Found a missing credit? Please tell us."), and drops a paragraph
 * left empty.
 */
export function applyFeedbackLink(markdown: string, url: string | null): string {
  if (url) return markdown.replace(/\{\{feedbackLink\}\}/g, url);
  return markdown
    .split("\n")
    .map((line) => {
      if (!TOKEN.test(line)) return line;
      const sentences = line.split(/(?<=[.?!])\s+/);
      const keep: string[] = [];
      for (const s of sentences) {
        if (TOKEN.test(s)) {
          if (keep.length && keep[keep.length - 1]!.trim().endsWith("?")) keep.pop();
          continue;
        }
        keep.push(s);
      }
      return keep.join(" ");
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}
