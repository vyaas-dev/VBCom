"use client";

import { useEffect, type RefObject } from "react";

const ATTRACT_R = 200;
const PULL = 0.14;
const MAX_SHIFT = 6;
const MAX_SCALE = 1.03;
const CURSOR_EMA = 0.07;
const TARGET_EMA = 0.08;
const POSE_EMA = 0.09;
const AIMED_IN = 0.42;
const AIMED_OUT = 0.22;

type Pose = { x: number; y: number; scale: number };
type Target = { x: number; y: number; scale: number };
type Rest = { x: number; y: number };

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function canTrackPointer() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function clamp(value: number, max: number) {
  return Math.max(-max, Math.min(max, value));
}

function ease(t: number) {
  return Math.pow(t, 0.72);
}

export function useClickIntentMagnet(
  containerRef: RefObject<HTMLElement | null>,
  enabled = true,
) {
  useEffect(() => {
    const root = containerRef.current;
    if (!root || !enabled || prefersReducedMotion() || !canTrackPointer()) {
      return;
    }

    const items = [...root.querySelectorAll<HTMLElement>("[data-magnetic]")];
    if (!items.length) return;

    const faces = items.map(
      (el) => el.querySelector<HTMLElement>("[data-magnetic-face]") ?? el,
    );
    const poses: Pose[] = items.map(() => ({ x: 0, y: 0, scale: 1 }));
    const targets: Target[] = items.map(() => ({ x: 0, y: 0, scale: 1 }));
    const rests: Rest[] = items.map(() => ({ x: 0, y: 0 }));
    const aimed = items.map(() => false);

    let cursor = { x: 0, y: 0, active: false };
    let smoothCursor = { x: 0, y: 0, primed: false };
    let frame = 0;

    const measure = () => {
      items.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        rests[i] = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      });
    };

    const revealLive = () => {
      root.classList.add("site-nav--live");
      measure();
    };

    const onAnimEnd = (event: AnimationEvent) => {
      if (event.animationName === "nav-open") revealLive();
    };

    if (getComputedStyle(root).animationName === "none") {
      revealLive();
    } else {
      root.addEventListener("animationend", onAnimEnd);
    }

    const onMove = (event: PointerEvent) => {
      cursor = { x: event.clientX, y: event.clientY, active: true };
      if (!smoothCursor.primed) {
        smoothCursor = { x: event.clientX, y: event.clientY, primed: true };
      }
    };

    const onLeave = () => {
      cursor.active = false;
    };

    const tick = () => {
      if (smoothCursor.primed && cursor.active) {
        smoothCursor.x += (cursor.x - smoothCursor.x) * CURSOR_EMA;
        smoothCursor.y += (cursor.y - smoothCursor.y) * CURSOR_EMA;
      }

      items.forEach((el, i) => {
        const rest = rests[i];
        const pose = poses[i];
        const target = targets[i];
        const sample = smoothCursor.primed ? smoothCursor : cursor;
        const dx = sample.x - rest.x;
        const dy = sample.y - rest.y;
        const dist = Math.hypot(dx, dy);
        const proximity = cursor.active
          ? ease(Math.max(0, 1 - dist / ATTRACT_R))
          : 0;

        target.x += (clamp(dx * PULL * proximity, MAX_SHIFT) - target.x) * TARGET_EMA;
        target.y += (clamp(dy * PULL * proximity, MAX_SHIFT) - target.y) * TARGET_EMA;
        target.scale += (1 + (MAX_SCALE - 1) * proximity - target.scale) * TARGET_EMA;

        pose.x += (target.x - pose.x) * POSE_EMA;
        pose.y += (target.y - pose.y) * POSE_EMA;
        pose.scale += (target.scale - pose.scale) * POSE_EMA;

        const nearRest =
          Math.abs(pose.x) < 0.02 &&
          Math.abs(pose.y) < 0.02 &&
          Math.abs(pose.scale - 1) < 0.001 &&
          Math.abs(target.x) < 0.02 &&
          Math.abs(target.y) < 0.02 &&
          proximity === 0;

        if (nearRest) {
          pose.x = 0;
          pose.y = 0;
          pose.scale = 1;
          target.x = 0;
          target.y = 0;
          target.scale = 1;
          faces[i].style.transform = "";
        } else {
          faces[i].style.transform = `translate3d(${pose.x.toFixed(2)}px, ${pose.y.toFixed(2)}px, 0) scale(${pose.scale.toFixed(4)})`;
        }

        const nextAimed = aimed[i]
          ? proximity > AIMED_OUT
          : proximity > AIMED_IN;
        if (nextAimed !== aimed[i]) {
          aimed[i] = nextAimed;
          el.classList.toggle("is-aimed", nextAimed);
        }
      });

      frame = window.requestAnimationFrame(tick);
    };

    measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("resize", measure);
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
      root.removeEventListener("animationend", onAnimEnd);
      root.classList.remove("site-nav--live");
      items.forEach((el, i) => {
        el.classList.remove("is-aimed");
        faces[i].style.transform = "";
      });
    };
  }, [containerRef, enabled]);
}
