// The in-browser video engine (FFmpeg compiled to WebAssembly). Browser only.
// The engine files are served from this site (public/vendor/ffmpeg, copied by scripts/copy-ffmpeg.mjs after npm install),
// so nothing is fetched from a third-party server. Single-threaded core: it needs no special browser headers.
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let engine = null;
let loading = null;
let queue = Promise.resolve();
const sinks = { log: null, progress: null };
const recent = [];

export class EngineError extends Error {}

const vendorBase = () => `${window.location.origin}/vendor/ffmpeg`;

export async function loadEngine() {
  if (engine && engine.loaded) return engine;
  if (!loading) {
    loading = (async () => {
      const ff = new FFmpeg();
      ff.on("log", ({ message }) => {
        recent.push(message);
        if (recent.length > 300) recent.splice(0, 150);
        sinks.log?.(message);
      });
      ff.on("progress", ({ progress }) => sinks.progress?.(Math.max(0, Math.min(1, progress))));
      try {
        await ff.load({
          classWorkerURL: `${vendorBase()}/worker.js`, // absolute URL: relative paths break inside bundlers
          coreURL: `${vendorBase()}/ffmpeg-core.js`,
          wasmURL: `${vendorBase()}/ffmpeg-core.wasm`,
        });
      } catch (e) {
        throw new EngineError(`The video engine could not be loaded (${String(e?.message || e)}). Check your connection, then reload the page.`);
      }
      engine = ff;
      return ff;
    })().catch((e) => {
      loading = null;
      throw e;
    });
  }
  return loading;
}

/** Stop everything now (used by Cancel and after a crash). The engine reloads on next use. */
export function terminateEngine() {
  try {
    engine?.terminate();
  } catch {
    /* already gone */
  }
  engine = null;
  loading = null;
  queue = Promise.resolve();
}

/** Run jobs one at a time: the engine can only do one thing at once. */
export function exclusive(job) {
  const run = queue.then(job, job);
  queue = run.then(() => {}, () => {});
  return run;
}

/** Run one FFmpeg command. Returns { code, log }. Throws if the command did not succeed unless allowFail. */
export async function exec(args, { onProgress, onLog, allowFail = false } = {}) {
  const ff = await loadEngine();
  recent.length = 0;
  sinks.progress = onProgress || null;
  sinks.log = onLog || null;
  let code;
  try {
    code = await ff.exec(args);
  } catch (e) {
    throw new EngineError(typeof e === "string" ? e : e?.message || "The video engine stopped unexpectedly.");
  } finally {
    sinks.progress = null;
    sinks.log = null;
  }
  const log = recent.slice(-40);
  if (code !== 0 && !allowFail) {
    const hint = log.filter((l) => /error|invalid|no such|unable|not found|failed/i.test(l)).slice(-3).join(" | ") || log.slice(-2).join(" | ");
    throw new EngineError(`FFmpeg step failed (code ${code}). ${hint}`);
  }
  return { code, log };
}

export async function write(name, data) {
  const ff = await loadEngine();
  // writeFile hands the buffer over to the worker (it becomes unusable here), so give it a copy of anything we may reuse
  const bytes = data instanceof Uint8Array ? data.slice() : await fetchFile(data);
  await ff.writeFile(name, bytes);
}

export async function read(name) {
  const ff = await loadEngine();
  return ff.readFile(name);
}

export async function remove(...names) {
  const ff = await loadEngine().catch(() => null);
  if (!ff) return;
  for (const n of names) {
    try {
      await ff.deleteFile(n);
    } catch {
      /* not there */
    }
  }
}

export const extOf = (file, fallback) => {
  const e = String(file?.name || "").split(".").pop()?.toLowerCase();
  return e && /^[a-z0-9]{1,5}$/.test(e) ? e : fallback;
};
