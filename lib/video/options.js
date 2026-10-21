// Output options shared by the interface and the renderer (no heavy imports here, so the page stays light).
export const FPS = 30;
export const ASPECTS = { "16:9": "Landscape 16:9", "9:16": "Portrait 9:16", "1:1": "Square 1:1" };
export const TRANSITIONS = {
  cut: { label: "Cut", xfade: null },
  fade: { label: "Crossfade", xfade: "fade" },
  slide: { label: "Slide", xfade: "slideleft" },
  wipe: { label: "Wipe", xfade: "wipeleft" },
  zoom: { label: "Zoom", xfade: "zoomin" },
};
export const MOTIONS = { none: "None", zoomin: "Slow zoom in", zoomout: "Slow zoom out", pan: "Slow pan" };

export const even = (n) => Math.max(2, Math.round(n / 2) * 2);

export function outputSize(aspect, quality) {
  const b = quality === "720p" ? 720 : 1080;
  if (aspect === "9:16") return { W: even(b), H: even((b * 16) / 9) };
  if (aspect === "1:1") return { W: even(b), H: even(b) };
  return { W: even((b * 16) / 9), H: even(b) };
}
