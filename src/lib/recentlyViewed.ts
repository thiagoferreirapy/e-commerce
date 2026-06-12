"use client";

const KEY = "torque-viewed";
const MAX = 12;

export function recordView(productId: string) {
  if (typeof window === "undefined") return;
  try {
    const list = getViewed().filter((id) => id !== productId);
    list.unshift(productId);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* ignore quota/parse errors */
  }
}

export function getViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}
