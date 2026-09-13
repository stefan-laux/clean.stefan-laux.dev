import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { parseFragment, type DefaultTreeAdapterMap } from "parse5";
import type { Root, RootContent } from "mdast";

const parser = unified().use(remarkParse).use(remarkGfm);
const blockTags = new Set(["address", "article", "aside", "blockquote", "div", "dl", "dt", "dd", "footer", "h1", "h2", "h3", "h4", "h5", "h6", "header", "li", "main", "nav", "ol", "p", "pre", "section", "table", "tr", "ul"]);
const hiddenTags = new Set(["script", "style", "head", "meta", "link", "template", "noscript"]);

// Pasted HTML is parsed into a detached tree, never inserted into the DOM.
function htmlToText(html: string): string {
  function read(node: DefaultTreeAdapterMap["childNode"]): string {
    if (node.nodeName === "#text") return (node as DefaultTreeAdapterMap["textNode"]).value;
    if (!("tagName" in node)) return "";
    if (hiddenTags.has(node.tagName) || node.attrs.some((a) => a.name === "hidden" || (a.name === "aria-hidden" && a.value === "true"))) return "";
    if (node.tagName === "br") return "\n";
    if (node.tagName === "img") return node.attrs.find((a) => a.name === "alt")?.value ?? "";
    const text = node.childNodes.map(read).join("");
    return blockTags.has(node.tagName) ? `\n${text}\n` : text;
  }
  return parseFragment(html).childNodes.map(read).join("").replace(/\n{3,}/g, "\n\n").replace(/^\n|\n$/g, "");
}

function markdownToText(source: string): string {
  const tree = parser.parse(source) as Root;
  function render(node: RootContent | Root): string {
    switch (node.type) {
      case "text": case "inlineCode": case "code": return node.value;
      case "html": return htmlToText(node.value);
      case "break": return "\n";
      case "image": case "imageReference": return node.alt ?? "";
      case "definition": case "thematicBreak": return "";
      case "footnoteReference": return `[${node.label ?? node.identifier}]`;
      case "table": return node.children.map(render).join("\n");
      case "tableRow": return node.children.map(render).join("\t");
      case "list": return node.children.map(render).join("\n");
      case "listItem": case "blockquote": case "footnoteDefinition": return node.children.map(render).join("\n\n");
      case "root": {
        // Preserve original paragraph spacing, including leading/trailing whitespace.
        let cursor = 0;
        let result = "";
        for (const child of node.children) {
          const start = child.position?.start.offset ?? cursor;
          result += source.slice(cursor, start) + render(child);
          cursor = child.position?.end.offset ?? start;
        }
        return result + source.slice(cursor);
      }
      default: return "children" in node ? node.children.map(render).join("") : "";
    }
  }
  return render(tree);
}

export function cleanText(input: string, removeFormatting = true) {
  let invisibleRemoved = 0;
  let spacesNormalized = 0;
  // ZWJ/ZWNJ, variation selectors, emoji tags, and directional controls can carry meaning.
  const normalized = input.replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B\u2060\uFEFF]/g, () => {
      invisibleRemoved++;
      return "";
    })
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, () => {
      spacesNormalized++;
      return " ";
    });
  const text = removeFormatting ? markdownToText(normalized) : normalized;
  return { text, invisibleRemoved, spacesNormalized, formattingRemoved: text !== normalized };
}

export const characterGroups = [
  { id: "dash", label: "Long dashes", sample: "—", description: "Em dash or en dash", pattern: /[—–]/gu },
  { id: "eszett", label: "German ß", sample: "ß", description: "German Eszett (ß or ẞ)", pattern: /[ßẞ]/gu },
  { id: "quotes", label: "Curly quotes", sample: "“ ”", description: "Curly quotation mark", pattern: /[“”„‟‘’‚‛]/gu },
  { id: "ellipsis", label: "Ellipses", sample: "…", description: "Ellipsis character", pattern: /…/gu },
] as const;

export function findCharacters(text: string) {
  return characterGroups.flatMap((group) => Array.from(text.matchAll(group.pattern), (match) => ({ index: match.index, value: match[0], group: group.id, description: group.description }))).sort((a, b) => a.index - b.index);
}

export function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}
