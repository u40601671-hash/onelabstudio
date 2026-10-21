// Runs Whisper inside the visitor's browser (nothing is uploaded anywhere).
// Loaded as a module Web Worker so the page never freezes while the AI works.
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1";

env.allowLocalModels = false; // always fetch models from Hugging Face (then cached by the browser)
env.useBrowserCache = true;

let asr = null;
let loadedModel = "";

const post = (msg) => self.postMessage(msg);

async function load(model) {
  if (asr && loadedModel === model) return;
  asr = null;
  const files = new Map(); // file -> {loaded,total}
  post({ type: "stage", stage: "loading" });
  // 8-bit CPU (WASM) build: small download, works in every modern browser, and gave the most accurate words in testing.
  asr = await pipeline("automatic-speech-recognition", model, {
    device: "wasm",
    dtype: "q8",
    progress_callback: (p) => {
      if (p.status === "progress" && p.total) {
        files.set(p.file, { loaded: p.loaded, total: p.total });
        let loaded = 0, total = 0;
        files.forEach((f) => { loaded += f.loaded; total += f.total; });
        post({ type: "download", loaded, total });
      }
    },
  });
  loadedModel = model;
}

self.onmessage = async (event) => {
  const msg = event.data;
  try {
    if (msg.type === "load") {
      await load(msg.model);
      post({ type: "ready" });
    } else if (msg.type === "transcribe") {
      // msg.audio: Float32Array (16 kHz mono) of one window; msg.id lets the page match the reply.
      const out = await asr(msg.audio, {
        return_timestamps: "word",
        language: msg.language || null,
        task: msg.task || "transcribe",
        chunk_length_s: 0,
      });
      post({ type: "window", id: msg.id, text: out.text || "", chunks: out.chunks || [] });
    }
  } catch (err) {
    post({ type: "error", id: msg.id, message: String((err && err.message) || err) });
  }
};
