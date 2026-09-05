"use client";

import { useEffect, useRef } from "react";

type Agent = {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
};

type Edge = { a: number; b: number; phase: number };

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function buildNetwork(width: number, height: number) {
  const cols = 11;
  const rows = 7;
  const agents: Agent[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      const cellW = width / (cols - 1);
      const cellH = height / (rows - 1);
      const jx = (hash(i * 3.1) - 0.5) * cellW * 0.72;
      const jy = (hash(i * 7.9 + 2) - 0.5) * cellH * 0.72;
      const x = col * cellW + jx;
      const y = row * cellH + jy;
      agents.push({
        homeX: x,
        homeY: y,
        x,
        y,
        vx: 0,
        vy: 0,
        r: 1.1 + hash(i * 5.3) * 1.4,
        phase: hash(i * 1.7) * Math.PI * 2,
      });
    }
  }

  const edges: Edge[] = [];
  const maxDist = Math.min(width, height) * 0.2;

  for (let i = 0; i < agents.length; i++) {
    const candidates: { j: number; d: number }[] = [];
    for (let j = i + 1; j < agents.length; j++) {
      const d = Math.hypot(
        agents[i].homeX - agents[j].homeX,
        agents[i].homeY - agents[j].homeY,
      );
      if (d < maxDist) candidates.push({ j, d });
    }
    candidates.sort((a, b) => a.d - b.d);
    const links = 2 + Math.floor(hash(i * 11.3) * 2);
    for (const c of candidates.slice(0, links)) {
      edges.push({
        a: i,
        b: c.j,
        phase: hash(i * 13 + c.j * 17) * Math.PI * 2,
      });
    }
  }

  return { agents, edges };
}

export default function NeuralNet() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let agents: Agent[] = [];
    let edges: Edge[] = [];
    let cursor = { x: -9999, y: -9999, active: false };
    let frame = 0;
    let time = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ({ agents, edges } = buildNetwork(width, height));
    };

    const onMove = (e: PointerEvent) => {
      cursor = { x: e.clientX, y: e.clientY, active: true };
    };

    const onLeave = () => {
      cursor = { ...cursor, active: false };
    };

    const tick = () => {
      time += 0.016;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      const pullR = Math.min(width, height) * 0.22;

      if (!reduceMotion) {
        for (const a of agents) {
          let fx = (a.homeX - a.x) * 0.08;
          let fy = (a.homeY - a.y) * 0.08;

          fx += Math.sin(time * 1.55 + a.phase) * 0.85;
          fy += Math.cos(time * 1.25 + a.phase * 1.3) * 0.75;
          fx += Math.sin(time * 0.4 + a.phase * 2.1) * 0.4;
          fy += Math.cos(time * 0.35 + a.phase * 1.7) * 0.35;

          if (cursor.active) {
            const dx = cursor.x - a.x;
            const dy = cursor.y - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist < pullR) {
              const t = 1 - dist / pullR;
              const pull = t * t * 0.055;
              fx += dx * pull;
              fy += dy * pull;
            }
          }

          a.vx = (a.vx + fx) * 0.84;
          a.vy = (a.vy + fy) * 0.84;
          a.x += a.vx;
          a.y += a.vy;
        }
      }

      for (const edge of edges) {
        const a = agents[edge.a];
        const b = agents[edge.b];
        const pulse = 0.45 + 0.55 * Math.sin(time * 1.9 + edge.phase);
        const alpha = 0.22 + 0.62 * pulse;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(0, 136, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      for (const a of agents) {
        const pulse = 0.4 + 0.6 * Math.sin(time * 2.2 + a.phase);
        const alpha = 0.45 + 0.55 * pulse;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r * (0.9 + 0.25 * pulse), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(58, 160, 255, ${alpha})`;
        ctx.fill();
      }

      frame = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
