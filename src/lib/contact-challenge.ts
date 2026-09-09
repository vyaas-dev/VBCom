import { createHmac, randomInt, timingSafeEqual } from "crypto";

const TTL_MS = 5 * 60 * 1000;
const MIN_SOLVE_MS = 700;
const WORDS = [
  "",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
] as const;

type ChallengePayload = {
  a: number;
  b: number;
  iat: number;
  exp: number;
};

function secret() {
  return process.env.CONTACT_SECRET ?? "vbcom-contact-challenge-v1";
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createContactChallenge() {
  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  const iat = Date.now();
  const payload: ChallengePayload = { a, b, iat, exp: iat + TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return {
    question: `What is ${WORDS[a]} plus ${WORDS[b]}?`,
    token: `${body}.${sign(body)}`,
  };
}

export function verifyContactChallenge(token: string, answer: string) {
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sign(body), sig)) return false;

  let payload: ChallengePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return false;
  }

  const now = Date.now();
  if (now > payload.exp || now - payload.iat < MIN_SOLVE_MS) return false;

  const expected = String(payload.a + payload.b);
  const given = answer.trim();
  return given.length === expected.length && safeEqual(expected, given);
}
