"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";

type Challenge = { question: string; token: string };

type ContactGateProps = {
  open: boolean;
  onClose: () => void;
};

export default function ContactGate({ open, onClose }: ContactGateProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [compose, setCompose] = useState("");

  useEffect(() => {
    if (!open) {
      setChallenge(null);
      setAnswer("");
      setError("");
      setBusy(false);
      setCompose("");
      return;
    }

    let cancelled = false;
    setBusy(true);
    fetch("/api/contact", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("challenge");
        return res.json() as Promise<Challenge>;
      })
      .then((data) => {
        if (!cancelled) setChallenge(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load the check. Try again.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => {
      (inputRef.current ?? closeRef.current)?.focus();
    }, 40);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && challenge && !compose) inputRef.current?.focus();
  }, [open, challenge, compose]);

  if (!open) return null;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challenge || busy) return;

    const form = new FormData(event.currentTarget);
    if (String(form.get("company") ?? "").trim()) {
      onClose();
      return;
    }

    setBusy(true);
    setError("");
    const tab = window.open("about:blank", "_blank");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: challenge.token,
          answer,
          company: String(form.get("company") ?? ""),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; compose?: string };
      if (!res.ok || !data.compose) {
        tab?.close();
        setError("Not quite. Try the new question.");
        setAnswer("");
        const next = await fetch("/api/contact", { cache: "no-store" });
        if (next.ok) setChallenge(await next.json());
        return;
      }
      if (tab) {
        tab.location.href = data.compose;
        onClose();
      } else {
        setCompose(data.compose);
      }
    } catch {
      tab?.close();
      setError("Could not verify. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="contact-gate"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="contact-gate-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          ref={closeRef}
          type="button"
          className="contact-gate-close"
          onClick={onClose}
          aria-label="Close contact check"
        >
          ×
        </button>
        <h2 id={titleId} className="contact-gate-title">
          Quick check
        </h2>
        <p className="contact-gate-copy">
          A short question keeps this address off public pages.
        </p>
        {compose ? (
          <a
            className="contact-gate-mail"
            href={compose}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Gmail
          </a>
        ) : (
          <form className="contact-gate-form" onSubmit={onSubmit}>
            <label className="contact-gate-label" htmlFor="contact-answer">
              {challenge?.question ?? "Loading question…"}
            </label>
            <input
              ref={inputRef}
              id="contact-answer"
              name="answer"
              inputMode="numeric"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={!challenge || busy}
              required
            />
            <input
              className="contact-gate-hp"
              type="text"
              name="company"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            {error ? <p className="contact-gate-error">{error}</p> : null}
            <button type="submit" disabled={!challenge || busy || !answer.trim()}>
              {busy ? "Checking…" : "Continue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
