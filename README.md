# clean.

A small Next.js app for turning pasted text into plain text. Paste on the left; the cleaned result updates immediately on the right. Copy with one click.

## Run locally

Requires Node.js 20.9 or later.

```sh
npm install
npm run dev
```

Open http://localhost:3000.

```sh
npm test       # Text-preservation and cleanup tests
npm run lint  # ESLint
npm run build # Production build, including TypeScript validation
npm start     # Serve the production build
```

## Behavior

- Pasting into the textarea accepts plain text, discarding rich-text fonts, colors, clipboard HTML, and its attributes.
- Live cleanup removes common zero-width spaces, word joiners, soft hyphens, BOMs, and nonprinting control characters. Unusual spaces become regular spaces; line endings become LF.
- Optional Markdown/HTML stripping removes headings, emphasis, list markers, code fences, tags, comments, hidden elements, and script/style content. Visible words, code contents, link labels, image descriptions, and bare URLs stay. Link targets and definitions are formatting metadata and are removed. Tables become tab-separated text.
- Disable markup stripping when symbols or raw code should be kept literally. Any markup interpretation can be ambiguous, so the original remains available beside the output.
- Optional character highlighting marks em/en dashes, German ß/ẞ, curly quotes, and ellipses. It never replaces these characters. These are normal writing choices, not evidence of AI authorship.
- The copy button writes only `text/plain`, with no highlight styling. Manually copying a selection from the output also writes only plain text. If clipboard access fails, the output is selected for keyboard copying.
- Emoji sequences, ZWJ/ZWNJ language joiners, variation selectors, and directional controls are preserved because they can carry meaning.

All text processing takes place in the browser. There are no API requests containing text, accounts, analytics, storage, external fonts, or AI services. Text is held only in memory and is lost on reload. Clipboard access requires HTTPS or localhost and may be blocked by browser permissions.

This is a formatting cleaner, not a watermark detector or AI detector. It cannot promise removal of every possible watermark, particularly statistical patterns encoded in word choice. It does not rewrite text.

## Implementation

Next.js App Router, TypeScript, React, plain CSS, remark for Markdown parsing, and parse5 for detached HTML parsing. HTML is never rendered from user input. The app also feature-detects the optional WebMCP `document.modelContext` API and exposes `prepare_clean_text`, which updates the same visible interface without saving or copying text.

- `src/app/page.tsx`: editor, preview, toggles, clipboard behavior
- `src/app/globals.css`: responsive layout and theme
- `src/lib/clean-text.ts`: cleanup and character highlighting
- `tests/clean-text.test.ts`: preservation, Markdown, HTML, Unicode, and large-input checks

Deploy as a normal Next.js app using `npm run build` and `npm start`. No environment variables or server-side services are required.
