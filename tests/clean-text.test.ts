import assert from "node:assert/strict";
import test from "node:test";
import { cleanText, findCharacters } from "../src/lib/clean-text";

test("plain wording, punctuation and paragraph spacing remain unchanged", () => {
  const text = "Hello, world!  Grüße — groß & schön.\n\n\nDon't change me…\n";
  assert.equal(cleanText(text).text, text);
});

test("removes Markdown without removing the visible words", () => {
  assert.equal(cleanText("## Heading\n\n**Bold** and *italic*, ~~still here~~.\n\n- First\n- Second").text, "Heading\n\nBold and italic, still here.\n\nFirst\nSecond");
});

test("links keep labels, visible URLs and image descriptions", () => {
  assert.equal(cleanText("[Read **this**](https://example.com) and <https://example.org> ![A picture](image.png)").text, "Read this and https://example.org A picture");
});

test("code content stays literal when fences are removed", () => {
  assert.equal(cleanText("```html\n<b>**literal**</b>\n```\n\nUse `x * 2`.").text, "<b>**literal**</b>\n\nUse x * 2.");
});

test("turning formatting removal off preserves exact literal syntax", () => {
  const text = "**literal** #tag\n\n<script>example</script>\n1. first\n```js\nx * 2\n```";
  assert.equal(cleanText(text, false).text, text);
});

test("common hidden characters and special spaces are counted and cleaned", () => {
  assert.deepEqual(cleanText("a\u200Bb\uFEFFc\u00ADd\u2060e\u00A0f\u202Fg", false), { text: "abcde f g", invisibleRemoved: 4, spacesNormalized: 2, formattingRemoved: false });
});

test("emoji and language joiners are preserved", () => {
  const text = "👨‍👩‍👧‍👦 👩🏽‍💻 ❤️ می‌روم क्‍ष مرحبًا שלום";
  assert.equal(cleanText(text).text, text);
});

test("line endings normalize without losing tabs or newlines", () => {
  assert.equal(cleanText("a\tb\r\nc\rd\n", false).text, "a\tb\nc\nd\n");
});

test("HTML markup, attributes, comments and script/style content are removed", () => {
  assert.equal(cleanText('<div data-origin="ai"><p>Hello <b>world</b> &amp; friends.</p><!-- metadata --><script>alert(1)</script><style>p{color:red}</style></div>').text.trim(), "Hello world & friends.");
});

test("inline HTML line breaks do not merge words", () => {
  assert.equal(cleanText("Hello<br>world and <b>friends</b>.").text, "Hello\nworld and friends.");
});

test("HTML table cells keep word boundaries", () => {
  assert.equal(cleanText("<table><tr><td>First</td><td>Second</td></tr></table>").text.trim(), "First\tSecond");
});

test("inline scripts and hidden spans do not leak into output", () => {
  assert.equal(cleanText('Hello<script>alert(1)</script><span hidden>hidden</span> world.').text, "Hello world.");
});

test("decoded entities are also cleaned", () => {
  const result = cleanText("Hello&#8203;&nbsp;world");
  assert.equal(result.text, "Hello world");
  assert.equal(result.invisibleRemoved, 1);
  assert.equal(result.spacesNormalized, 1);
});

test("nested lists, block quotes and tables preserve their text", () => {
  assert.equal(cleanText("> Keep **this**.\n\n- Parent\n  - Child\n\n| Name | Value |\n| --- | --- |\n| Test | 42 |").text, "Keep this.\n\nParent\n\nChild\n\nName\tValue\nTest\t42");
});

test("plain arithmetic, underscores and URLs are not stripped", () => {
  const text = "2 * 3 = 6; a_b_c; x < 5; C++; hello@example.com; https://example.com";
  assert.equal(cleanText(text).text, text);
});

test("highlighting reports positions without changing the source", () => {
  const text = "👋 Grüße — “hello”… ẞ –";
  const matches = findCharacters(text);
  assert.deepEqual(matches.map((match) => match.value), ["ß", "—", "“", "”", "…", "ẞ", "–"]);
  for (const match of matches) assert.equal(text.slice(match.index, match.index + match.value.length), match.value);
  assert.deepEqual(findCharacters(text), matches);
});

test("empty and invisible-only input are safe", () => {
  assert.equal(cleanText("").text, "");
  assert.equal(cleanText("\u200B\uFEFF").text, "");
  assert.deepEqual(findCharacters(""), []);
});

test("long text is preserved without truncation", () => {
  const text = "A sentence with Grüße — and emoji 👩‍💻.\n".repeat(3000);
  assert.equal(cleanText(text).text, text);
});
