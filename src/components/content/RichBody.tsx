import { cn } from "@/lib/utils";
import { Fragment, type ReactNode } from "react";

/**
 * RichBody — renders the markdown-ish plain text stored on Service / Article /
 * ServiceArea `body` fields as styled JSX inside `.prose-site`.
 *
 * Supported syntax (no external markdown lib — node_modules is frozen):
 *   - `##` / `###` / `####` headings (a lone `#` is treated as `##` since the
 *     page already renders the h1)
 *   - paragraphs separated by blank lines
 *   - numbered lists (`1.` and zero-padded `01.` markers, blank lines between
 *     items tolerated)
 *   - bulleted lists (`-`, `*`, `+` markers with content)
 *   - `---` horizontal rules; stray single-character scrape artifacts
 *     (lone `-`, `+`, `*`, `--`) are skipped
 *   - inline `**bold**` and `*italic*`
 */

type Block =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ol"; items: string[]; start: number }
  | { type: "ul"; items: string[] }
  | { type: "hr" };

const HEADING_RE = /^(#{1,4})\s+(.*)$/;
const ORDERED_RE = /^(\d{1,3})[.)]\s+(\S.*)$/;
const BULLET_RE = /^[-*+]\s+(\S.*)$/;
const HR_RE = /^-{3,}$/;
/** Scrape artifacts from embedded widgets on the source site. */
const JUNK_RE = /^([-+*]|-{2})$/;

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split(/\r?\n/);

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue; // blank lines separate blocks; lists close on non-list content
    if (JUNK_RE.test(line)) continue;

    if (HR_RE.test(line)) {
      if (blocks[blocks.length - 1]?.type !== "hr") blocks.push({ type: "hr" });
      continue;
    }

    const heading = HEADING_RE.exec(line);
    if (heading) {
      const level = Math.min(Math.max(heading[1].length, 2), 4) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, text: heading[2].trim() });
      continue;
    }

    const ordered = ORDERED_RE.exec(line);
    if (ordered) {
      const prev = blocks[blocks.length - 1];
      if (prev?.type === "ol") prev.items.push(ordered[2]);
      else blocks.push({ type: "ol", items: [ordered[2]], start: parseInt(ordered[1], 10) || 1 });
      continue;
    }

    const bullet = BULLET_RE.exec(line);
    if (bullet) {
      const prev = blocks[blocks.length - 1];
      if (prev?.type === "ul") prev.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}

/** Render `*italic*` pairs inside a plain-text segment. */
function renderItalics(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*([^*\n]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) out.push(text.slice(last, match.index));
    out.push(<em key={`${keyBase}-em-${i++}`}>{match[1]}</em>);
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * Render `**bold**` / `*italic*` inline marks. The source text sometimes lost
 * the spaces around `**` markers when scraped ("will**test, inspect**your"),
 * so a space is restored when a bold run sits flush against a word character.
 */
function renderInline(text: string, keyBase: string): ReactNode[] {
  const parts = text.split("**");
  // Unbalanced ** — restore the final marker as literal text.
  if (parts.length % 2 === 0) {
    const tail = parts.pop() as string;
    parts[parts.length - 1] += `**${tail}`;
  }

  const out: ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 1) {
      const prev = parts[i - 1];
      const next = parts[i + 1];
      const needSpaceBefore = /[A-Za-z0-9)]$/.test(prev ?? "");
      const needSpaceAfter = /^[A-Za-z0-9(]/.test(next ?? "");
      out.push(
        <Fragment key={`${keyBase}-b-${i}`}>
          {needSpaceBefore ? " " : null}
          <strong>{renderItalics(part.trim(), `${keyBase}-b-${i}`)}</strong>
          {needSpaceAfter ? " " : null}
        </Fragment>
      );
    } else if (part) {
      out.push(<Fragment key={`${keyBase}-t-${i}`}>{renderItalics(part, `${keyBase}-t-${i}`)}</Fragment>);
    }
  }
  return out;
}

function BlockView({ block, index }: { block: Block; index: number }) {
  const key = `blk-${index}`;
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as "h2" | "h3" | "h4";
      return <Tag>{renderInline(block.text, key)}</Tag>;
    }
    case "ol":
      return (
        <ol start={block.start !== 1 ? block.start : undefined}>
          {block.items.map((item, i) => (
            <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
          ))}
        </ol>
      );
    case "ul":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
          ))}
        </ul>
      );
    case "hr":
      return <hr className="my-8 border-line" />;
    case "paragraph":
      return <p>{renderInline(block.text, key)}</p>;
  }
}

export function RichBody({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;
  return (
    <div className={cn("prose-site text-body leading-relaxed", className)}>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} index={i} />
      ))}
    </div>
  );
}
