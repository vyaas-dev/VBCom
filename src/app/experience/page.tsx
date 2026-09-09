"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import ExperienceCoda from "@/components/ExperienceCoda";

type Entry = {
  title: string;
  detail?: string;
  years?: string;
  note?: string;
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
        title: "The Funky Monkeys (FRC 846)",
        detail: "President · FIRST Dean’s List Semifinalist",
        years: "2023 — Present",
        note: "Lead a 50+ member team after Software & Controls Lead and Test & Drive Lead. Event wins, Innovation in Control, and Engineering Inspiration along the way.",
      },
      {
        title: "Medical Robotics Research",
        detail: "San José State University · Dr. Sohail H. Zaidi",
        years: "2023 — Present",
        note: "Control systems and computer vision for robotic arms in medical settings. Presented at NCUR, IEEE ISEC, IMECE, and more.",
      },
      {
        title: "VEX AI 1001A (Team Hippocampus)",
        detail: "Founder and President",
        years: "2023 — Present",
        note: "Fully autonomous robots with high-accuracy detection and mostly 3D-printed builds. 2× World Championships · Judges’ Award and Build Award.",
      },
      {
        title: "STEMist Education",
        detail: "Director of Technology, Volunteer, and Instructor",
        years: "2022 — Present",
        note: "Led an international 8-person tech team for the site and apps, and teach physics, math, and CS workshops.",
      },
      {
        title: "Science Olympiad — Team A",
        detail: "55+ medals across 25+ competitions",
        years: "2019 — Present",
        note: "State and regional firsts across more than 25 competitions.",
      },
      {
        title: "FIRST Lego League & Calabazas Library",
        detail: "Mentor and Volunteer",
        years: "2022 — Present",
        note: "Started two FLL teams I still mentor, and taught Lego Robotics to 60+ students over 12 weeks at Calabazas Library.",
      },
      {
        title: "VTSeva",
        detail: "Volunteer",
        years: "2022 — Present",
        note: "Convert educational resources so visually impaired students in India can use them in school.",
      },
      {
        title: "National Honor Society, LHS Chapter",
        detail: "Volunteer and Tutor",
        years: "2024 — Present",
        note: "Tutor peers in physics, math, and computer science.",
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
                      {entry.note ? (
                        <p className="timeline-note">{entry.note}</p>
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
