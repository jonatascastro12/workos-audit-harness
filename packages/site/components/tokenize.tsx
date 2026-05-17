import { Fragment } from "react";

export type TokType =
  | "str"
  | "num"
  | "kw"
  | "id"
  | "flag"
  | "punct"
  | "cmt"
  | "ok"
  | "stop"
  | "prompt"
  | "plain";

export type Token = { type: TokType; text: string };

const KW = new Set([
  "const", "let", "var", "function", "async", "await", "return",
  "import", "from", "export", "new", "class", "interface", "type",
  "if", "else", "for", "while", "do", "switch", "case", "break",
  "continue", "try", "catch", "finally", "throw", "typeof",
  "instanceof", "delete", "void", "in", "of",
  "true", "false", "null", "undefined",
  "npm", "ask",
]);

const STR_RE = /^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/;
const NUM_RE = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/;
const FLAG_RE = /^--?[A-Za-z][\w-]*/;
const ID_RE = /^[A-Za-z_][\w]*/;

/**
 * Tokenize a single line. Returns plain-text tokens for whitespace.
 * Whole-line shell comments and ✓/✗ prefixes are recognized.
 */
export function tokenizeLine(line: string): Token[] {
  const trimmed = line.trimStart();
  if (trimmed.startsWith("#")) return [{ type: "cmt", text: line }];

  if (line.startsWith("✓ ") || line.startsWith("✓\t")) {
    return [{ type: "ok", text: "✓ " }, ...tokenizeLine(line.slice(2))];
  }
  if (
    line.startsWith("✗ ") ||
    line.startsWith("× ") ||
    line.startsWith("✗\t") ||
    line.startsWith("×\t")
  ) {
    return [
      { type: "stop", text: line.slice(0, 2) },
      ...tokenizeLine(line.slice(2)),
    ];
  }
  if (line.startsWith("$ ")) {
    return [{ type: "prompt", text: "$ " }, ...tokenizeLine(line.slice(2))];
  }

  return tokenizeInline(line);
}

/**
 * Tokenize a string fragment (no shell-prefix detection). Use this for
 * embedded snippets like action names, targets, or "key: value" detail
 * strings where there's no shell context.
 */
export function tokenizeInline(text: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  while (pos < text.length) {
    const rest = text.slice(pos);

    const ws = rest.match(/^\s+/);
    if (ws) {
      tokens.push({ type: "plain", text: ws[0] });
      pos += ws[0].length;
      continue;
    }

    if (rest[0] === "#") {
      tokens.push({ type: "cmt", text: rest });
      break;
    }

    let m = rest.match(STR_RE);
    if (m) { tokens.push({ type: "str", text: m[0] }); pos += m[0].length; continue; }

    m = rest.match(NUM_RE);
    if (m) { tokens.push({ type: "num", text: m[0] }); pos += m[0].length; continue; }

    m = rest.match(FLAG_RE);
    if (m) { tokens.push({ type: "flag", text: m[0] }); pos += m[0].length; continue; }

    m = rest.match(ID_RE);
    if (m) {
      const t = m[0];
      tokens.push({ type: KW.has(t) ? "kw" : "id", text: t });
      pos += t.length;
      continue;
    }

    tokens.push({ type: "punct", text: rest[0] });
    pos += 1;
  }
  return tokens;
}

export function classFor(t: TokType): string {
  switch (t) {
    case "str":    return "tok-str";
    case "num":    return "tok-num";
    case "kw":     return "tok-kw";
    case "flag":   return "tok-flag";
    case "punct":  return "tok-punct";
    case "cmt":    return "tok-cmt";
    case "ok":     return "ok";
    case "stop":   return "stop";
    case "prompt": return "accent";
    case "id":
    case "plain":
      return "";
  }
}

/**
 * Render a string as syntax-highlighted tokens. For embedded use inside
 * existing terminal layouts (the Ask section, captions, etc.).
 */
export function Tokenized({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const toks = tokenizeInline(text);
  return (
    <span className={className}>
      {toks.map((tk, i) => (
        <Fragment key={i}>
          <span className={classFor(tk.type)}>{tk.text}</span>
        </Fragment>
      ))}
    </span>
  );
}
