"use client";
import { useEffect, useRef, useState } from "react";

const W = 1280;
const H = 720;

const backgrounds = [
  { name: "Ocean", a: "#0b1d4d", b: "#2563eb" },
  { name: "Sunset", a: "#f97316", b: "#be123c" },
  { name: "Forest", a: "#064e3b", b: "#22c55e" },
  { name: "Midnight", a: "#0f172a", b: "#6366f1" },
  { name: "Candy", a: "#ec4899", b: "#f59e0b" },
  { name: "Slate", a: "#1e293b", b: "#64748b" },
];

const fonts = [
  { name: "Impact", css: "Impact, 'Arial Black', sans-serif" },
  { name: "Bold sans", css: "'Arial Black', Arial, sans-serif" },
  { name: "Serif", css: "Georgia, 'Times New Roman', serif" },
];

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx, text, maxWidth) {
  const out = [];
  text.split("\n").forEach((para) => {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    words.forEach((w) => {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        out.push(line);
        line = w;
      } else line = test;
    });
    out.push(line);
  });
  return out;
}

const field = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";
const label = "block text-sm font-bold text-ink";

export default function ThumbnailMaker() {
  const canvasRef = useRef(null);
  const urlRef = useRef(null);
  const [title, setTitle] = useState("Your big\nheadline here");
  const [sub, setSub] = useState("");
  const [bgIndex, setBgIndex] = useState(0);
  const [img, setImg] = useState(null);
  const [overlay, setOverlay] = useState(25);
  const [size, setSize] = useState(130);
  const [color, setColor] = useState("#ffffff");
  const [align, setAlign] = useState("left");
  const [fontIndex, setFontIndex] = useState(0);
  const [upper, setUpper] = useState(true);
  const [shadow, setShadow] = useState(true);
  const [badge, setBadge] = useState("");
  const [badgeColor, setBadgeColor] = useState("#ef4444");
  const [error, setError] = useState("");

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    // background
    if (img) {
      const s = Math.max(W / img.width, H / img.height);
      const iw = img.width * s;
      const ih = img.height * s;
      ctx.drawImage(img, (W - iw) / 2, (H - ih) / 2, iw, ih);
    } else {
      const bg = backgrounds[bgIndex];
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, bg.a);
      g.addColorStop(1, bg.b);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = `rgba(0,0,0,${overlay / 100})`;
    ctx.fillRect(0, 0, W, H);

    // headline
    const font = fonts[fontIndex];
    const pad = 80;
    const x = align === "left" ? pad : align === "right" ? W - pad : W / 2;
    ctx.textAlign = align;
    ctx.textBaseline = "top";
    ctx.font = `${size}px ${font.css}`;
    ctx.fillStyle = color;
    const text = upper ? title.toUpperCase() : title;
    const lines = wrapLines(ctx, text, W - pad * 2);
    const lh = size * 1.1;
    const subSize = Math.max(34, Math.round(size * 0.36));
    const total = lines.length * lh + (sub ? subSize * 1.6 : 0);
    const y0 = Math.max(40, (H - total) / 2);

    if (shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.65)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
    }
    lines.forEach((ln, i) => ctx.fillText(ln, x, y0 + i * lh));
    if (sub) {
      ctx.font = `bold ${subSize}px Arial, sans-serif`;
      ctx.fillText(sub, x, y0 + lines.length * lh + subSize * 0.4);
    }
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // badge
    if (badge.trim()) {
      ctx.font = "bold 42px Arial, sans-serif";
      const txt = badge.trim().toUpperCase();
      const bw = ctx.measureText(txt).width + 56;
      ctx.fillStyle = badgeColor;
      roundedRect(ctx, 56, 48, bw, 80, 20);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, 84, 90);
    }
  }, [title, sub, bgIndex, img, overlay, size, color, align, fontIndex, upper, shadow, badge, badgeColor]);

  function onFile(e) {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (PNG, JPG or WebP).");
    if (file.size > 10 * 1024 * 1024) return setError("That image is larger than 10 MB. Try a smaller one.");
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = () => setError("That image could not be opened. Try another one.");
    image.src = url;
  }

  function download() {
    canvasRef.current.toBlob((blob) => {
      if (!blob) return setError("Could not create the image. Please try again.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "thumbnail-1280x720.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    }, "image/png");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
      <div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
          <canvas ref={canvasRef} width={W} height={H} className="block h-auto w-full" aria-label="Thumbnail preview" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={download} className="btn-primary">Download PNG (1280×720)</button>
          <p className="text-sm font-medium text-slate-600">The perfect size for YouTube thumbnails.</p>
        </div>
      </div>

      <div className="space-y-5">
        <label className={label}>
          Headline
          <textarea value={title} onChange={(e) => setTitle(e.target.value)} rows={3} className={field} />
        </label>
        <label className={label}>
          Small line (optional)
          <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="e.g. Watch till the end" className={field} />
        </label>

        <div>
          <p className={label}>Background</p>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {backgrounds.map((b, i) => (
              <button
                key={b.name}
                type="button"
                title={b.name}
                aria-label={`${b.name} background`}
                onClick={() => { setBgIndex(i); setImg(null); }}
                className={`h-10 rounded-lg ring-2 ${!img && bgIndex === i ? "ring-brand-600" : "ring-slate-200"}`}
                style={{ background: `linear-gradient(135deg, ${b.a}, ${b.b})` }}
              />
            ))}
          </div>
          <label className="mt-3 block text-sm font-bold text-ink">
            Or use your own picture
            <input type="file" accept="image/*" onChange={onFile} className="mt-1.5 block w-full text-sm font-medium text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:font-bold file:text-brand-700" />
          </label>
          {img && (
            <button type="button" onClick={() => setImg(null)} className="mt-2 text-sm font-bold text-brand-700 hover:underline">Remove picture</button>
          )}
          {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-700">{error}</p>}
        </div>

        <label className={label}>
          Darken background: {overlay}%
          <input type="range" min="0" max="70" value={overlay} onChange={(e) => setOverlay(Number(e.target.value))} className="mt-2 w-full" />
        </label>
        <label className={label}>
          Text size: {size}
          <input type="range" min="60" max="200" value={size} onChange={(e) => setSize(Number(e.target.value))} className="mt-2 w-full" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className={label}>
            Font
            <select value={fontIndex} onChange={(e) => setFontIndex(Number(e.target.value))} className={field}>
              {fonts.map((f, i) => (
                <option key={f.name} value={i}>{f.name}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            Alignment
            <select value={align} onChange={(e) => setAlign(e.target.value)} className={field}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className={label}>
            Text color
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-1" />
          </label>
          <label className={label}>
            Badge color
            <input type="color" value={badgeColor} onChange={(e) => setBadgeColor(e.target.value)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-slate-300 bg-white p-1" />
          </label>
        </div>

        <label className={label}>
          Badge text (optional)
          <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. NEW" maxLength={14} className={field} />
        </label>

        <div className="flex flex-wrap gap-5 text-sm font-bold text-ink">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="h-4 w-4" /> CAPITAL LETTERS
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} className="h-4 w-4" /> Text shadow
          </label>
        </div>
      </div>
    </div>
  );
}
