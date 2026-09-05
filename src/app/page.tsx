"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import NeuralNet from "@/components/NeuralNet";

function NameLines() {
  return (
    <>
      <span className="name-line">Vyaas</span>
      <span className="name-space"> </span>
      <span className="name-line">Baskar</span>
    </>
  );
}

export default function Home() {
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const glowRef = useRef<HTMLSpanElement>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;

    const equalizeMobileNameWidths = () => {
      const mobile = window.matchMedia("(max-width: 640px)").matches;
      const groups = title.querySelectorAll<HTMLElement>(
        ".name-mark-base, .name-mark-glow",
      );

      groups.forEach((group) => {
        const lines = [
          ...group.querySelectorAll<HTMLElement>(".name-line"),
        ];
        lines.forEach((line) => {
          line.style.fontSize = "";
        });
        if (!mobile || lines.length < 2) return;

        const widths = lines.map((line) => line.getBoundingClientRect().width);
        const target = Math.max(...widths);
        if (target <= 0) return;

        lines.forEach((line, i) => {
          const width = widths[i];
          if (width <= 0) return;
          const current = parseFloat(getComputedStyle(line).fontSize);
          line.style.fontSize = `${(current * target) / width}px`;
        });
      });
    };

    equalizeMobileNameWidths();
    void document.fonts?.ready.then(equalizeMobileNameWidths);
    window.addEventListener("resize", equalizeMobileNameWidths);
    const settleTimer = window.setTimeout(equalizeMobileNameWidths, 3400);

    return () => {
      window.removeEventListener("resize", equalizeMobileNameWidths);
      window.clearTimeout(settleTimer);
    };
  }, []);

  useEffect(() => {
    const title = titleRef.current;
    const glow = glowRef.current;
    if (!title || !glow) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      glow.style.setProperty("--glow-opacity", "0");
      return;
    }

    const onMove = (e: PointerEvent) => {
      const rect = title.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      glow.style.setProperty("--glow-x", `${x}%`);
      glow.style.setProperty("--glow-y", `${y}%`);
      glow.style.setProperty("--glow-opacity", inside ? "1" : "0");
    };

    const onLeave = () => {
      glow.style.setProperty("--glow-opacity", "0");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const goToExperience = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (leaving) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      router.push("/experience");
      return;
    }

    setLeaving(true);
    window.setTimeout(() => {
      router.push("/experience");
    }, 450);
  };

  return (
    <div
      className={`relative flex min-h-full flex-1 flex-col overflow-hidden bg-black${leaving ? " page-leaving" : ""}`}
    >
      <NeuralNet />
      <div className="net-dim" aria-hidden="true" />
      <main className="relative z-10 flex flex-1">
        <div className="hero-stack">
          <h1
            ref={titleRef}
            className="name-mark leading-none tracking-[-0.02em] text-white"
          >
            <span className="name-mark-base">
              <NameLines />
            </span>
            <span
              ref={glowRef}
              className="name-mark-glow pointer-events-none"
              aria-hidden="true"
            >
              <NameLines />
            </span>
          </h1>
          <nav className="site-nav" aria-label="Primary">
            <a href="/experience" onClick={goToExperience}>
              Experience
            </a>
            <a href="#projects">Projects</a>
            <a href="#contact" className="nav-contact">
              Contact
              <svg
                className="nav-send-icon"
                viewBox="0 0 24 24"
                width="1em"
                height="1em"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </a>
          </nav>
        </div>
      </main>
    </div>
  );
}
