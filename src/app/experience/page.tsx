"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import ExperienceCoda from "@/components/ExperienceCoda";

type Entry = {
  title: string;
  detail?: string;
  years?: string;
};

type Section = {
  id: "purdue" | "lynbrook";
  school: string;
  entries: Entry[];
};

const SECTIONS: Section[] = [
  {
    id: "purdue",
    school: "Purdue University · 2026 — Present",
    entries: [
      { title: "Studying Computer Science, Electrical and Computer Engineering, and Quantum Science and Computation" },
      { title: "Researching Dynamic Sparsity in Transformer Networks" },
      { title: "Purdue Aerial Robotics Team (PART)" },
    ],
  },
  {
    id: "lynbrook",
    school: "Lynbrook High School · 2022 — 2026",
    entries: [
      {
        title: "The Funky Monkeys (Lynbrook Robotics)",
        detail: "President",
        years: "2022 — 2026",
      },
      {
        title: "Medical Robotics",
        detail: "Research under Dr. Sohail H Zaidi, SJSU",
        years: "2023 — 2026",
      },
      {
        title: "Team Hippocampus",
        detail: "President and Founder",
        years: "2023 — 2026",
      },
      {
        title: "STEMist Education",
        detail: "Volunteer and Instructor",
        years: "2022 — 2026",
      },
      {
        title: "VTSeva",
        detail: "Making books accessible to blind readers",
        years: "2023 — Present",
      },
      {
        title: "Science Olympiad",
        detail: "50+ medals, 4× Top 25 National MYSO",
        years: "2019 — 2026",
      },
      {
        title: "National Honor Society, LHS Chapter",
        detail: "Volunteer and Tutor",
        years: "2024 — 2026",
      },
    ],
  },
];

const RAILS = {
  purdue: ["black", "gold"],
  lynbrook: ["blue"],
} as const;

export default function ExperiencePage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReady(true);
      return;
    }
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  let itemIndex = 0;

  return (
    <div className={`experience-page${ready ? " experience-ready" : ""}`}>
      <Link href="/" className="experience-back">
        <span className="experience-back-arrow" aria-hidden="true">
          ←
        </span>
        <span className="experience-back-label">Back</span>
      </Link>

      <div className="timeline" aria-label="Experience timeline">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            className={`timeline-section timeline-section--${section.id}`}
          >
            <p className="timeline-school">{section.school}</p>
            <div className="timeline-rail" aria-hidden="true">
              {RAILS[section.id].map((tone) => (
                <span
                  key={tone}
                  className={`timeline-line timeline-line--${tone}`}
                />
              ))}
            </div>

            <ol className="timeline-list">
              {section.entries.map((entry) => {
                const i = itemIndex++;
                return (
                  <li
                    key={`${section.id}-${entry.title}`}
                    className="timeline-item"
                    style={{ "--i": i } as CSSProperties}
                  >
                    <span className="timeline-node" aria-hidden="true" />
                    <div className="timeline-card">
                      {entry.years ? (
                        <p className="timeline-years">{entry.years}</p>
                      ) : null}
                      <h2 className="timeline-role">{entry.title}</h2>
                      {entry.detail ? (
                        <p className="timeline-org">{entry.detail}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      <ExperienceCoda />
    </div>
  );
}
