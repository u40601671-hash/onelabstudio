"use client";
import { createContext, useContext } from "react";

export const EditorContext = createContext(null);

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used inside the video editor.");
  return ctx;
}
