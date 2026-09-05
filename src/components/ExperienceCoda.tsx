"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const CODA_ITALIC =
  "A lifetime of passion for engineering and physics has made me who I am. ";
const CODA_ASK = "Want to know more? ";
const CODA_BODY = CODA_ITALIC + CODA_ASK;
const CODA_LINK = "Reach out.";
const CODA_REVEAL_DELAY_MS = 520;
const CODA_REVEAL_DURATION_MS = 4800;

type CodaWord = { text: string; roman: boolean };
type CodaLine = { words: CodaWord[]; hasLink: boolean };

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function tokenize(text: string, roman: boolean): CodaWord[] {
  return (text.match(/\S+\s*/g) ?? []).map((token) => ({ text: token, roman }));
}

const CODA_WORDS: CodaWord[] = [
  ...tokenize(CODA_ITALIC, false),
  ...tokenize(CODA_ASK, true),
];

function groupWordsIntoLines(
  words: CodaWord[],
  wordEls: Array<HTMLSpanElement | null>,
  linkEl: HTMLSpanElement | null,
): CodaLine[] {
  const parts: { top: number; word?: CodaWord; link?: boolean }[] = [];

  words.forEach((word, i) => {
    const el = wordEls[i];
    if (el) parts.push({ top: el.offsetTop, word });
  });
  if (linkEl) parts.push({ top: linkEl.offsetTop, link: true });
  if (!parts.length) return [];

  const lines: CodaLine[] = [];
  let current: CodaLine = { words: [], hasLink: false };
  let lastTop = parts[0].top;

  for (const part of parts) {
    if (Math.abs(part.top - lastTop) > 3) {
      lines.push(current);
      current = { words: [], hasLink: false };
      lastTop = part.top;
    }
    if (part.word) current.words.push(part.word);
    if (part.link) current.hasLink = true;
  }
  if (current.words.length || current.hasLink) lines.push(current);
  return lines;
}

function applyLineReveal(lineEls: NodeListOf<HTMLElement>, progress: number) {
  const count = lineEls.length;
  lineEls.forEach((el, i) => {
    const start = i / count;
    const end = (i + 1) / count;
    const local = Math.min(1, Math.max(0, (progress - start) / (end - start)));
    el.style.setProperty("--line-reveal", String(local));
    if (local >= 1) {
      el.style.setProperty("-webkit-mask-image", "none");
      el.style.setProperty("mask-image", "none");
    } else {
      el.style.removeProperty("-webkit-mask-image");
      el.style.removeProperty("mask-image");
    }
  });
}

function CodaLink() {
  return (
    <Link href="/#contact" className="experience-coda-link">
      {[...CODA_LINK].map((ch, i) => (
        <span
          key={i}
          className="experience-coda-char"
          style={{ "--char-i": i } as CSSProperties}
        >
          {ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </Link>
  );
}

function CodaWordSpan({ word }: { word: CodaWord }) {
  return word.roman ? (
    <span className="experience-coda-roman">{word.text}</span>
  ) : (
    <span>{word.text}</span>
  );
}

export default function ExperienceCoda() {
  const rootRef = useRef<HTMLElement>(null);
  const typeRef = useRef<HTMLSpanElement>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const linkWrapRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [settled, setSettled] = useState(false);
  const [lines, setLines] = useState<CodaLine[] | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      setVisible(true);
      setSettled(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (lines) return;
    const id = window.requestAnimationFrame(() => {
      const grouped = groupWordsIntoLines(
        CODA_WORDS,
        wordRefs.current,
        linkWrapRef.current,
      );
      if (grouped.length) setLines(grouped);
    });
    return () => window.cancelAnimationFrame(id);
  }, [lines]);

  useEffect(() => {
    const onResize = () => {
      wordRefs.current = [];
      setLines(null);
      setSettled(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!visible || settled || !lines?.length) return;

    const lineEls = () =>
      typeRef.current?.querySelectorAll<HTMLElement>(".experience-coda-line");

    if (prefersReducedMotion()) {
      const els = lineEls();
      if (els?.length) applyLineReveal(els, 1);
      setSettled(true);
      return;
    }

    let raf = 0;
    let startTime = 0;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime - CODA_REVEAL_DELAY_MS;
      if (elapsed < 0) {
        raf = window.requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(1, elapsed / CODA_REVEAL_DURATION_MS);
      const eased = 1 - (1 - t) ** 2.2;
      const els = lineEls();
      if (els?.length) applyLineReveal(els, eased);

      if (t < 1) {
        raf = window.requestAnimationFrame(tick);
        return;
      }

      if (els?.length) applyLineReveal(els, 1);
      setSettled(true);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [visible, settled, lines]);

  const bodyClass = [
    "experience-coda-body",
    settled && "experience-coda-body--settled",
    visible && !settled && "experience-coda-body--revealing",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside
      ref={rootRef}
      className={`experience-coda${visible ? " experience-coda--visible" : ""}`}
    >
      <p className="experience-coda-lead">But there&apos;s more...</p>
      <p className={bodyClass}>
        <span className="sr-only">
          {CODA_BODY}
          {CODA_LINK}
        </span>
        <span
          ref={typeRef}
          className={`experience-coda-type${lines ? "" : " experience-coda-type--measure"}`}
          aria-hidden="true"
        >
          {lines ? (
            lines.map((line, lineIndex) => (
              <span key={lineIndex} className="experience-coda-line">
                {line.words.map((word, wordIndex) => (
                  <CodaWordSpan key={wordIndex} word={word} />
                ))}
                {line.hasLink ? <CodaLink /> : null}
              </span>
            ))
          ) : (
            <>
              {CODA_WORDS.map((word, i) => (
                <span
                  key={i}
                  ref={(node) => {
                    wordRefs.current[i] = node;
                  }}
                  className={`experience-coda-word${word.roman ? " experience-coda-roman" : ""}`}
                >
                  {word.text}
                </span>
              ))}
              <span ref={linkWrapRef} className="experience-coda-word">
                <CodaLink />
              </span>
            </>
          )}
        </span>
      </p>
    </aside>
  );
}
