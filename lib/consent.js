"use client";
import { useEffect, useState } from "react";

const KEY = "ols-cookie-consent";
const EVENT = "ols-consent-change";

export function getConsent() {
  try {
    return localStorage.getItem(KEY); // "accepted" | "declined" | null
  } catch {
    return null;
  }
}

export function setConsent(value) {
  try {
    localStorage.setItem(KEY, value);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

// Returns null until the visitor decides, then "accepted" or "declined".
export function useConsent() {
  const [consent, setState] = useState(undefined); // undefined = not read yet
  useEffect(() => {
    const read = () => setState(getConsent());
    read();
    window.addEventListener(EVENT, read);
    return () => window.removeEventListener(EVENT, read);
  }, []);
  return consent;
}
