import React from "react";

export type DescBlock =
  | { type: "status"; text: string }
  | { type: "heading"; text: string }
  | { type: "section"; text: string }
  | { type: "auth"; text: string }
  | { type: "kv"; items: { label: string; value: string }[] }
  | { type: "list"; title?: string; items: string[] }
  | { type: "paragraph"; text: string }
  | { type: "closing"; lines: string[] };

const KV_LABELS =
  /^(flavour|flavor|nicotine|volume|pg\/vg|brand|product name|dimension|size|weight|battery|output|material|capacity|color|colours|colors|includes|parameter|parameters|features|variant|compatible|resistance|charging|display|chipset|body material|tank capacity|power range|operating|specifications?|spesification|specification|contents?|net weight)\b/i;

const SECTION_ONLY =
  /^(specification|specifications|spesification|features|includes|parameter|parameters|contents?|compatible(?:\s+for)?|package contents?|variant)\s*[:：]?\s*$/i;

function normalizeLines(raw: string): string[] {
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

  // Standalone dot separators from Laravel copy
  text = text.replace(/\n\s*\.\s*\n/g, "\n\n");
  text = text.replace(/(^|\n)\s*\.\s*(?=\n|$)/g, "\n");

  // Flattened copy: split on " . "
  if (!text.includes("\n") || text.split("\n").length < 3) {
    text = text.replace(/\s+\.\s+/g, "\n");
  }

  // Authenticity on its own line
  text = text.replace(/(\S)\s+(\*?100%\s*Authentic[^\n]*)/gi, "$1\n$2");

  // Split consecutive Label : value pairs
  text = text.replace(
    /\s+(?=(?:Flavour|Flavor|Nicotine|Volume|PG\/VG|Brand|Product Name|Dimension|Size|Weight|Net Weight|Battery|Output|Material|Capacity|Color|Colors|Colours|Includes|Parameter|Parameters|Features|Variant|Compatible|Resistance|Charging|Display|Chipset|Specification|Specifications)\s*[:：])/gi,
    "\n",
  );

  // Expand jammed bullets: "foo - bar - baz" when many hyphen bullets
  text = text.replace(/(?:^|\n)\s*-\s+/g, "\n- ");
  // If a line contains multiple " - " bullet-like chunks, split them
  text = text
    .split("\n")
    .flatMap((line) => {
      const trimmed = line.trim();
      if (!trimmed) return [];
      // Already a single bullet
      if (/^[-•*]\s+\S/.test(trimmed) && (trimmed.match(/\s+-\s+/g) || []).length < 2) {
        return [trimmed];
      }
      // Section label + bullets jammed: "Specification : - a - b"
      const sectionBullet = trimmed.match(
        /^(specification|specifications|spesification|features|includes|parameter|parameters|contents?)\s*[:：]\s*(.+)$/i,
      );
      if (sectionBullet && /[-•*]/.test(sectionBullet[2])) {
        return [sectionBullet[1].replace(/\s*$/, "") + " :", ...splitBullets(sectionBullet[2])];
      }
      // Many inline " - " separators → bullet list
      if ((trimmed.match(/\s+-\s+/g) || []).length >= 2 && !KV_LABELS.test(trimmed)) {
        return splitBullets(trimmed);
      }
      return [trimmed];
    })
    .join("\n");

  return text
    .split("\n")
    .map((l) => l.replace(/^\s*\.\s*/, "").trim())
    .filter((l) => l && l !== ".");
}

function splitBullets(chunk: string): string[] {
  return chunk
    .split(/\s+[-•*]\s+/)
    .map((s) => s.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean)
    .map((s) => `- ${s}`);
}

function parseKv(line: string): { label: string; value: string } | null {
  const m = line.match(/^([^:]{2,40})\s*[:：]\s*(.+)$/);
  if (!m) return null;
  const label = m[1].trim();
  const value = m[2].trim();
  if (!value) return null;
  // Don't treat bullet dump as a single kv value
  if (/^[-•*]/.test(value) || (value.match(/\s+-\s+/g) || []).length >= 2) return null;
  if (!KV_LABELS.test(label) && !/^[A-Za-z][A-Za-z0-9 &/+-]{1,24}$/.test(label)) {
    if (label.length > 28 || label.split(" ").length > 4) return null;
  }
  return { label: titleLabel(label), value };
}

function titleLabel(label: string) {
  const map: Record<string, string> = {
    flavour: "Flavour",
    flavor: "Flavour",
    nicotine: "Nicotine",
    volume: "Volume",
    "pg/vg": "PG/VG",
    brand: "Brand",
    "product name": "Product Name",
    specification: "Specification",
    specifications: "Specifications",
    weight: "Weight",
    "net weight": "Weight",
  };
  const key = label.toLowerCase();
  if (map[key]) return map[key];
  return label
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function isBullet(line: string) {
  return /^[-•*]\s+\S/.test(line);
}

function bulletText(line: string) {
  return line.replace(/^[-•*]\s+/, "").trim();
}

/** Bold known emphasis words inside list/paragraph copy. */
function richText(text: string) {
  const parts = text.split(/\b(PERFECT|TASTELESS|ORIGINAL|AUTHENTIC|READY STOCK)\b/gi);
  return parts.map((part, i) => {
    if (/^(PERFECT|TASTELESS|ORIGINAL|AUTHENTIC|READY STOCK)$/i.test(part)) {
      return (
        <strong key={`${part}-${i}`} className="pdp-desc__em">
          {part.toUpperCase()}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export function parseProductDescription(raw: string): DescBlock[] {
  const lines = normalizeLines(raw);
  if (!lines.length) return [];

  const blocks: DescBlock[] = [];
  let kvBuf: { label: string; value: string }[] = [];
  let listBuf: string[] = [];
  let listTitle: string | undefined;
  let paraBuf: string[] = [];

  const flushKv = () => {
    if (!kvBuf.length) return;
    blocks.push({ type: "kv", items: kvBuf });
    kvBuf = [];
  };
  const flushList = () => {
    if (!listBuf.length) return;
    blocks.push({ type: "list", title: listTitle, items: listBuf });
    listBuf = [];
    listTitle = undefined;
  };
  const flushPara = () => {
    if (!paraBuf.length) return;
    blocks.push({ type: "paragraph", text: paraBuf.join(" ") });
    paraBuf = [];
  };
  const flushAllInline = () => {
    flushPara();
    flushKv();
    flushList();
  };

  for (const line of lines) {
    if (/^ready\s*stock/i.test(line)) {
      flushAllInline();
      blocks.push({
        type: "status",
        text: line.replace(/!+/g, "").trim().toUpperCase() || "READY STOCK",
      });
      continue;
    }

    if (/^\*?\s*100%\s*authentic/i.test(line) || /^\*\s*100%/i.test(line)) {
      flushAllInline();
      blocks.push({ type: "auth", text: line.replace(/^\*\s*/, "").trim() });
      continue;
    }

    if (/^terima kasih/i.test(line) || /^45\s*vape$/i.test(line)) {
      flushAllInline();
      const last = blocks[blocks.length - 1];
      if (last?.type === "closing") last.lines.push(line);
      else blocks.push({ type: "closing", lines: [line] });
      continue;
    }

    if (SECTION_ONLY.test(line)) {
      flushPara();
      flushKv();
      flushList();
      listTitle = titleLabel(line.replace(/[:：]\s*$/, "").trim());
      continue;
    }

    if (isBullet(line)) {
      flushPara();
      flushKv();
      listBuf.push(bulletText(line));
      continue;
    }

    const kv = parseKv(line);
    if (kv) {
      flushPara();
      flushList();
      kvBuf.push(kv);
      continue;
    }

    const isHeading =
      line.length <= 64 &&
      !/[.!?]$/.test(line) &&
      (line === line.toUpperCase() || /^[A-Z0-9][A-Z0-9 \-&.']+$/.test(line)) &&
      line.split(" ").length <= 8;

    if (isHeading && !kvBuf.length && !listBuf.length) {
      flushAllInline();
      blocks.push({ type: "heading", text: line });
      continue;
    }

    flushKv();
    flushList();
    paraBuf.push(line);
  }

  flushAllInline();
  return blocks;
}

export function descriptionLead(raw: string, fallback: string) {
  const blocks = parseProductDescription(raw);
  const auth = blocks.find((b) => b.type === "auth");
  if (auth && auth.type === "auth") return auth.text;
  const para = blocks.find((b) => b.type === "paragraph");
  if (para && para.type === "paragraph") {
    return para.text.length > 160 ? `${para.text.slice(0, 157).trim()}…` : para.text;
  }
  const heading = blocks.find((b) => b.type === "heading");
  if (heading && heading.type === "heading") return heading.text;
  const plain = raw.replace(/\s+/g, " ").trim();
  if (!plain) return fallback;
  return plain.length > 160 ? `${plain.slice(0, 157).trim()}…` : plain;
}

export function ProductDescription({ text }: { text: string }) {
  const blocks = parseProductDescription(text);
  if (!blocks.length) {
    return <p className="pdp-desc__para">{text}</p>;
  }

  return (
    <div className="pdp-desc">
      {blocks.map((block, i) => {
        if (block.type === "status") {
          return (
            <p key={i} className="pdp-desc__status">
              {block.text}
            </p>
          );
        }
        if (block.type === "heading") {
          return (
            <h3 key={i} className="pdp-desc__heading">
              {block.text}
            </h3>
          );
        }
        if (block.type === "section") {
          return (
            <h4 key={i} className="pdp-desc__section">
              {block.text}
            </h4>
          );
        }
        if (block.type === "auth") {
          return (
            <p key={i} className="pdp-desc__auth">
              {block.text}
            </p>
          );
        }
        if (block.type === "kv") {
          return (
            <dl key={i} className="pdp-desc__kv">
              {block.items.map((item) => (
                <div key={`${item.label}-${item.value}`} className="pdp-desc__row">
                  <dt>{item.label}</dt>
                  <dd>{richText(item.value)}</dd>
                </div>
              ))}
            </dl>
          );
        }
        if (block.type === "list") {
          return (
            <div key={i} className="pdp-desc__list-wrap">
              {block.title ? <h4 className="pdp-desc__section">{block.title}</h4> : null}
              <ul className="pdp-desc__list">
                {block.items.map((item) => (
                  <li key={item}>{richText(item)}</li>
                ))}
              </ul>
            </div>
          );
        }
        if (block.type === "closing") {
          return (
            <div key={i} className="pdp-desc__closing">
              {block.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          );
        }
        return (
          <p key={i} className="pdp-desc__para">
            {richText(block.text)}
          </p>
        );
      })}
    </div>
  );
}
