import { NextResponse } from "next/server";
import {
  createContactChallenge,
  verifyContactChallenge,
} from "@/lib/contact-challenge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const LOCAL = ["vyaasbaskar"];
const HOST = ["gmail", "com"];
const recentAttempts = new Map<string, number[]>();

function mailbox() {
  return `${LOCAL.join("")}@${HOST.join(".")}`;
}

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function isLimited(key: string) {
  const now = Date.now();
  const recent = (recentAttempts.get(key) ?? []).filter(
    (time) => now - time < 10 * 60 * 1000,
  );
  recentAttempts.set(key, recent);
  return recent.length >= 8;
}

function recordAttempt(key: string) {
  const now = Date.now();
  const recent = (recentAttempts.get(key) ?? []).filter(
    (time) => now - time < 10 * 60 * 1000,
  );
  recent.push(now);
  recentAttempts.set(key, recent);
}

export async function GET() {
  return NextResponse.json(createContactChallenge());
}

export async function POST(request: Request) {
  let token = "";
  let answer = "";
  let trap = "";

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      token?: string;
      answer?: string;
      company?: string;
    };
    token = body.token ?? "";
    answer = body.answer ?? "";
    trap = body.company ?? "";
  } else {
    const form = await request.formData();
    token = String(form.get("token") ?? "");
    answer = String(form.get("answer") ?? "");
    trap = String(form.get("company") ?? "");
  }

  const key = clientKey(request);
  if (trap.trim() || isLimited(key)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!verifyContactChallenge(token, answer)) {
    recordAttempt(key);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const to = encodeURIComponent(mailbox());
  return NextResponse.json({
    ok: true,
    compose: `https://mail.google.com/mail/?view=cm&fs=1&to=${to}`,
  });
}
