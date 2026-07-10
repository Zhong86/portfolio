"use client";

type Token =
  | { type: "h"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "hr" }
  | { type: "blockquote"; text: string }
  | { type: "code_block"; lang: string; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "p"; text: string }
  | { type: "br"; text: string };

function parseInline(text: string): React.ReactNode {
  // Process inline: **bold**, *italic*, `code`, [label](url)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // bold
    const bold = remaining.match(/^([\s\S]*?)\*\*([\s\S]+?)\*\*/);
    // italic (not preceded by another *)
    const italic = remaining.match(/^([\s\S]*?)(?<!\*)\*(?!\*)([\s\S]+?)(?<!\*)\*(?!\*)/);
    // code
    const code = remaining.match(/^([\s\S]*?)`([^`]+)`/);
    // link
    const link = remaining.match(/^([\s\S]*?)\[([^\]]+)\]\(([^)]+)\)/);

    // find which match comes first
    const candidates = [
      bold ? { type: "bold", idx: bold[1].length, match: bold } : null,
      italic ? { type: "italic", idx: italic[1].length, match: italic } : null,
      code ? { type: "code", idx: code[1].length, match: code } : null,
      link ? { type: "link", idx: link[1].length, match: link } : null,
    ].filter(Boolean) as { type: string; idx: number; match: RegExpMatchArray }[];

    if (candidates.length === 0) {
      parts.push(remaining);
      break;
    }

    candidates.sort((a, b) => a.idx - b.idx);
    const winner = candidates[0];

    if (winner.idx > 0) {
      parts.push(winner.match[1]);
    }

    if (winner.type === "bold") {
      parts.push(<strong key={key++} className="text-text font-semibold">{winner.match[2]}</strong>);
      remaining = remaining.slice(winner.match[1].length + winner.match[2].length + 4);
    } else if (winner.type === "italic") {
      parts.push(<em key={key++} className="italic text-text-dim">{winner.match[2]}</em>);
      remaining = remaining.slice(winner.match[1].length + winner.match[2].length + 2);
    } else if (winner.type === "code") {
      parts.push(
        <code key={key++} className="font-mono text-[12px] bg-surface-2 border border-hairline px-1.5 py-0.5 rounded text-accent">
          {winner.match[2]}
        </code>
      );
      remaining = remaining.slice(winner.match[1].length + winner.match[2].length + 2);
    } else if (winner.type === "link") {
      parts.push(
        <a key={key++} href={winner.match[3]} target="_blank" rel="noopener noreferrer"
          className="text-blue hover:text-accent underline underline-offset-2 transition-colors">
          {winner.match[2]}
        </a>
      );
      remaining = remaining.slice(winner.match[1].length + winner.match[2].length + winner.match[3].length + 4);
    }
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function tokenize(md: string): Token[] {
  const tokens: Token[] = [];
  const lines = md.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: "code_block", lang, code: codeLines.join("\n") });
      i++;
      continue;
    }

    // Headings
    const hMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (hMatch) {
      tokens.push({ type: "h", level: hMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6, text: hMatch[2] });
      i++;
      continue;
    }

    // HR
    if (/^---+$/.test(line.trim())) {
      tokens.push({ type: "hr" });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      tokens.push({ type: "blockquote", text: line.slice(2) });
      i++;
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      tokens.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      tokens.push({ type: "ol", items });
      continue;
    }

    // Empty line — skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    tokens.push({ type: "p", text: line });
    i++;
  }

  return tokens;
}

import React from "react";

export default function MarkdownRenderer({ content }: { content: string }) {
  const tokens = tokenize(content);

  const hClasses: Record<number, string> = {
    1: "font-mono text-[20px] font-semibold text-text mt-3 mb-2 leading-snug",
    2: "font-mono text-[16px] font-semibold text-text mt-3 mb-1.5 leading-snug",
    3: "font-mono text-[14px] font-semibold text-accent mt-2 mb-1",
    4: "font-mono text-[13px] font-semibold text-text-dim mt-2 mb-0.5",
    5: "font-mono text-[12px] font-medium text-text-dim mt-1 mb-0.5",
    6: "font-mono text-[11px] font-medium text-text-dimmer uppercase tracking-wide mt-1 mb-0.5",
  };

  const H_TAGS = {
    1: ({ children, className }: { children: React.ReactNode; className: string }) => <h1 className={className}>{children}</h1>,
    2: ({ children, className }: { children: React.ReactNode; className: string }) => <h2 className={className}>{children}</h2>,
    3: ({ children, className }: { children: React.ReactNode; className: string }) => <h3 className={className}>{children}</h3>,
    4: ({ children, className }: { children: React.ReactNode; className: string }) => <h4 className={className}>{children}</h4>,
    5: ({ children, className }: { children: React.ReactNode; className: string }) => <h5 className={className}>{children}</h5>,
    6: ({ children, className }: { children: React.ReactNode; className: string }) => <h6 className={className}>{children}</h6>,
  };


  return (
    <div className="leading-relaxed text-[14px] text-text-dim">
      {tokens.map((token, idx) => {
        if (token.type === "h") {
          const Tag = H_TAGS[token.level];
          return <Tag key={idx} className={hClasses[token.level]}>{parseInline(token.text)}</Tag>;
        }
        if (token.type === "hr") {
          return <hr key={idx} className="border-hairline my-5" />;
        }
        if (token.type === "blockquote") {
          return (
            <blockquote key={idx} className="border-l-2 border-accent/50 pl-4 my-3 font-mono text-[13px] text-text-dimmer italic">
              {parseInline(token.text)}
            </blockquote>
          );
        }
        if (token.type === "code_block") {
          return (
            <div key={idx} className="my-4 rounded-md border border-hairline overflow-hidden">
              {token.lang && (
                <div className="px-4 py-1.5 bg-surface-2 border-b border-hairline font-mono text-[10px] text-text-dimmer">
                  {token.lang}
                </div>
              )}
              <pre className="px-4 py-3.5 bg-surface overflow-x-auto font-mono text-[12px] text-text leading-relaxed whitespace-pre">
                <code>{token.code}</code>
              </pre>
            </div>
          );
        }
        if (token.type === "ul") {
          return (
            <ul key={idx} className="my-3 space-y-1.5 pl-4">
              {token.items.map((item, ii) => (
                <li key={ii} className="flex gap-2.5 font-sans text-[14px] text-text-dim">
                  <span className="font-mono text-accent mt-0.5 shrink-0">–</span>
                  <span>{parseInline(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (token.type === "ol") {
          return (
            <ol key={idx} className="my-3 space-y-1.5 pl-4">
              {token.items.map((item, ii) => (
                <li key={ii} className="flex gap-2.5 font-sans text-[14px] text-text-dim">
                  <span className="font-mono text-accent/70 shrink-0 w-5 text-right">{ii + 1}.</span>
                  <span>{parseInline(item)}</span>
                </li>
              ))}
            </ol>
          );
        }
        if (token.type === "p") {
          return (
            <p key={idx} className="font-sans text-[14px] text-text-dim leading-relaxed my-3">
              {token.text.split("\n").map((line, li, arr) => (
                <React.Fragment key={li}>
                  {parseInline(line)}
                  {li < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
