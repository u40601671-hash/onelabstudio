// Copies the video engine (FFmpeg compiled to WebAssembly) into public/vendor so the site serves it itself.
// Runs automatically after `npm install`. The ~32 MB file is not stored in git.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const core = join(root, "node_modules", "@ffmpeg", "core", "dist", "esm");
const worker = join(root, "node_modules", "@ffmpeg", "ffmpeg", "dist", "esm");
const to = join(root, "public", "vendor", "ffmpeg");

if (!existsSync(core) || !existsSync(worker)) {
  console.warn("[copy-ffmpeg] @ffmpeg packages not installed yet, skipping.");
  process.exit(0);
}
mkdirSync(to, { recursive: true });
for (const f of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) copyFileSync(join(core, f), join(to, f));
// the worker is served from our own origin too (module worker + its two small imports)
for (const f of ["worker.js", "const.js", "errors.js"]) copyFileSync(join(worker, f), join(to, f));
console.log("[copy-ffmpeg] copied the FFmpeg engine to public/vendor/ffmpeg");
