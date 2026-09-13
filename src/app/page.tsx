"use client";

import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type ReactNode } from "react";
import { characterGroups, cleanText, countWords, findCharacters } from "@/lib/clean-text";

function Icon({ name, size = 18 }: { name: "copy" | "paste" | "arrow" | "check" | "shield" | "close" | "spark"; size?: number }) {
  const paths: Record<string, ReactNode> = {
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    paste: <><path d="M9 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" /><rect x="9" y="2" width="6" height="5" rx="1" /><path d="M8 12h8M8 16h5" /></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" /><path d="M20 2v4m-2-2h4" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Toggle({ checked, onChange, children, description }: { checked: boolean; onChange: () => void; children: ReactNode; description: string }) {
  return <button className="toggle-control" role="switch" aria-checked={checked} onClick={onChange} title={description}><span className="switch-track"><span /></span><span>{children}</span></button>;
}

const example = "## A little less formatting\n\n**Good text** deserves a clean start — without the extra styling.\n\n- Keep every word exactly as it is.\n- Say “hello” to simple, copy-ready text.\n- Grüße aus der Schweiz…\n\nJust\u200B your\u00A0words. Nothing extra.";

export default function Home() {
  const [input, setInput] = useState("");
  const [removeFormatting, setRemoveFormatting] = useState(true);
  const [highlight, setHighlight] = useState(true);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyVersion = useRef(0);
  const result = useMemo(() => cleanText(input, removeFormatting), [input, removeFormatting]);
  const matches = useMemo(() => findCharacters(result.text), [result.text]);
  const words = useMemo(() => countWords(result.text), [result.text]);
  const charCount = useMemo(() => Array.from(result.text).length, [result.text]);

  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  function resetFeedback() {
    copyVersion.current++;
    setCopied(false);
    setNotice("");
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }

  function updateInput(value: string) {
    resetFeedback();
    setInput(value);
  }

  async function paste() {
    try {
      const text = await navigator.clipboard.readText();
      updateInput(text);
      inputRef.current?.focus();
    } catch {
      setNotice("Clipboard access is unavailable. Click the input and paste with Ctrl+V or ⌘V.");
      inputRef.current?.focus();
    }
  }

  async function copy() {
    if (!result.text) return;
    const version = ++copyVersion.current;
    try {
      await navigator.clipboard.writeText(result.text);
      if (version !== copyVersion.current) return;
      setCopied(true);
      setNotice("Clean text copied to clipboard.");
      copyTimer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      if (version !== copyVersion.current) return;
      const selection = window.getSelection();
      const range = document.createRange();
      if (outputRef.current && selection) {
        range.selectNodeContents(outputRef.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setNotice("Clipboard access is unavailable. Your clean text is selected; press Ctrl+C or ⌘C to copy.");
    }
  }

  function copySelection(event: ClipboardEvent<HTMLDivElement>) {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      event.preventDefault();
      event.clipboardData.setData("text/plain", selection.toString());
    }
  }

  function highlightedText() {
    const pieces: ReactNode[] = [];
    let cursor = 0;
    for (const match of matches) {
      pieces.push(result.text.slice(cursor, match.index));
      pieces.push(<mark key={match.index} title={match.description} data-character={match.group}>{match.value}</mark>);
      cursor = match.index + match.value.length;
    }
    pieces.push(result.text.slice(cursor));
    return pieces;
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="clean home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>clean<span className="brand-period">.</span></a>
        <span className="header-note"><Icon name="shield" size={16} /> Just your browser. Just your words.</span>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <div><div className="eyebrow">THE PLAIN TEXT TOOL</div><h1 id="page-title">Your words. <span>Nothing extra.</span></h1><p>Paste your text. Leave the formatting behind.</p></div>
          <button className="example-button" onClick={() => { updateInput(example); inputRef.current?.focus(); }}>Try an example <Icon name="arrow" size={16} /></button>
        </section>

        <section className="workspace" aria-label="Text cleaner">
          <div className="workspace-toolbar">
            <span className="live-label"><span /> Cleans as you type</span>
            <Toggle checked={removeFormatting} onChange={() => { resetFeedback(); setRemoveFormatting(!removeFormatting); }} description="Remove Markdown and HTML markup. Turn off to keep literal symbols or code.">Strip Markdown &amp; HTML</Toggle>
          </div>
          <div className="editors">
            <section className="editor input-editor" aria-labelledby="input-label">
              <div className="editor-heading"><div><span className="step">01</span><label id="input-label" htmlFor="source-text">Original text</label></div><div className="input-actions">{input && <button className="icon-button" title="Clear text" aria-label="Clear text" onClick={() => { updateInput(""); inputRef.current?.focus(); }}><Icon name="close" size={16} /></button>}<button className="small-button" onClick={paste}><Icon name="paste" size={15} /> Paste</button></div></div>
              <textarea id="source-text" ref={inputRef} value={input} onChange={(e) => updateInput(e.target.value)} spellCheck={false} autoComplete="off" autoCapitalize="off" aria-describedby="input-hint" placeholder={"Paste anything here…\n\nFrom ChatGPT, Claude, an email, a document.\nWe’ll take care of the formatting."} />
              <div className="editor-footer"><span>{input ? `${countWords(input).toLocaleString()} words` : "Your text stays on this device"}</span><span id="input-hint">Plain text in</span></div>
            </section>

            <div className="flow-arrow" aria-hidden="true"><Icon name="arrow" size={17} /></div>

            <section className="editor output-editor" aria-labelledby="output-label">
              <div className="editor-heading"><div><span className="step">02</span><h2 id="output-label">Clean text</h2></div><span className={`output-status ${result.text ? "ready" : ""}`}>{result.text ? <><Icon name="check" size={14} /> Ready to copy</> : "PLAIN & SIMPLE"}</span></div>
              <div className={`output-body ${result.text ? "has-text" : ""}`}>
                {result.text ? <div className="clean-output" ref={outputRef} role="textbox" aria-readonly="true" aria-multiline="true" aria-labelledby="output-label" tabIndex={0} onCopy={copySelection}>{highlight ? highlightedText() : result.text}</div> : <div className="empty-output"><span className="empty-icon"><Icon name="spark" size={27} /></span><h3>A fresh start for your text.</h3><p>Your clean version appears here<br />as soon as you start typing.</p><span className="empty-caption">Same words. A clean slate.</span></div>}
              </div>
              <div className="editor-footer"><span>{words.toLocaleString()} words <span className="separator">/</span> {charCount.toLocaleString()} characters</span><span>Plain text out</span></div>
            </section>
          </div>

          <div className="workspace-bottom"><div className="cleanup-summary"><span className="summary-icon"><Icon name="check" size={16} /></span><div><strong>{input ? (result.formattingRemoved || result.invisibleRemoved || result.spacesNormalized ? "A little lighter. All yours." : "Already looking clean.") : "Formatting goes. Your words stay."}</strong><p>{input ? `${result.invisibleRemoved} invisible characters removed · ${result.spacesNormalized} spaces normalized${result.formattingRemoved ? " · Markup removed" : ""}` : "No fonts, colors, or rich-text clipboard data."}</p></div></div><button className={`copy-button ${copied ? "is-copied" : ""}`} onClick={copy} disabled={!result.text}><Icon name={copied ? "check" : "copy"} size={18} />{copied ? "Copied!" : "Copy clean text"}</button></div>
        </section>

        <section className={`review-panel ${highlight ? "enabled" : ""}`} aria-labelledby="review-title">
          <div className="review-top"><div className="review-heading"><span className="review-symbol" aria-hidden="true">Aa</span><div><h2 id="review-title">A second look <span className="optional-badge">OPTIONAL</span></h2><p>Spot distinctive punctuation and characters. Keep every word.</p></div></div><Toggle checked={highlight} onChange={() => setHighlight(!highlight)} description="Highlight long dashes, German ß, curly quotes, and ellipses without changing the output.">Highlight characters</Toggle></div>
          {highlight && <div className="review-details"><div className="character-chips">{characterGroups.map((group) => { const count = matches.filter((match) => match.group === group.id).length; return <span className={`character-chip ${count ? "found" : ""}`} key={group.id}><span className="character-sample">{group.sample}</span>{group.label}<span className="character-count">{count}</span></span>; })}</div><p>These are normal writing choices, including German ß. They aren’t proof of AI use.</p></div>}
        </section>
        <p className="status-message" role="status" aria-live="polite">{notice}</p>
      </main>

      <footer className="site-footer"><span><Icon name="shield" size={15} /> Text is processed locally. Never uploaded or saved.</span><details><summary>What gets cleaned?</summary><div className="cleaning-info"><p>Rich-text styling and clipboard HTML metadata are discarded. Common zero-width spaces, soft hyphens, and invisible control characters are removed; unusual spaces become regular spaces.</p><p>With markup stripping on, Markdown and HTML formatting becomes plain text. Link labels and code content stay; link destinations, tags, and formatting markers go. Turn it off for literal Markdown or code.</p><p>Spelling and punctuation are never rewritten. Language joiners and emoji sequences stay intact. This tool cannot detect or guarantee removal of every watermark, including patterns encoded in word choice.</p></div></details></footer>
    </div>
  );
}
