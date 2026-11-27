/**
 * Minimal Markdown renderer for Content's trust pages (server component,
 * build time only). Supports what the pages use: #/##/### headings,
 * paragraphs, `-`/`*` lists, **bold**, [links](target), tables and `---`.
 * Output is React elements only (no raw HTML), so nothing in a file can
 * inject markup. Unknown syntax renders as plain text.
 */
import Link from "next/link";
import type { ReactNode } from "react";

export interface MarkdownProps {
  source: string;
  /** Resolve a relative link target (`disclaimer`) to an app href, or null to leave as text. */
  resolveHref: (target: string) => string | null;
}

/** At least 44 px tall and wide, like every other target (QA-18). */
const LINK = "inline-flex min-h-11 min-w-11 items-center text-primary underline underline-offset-2";

function inline(text: string, resolveHref: MarkdownProps["resolveHref"], keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  // **bold** | *italic* or _italic_ | [label](target)
  const re = /\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|(?<![\w])_([^_]+)_(?![\w])|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const key = `${keyBase}-${i++}`;
    if (m[1] !== undefined) {
      out.push(<strong key={key}>{m[1]}</strong>);
    } else if (m[2] !== undefined || m[3] !== undefined) {
      out.push(<em key={key}>{m[2] ?? m[3]}</em>);
    } else {
      const label = m[4]!;
      const target = m[5]!;
      if (/^https:\/\//.test(target)) {
        out.push(
          <a key={key} href={target} rel="noopener noreferrer" target="_blank" className={LINK}>
            {label}
          </a>,
        );
      } else if (/^(mailto|tel):/.test(target)) {
        out.push(
          <a key={key} href={target} className={LINK}>
            {label}
          </a>,
        );
      } else {
        const href = resolveHref(target);
        out.push(
          href ? (
            <Link key={key} href={href} className={LINK}>
              {label}
            </Link>
          ) : (
            label
          ),
        );
      }
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

export function Markdown({ source, resolveHref }: MarkdownProps) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  const key = () => `b${k++}`;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim() === "") {
      i++;
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1]!.length;
      const kb = key();
      // The page title is the app bar h1, so Markdown "#" renders as h2.
      if (level <= 2) blocks.push(<h2 key={kb} className="mt-6 mb-2 text-h2">{inline(h[2]!, resolveHref, kb)}</h2>);
      else blocks.push(<h3 key={kb} className="mt-4 mb-1 text-h3">{inline(h[2]!, resolveHref, kb)}</h3>);
      i++;
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) {
      blocks.push(<hr key={key()} className="my-6 border-divider" />);
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i]!)) items.push(lines[i++]!.replace(/^\s*[-*]\s+/, ""));
      const kb = key();
      blocks.push(
        <ul key={kb} className="my-3 list-disc space-y-2 pl-6">
          {items.map((it, j) => (
            <li key={j}>{inline(it, resolveHref, `${kb}-${j}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\s*\|/.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && /^\s*\|/.test(lines[i]!)) rows.push(lines[i++]!);
      const [head, , ...body] = rows;
      const kb = key();
      blocks.push(
        // Keyboard users must be able to scroll a wide table (axe scrollable-region-focusable, QA-14).
        <div key={kb} className="relative my-4 overflow-x-auto rounded-sm focus-visible:outline-2" tabIndex={0} role="region" aria-label={cells(head!).join(", ")}>
          <table className="w-full border-collapse text-small">
            <thead>
              <tr>
                {cells(head!).map((c, j) => (
                  <th key={j} scope="col" className="border-b border-divider p-2 text-left font-semibold">
                    {inline(c, resolveHref, `${kb}-h${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>
                  {cells(r).map((c, j) => (
                    <td key={j} className="border-b border-divider p-2 align-top">
                      {inline(c, resolveHref, `${kb}-${ri}-${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() !== "" &&
      !/^(#{1,3}\s|\s*[-*]\s|\s*\||-{3,}\s*$)/.test(lines[i]!)
    )
      para.push(lines[i++]!.trim());
    const kb = key();
    blocks.push(
      <p key={kb} className="my-3">
        {inline(para.join(" "), resolveHref, kb)}
      </p>,
    );
  }
  return <div className="text-body-lg">{blocks}</div>;
}
