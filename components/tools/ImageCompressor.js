"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const PRESET_MODES = [
  { id: "balanced", label: "Balanced (Recommended)", quality: 80, desc: "Optimal quality with ~70-85% file size reduction" },
  { id: "high", label: "High Fidelity", quality: 92, desc: "Near-lossless clarity for photography & high-res art" },
  { id: "extreme", label: "Maximum Compression", quality: 50, desc: "Smallest possible file size for fast web & emails" },
  { id: "custom", label: "Custom Settings", quality: 80, desc: "Full manual control over quality slider & resolution" },
];

const FORMAT_OPTIONS = [
  { id: "image/webp", ext: "webp", label: "WebP", badge: "Fastest & Smallest" },
  { id: "image/jpeg", ext: "jpg", label: "JPG / JPEG", badge: "Universal" },
  { id: "image/png", ext: "png", label: "PNG", badge: "Crisp & Lossless" },
];

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Convert base64 dataURL to Blob for accurate byte measurement
function dataURLtoBlob(dataUrl) {
  try {
    const parts = dataUrl.split(";base64,");
    const contentType = parts[0].split(":")[1] || "image/jpeg";
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  } catch (err) {
    console.error("dataURLtoBlob error:", err);
    return null;
  }
}

export default function ImageCompressor() {
  const [file, setFile] = useState(null);
  const [originalDataUrl, setOriginalDataUrl] = useState(null);
  const [originalMeta, setOriginalMeta] = useState({ size: 0, width: 0, height: 0, name: "", type: "" });

  const [targetFormat, setTargetFormat] = useState("image/webp");
  const [quality, setQuality] = useState(80); // 10-100
  const [preset, setPreset] = useState("balanced");
  const [maxDimension, setMaxDimension] = useState("original"); // original, 3840, 1920, 1280, 800

  const [compressedDataUrl, setCompressedDataUrl] = useState(null);
  const [compressedMeta, setCompressedMeta] = useState({ size: 0, width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Load and read file via FileReader (reliable cross-browser, avoids blob url revocation issues)
  const handleFile = (selectedFile) => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setOriginalDataUrl(dataUrl);
      setFile(selectedFile);

      const img = new Image();
      img.onload = () => {
        setOriginalMeta({
          size: selectedFile.size,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: selectedFile.name,
          type: selectedFile.type,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(selectedFile);
  };

  // Perform compression on canvas synchronously via dataURL
  const compress = useCallback(() => {
    if (!originalDataUrl) return;

    setIsProcessing(true);

    const img = new Image();
    img.onload = () => {
      try {
        let targetW = img.naturalWidth || 800;
        let targetH = img.naturalHeight || 600;

        // Apply scale down if selected
        if (maxDimension !== "original") {
          const maxDim = parseInt(maxDimension, 10);
          if (targetW > maxDim || targetH > maxDim) {
            if (targetW >= targetH) {
              targetH = Math.round((targetH * maxDim) / targetW);
              targetW = maxDim;
            } else {
              targetW = Math.round((targetW * maxDim) / targetH);
              targetH = maxDim;
            }
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");

        // High quality bicubic interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // White background for JPEG to prevent black transparent areas
        if (targetFormat === "image/jpeg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, targetW, targetH);
        }

        ctx.drawImage(img, 0, 0, targetW, targetH);

        // Convert to target format
        const qVal = targetFormat === "image/png" ? 1.0 : quality / 100;
        const resultDataUrl = canvas.toDataURL(targetFormat, qVal);

        const blob = dataURLtoBlob(resultDataUrl);
        const finalSize = blob ? blob.size : Math.round((resultDataUrl.length * 3) / 4);

        setCompressedDataUrl(resultDataUrl);
        setCompressedMeta({
          size: finalSize,
          width: targetW,
          height: targetH,
        });
      } catch (err) {
        console.error("Compression processing error:", err);
      } finally {
        setIsProcessing(false);
      }
    };

    img.onerror = () => {
      console.error("Image loading error during compression");
      setIsProcessing(false);
    };

    img.src = originalDataUrl;
    if (img.complete && img.naturalWidth > 0) {
      img.onload();
    }
  }, [originalDataUrl, targetFormat, quality, maxDimension]);

  // Re-run compression when settings change
  useEffect(() => {
    if (originalDataUrl) {
      compress();
    }
  }, [originalDataUrl, targetFormat, quality, maxDimension, compress]);

  // Preset changer
  const handlePresetChange = (presetId) => {
    setPreset(presetId);
    const p = PRESET_MODES.find((m) => m.id === presetId);
    if (p && p.id !== "custom") {
      setQuality(p.quality);
    }
  };

  // Download handler
  const handleDownload = () => {
    if (!compressedDataUrl || !file) return;

    const formatInfo = FORMAT_OPTIONS.find((f) => f.id === targetFormat) || FORMAT_OPTIONS[0];
    const baseName = (originalMeta.name || "image").replace(/\.[^/.]+$/, "");
    const downloadFileName = `${baseName}-optimized.${formatInfo.ext}`;

    const link = document.createElement("a");
    link.href = compressedDataUrl;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Drag and drop handlers
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const savingsPercent =
    originalMeta.size > 0 && compressedMeta.size > 0
      ? Math.round(((originalMeta.size - compressedMeta.size) / originalMeta.size) * 100)
      : 0;

  return (
    <div className="w-full space-y-6">
      {/* 1. UPLOAD BOX (When no image is selected) */}
      {!originalDataUrl ? (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? "border-blue-600 bg-blue-50/70 scale-[1.01]"
              : "border-slate-300 bg-slate-50/50 hover:border-blue-400 hover:bg-white shadow-xs"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-3xl text-white shadow-md shadow-blue-500/20">
            🗜️
          </div>

          <h3 className="mt-5 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Drop your image here, or <span className="text-blue-600 underline">browse</span>
          </h3>
          <p className="mt-2 text-sm text-slate-500 max-w-md">
            Compress and convert PNG, JPG, or WebP. 100% in-browser processing with zero server uploads and instant downloads.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span>✓</span> Zero Server Uploads
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 text-blue-600 font-bold">
              <span>✓</span> Unlimited Free
            </span>
            <span>•</span>
            <span>Up to 90% Size Reduction</span>
          </div>
        </div>
      ) : (
        /* 2. ACTIVE COMPRESSION WORKSPACE */
        <div className="space-y-6">
          {/* Top Bar: Active File Summary & Reset */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl text-blue-600">
                🖼️
              </span>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate text-sm">
                  {originalMeta.name}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Original: <span className="font-bold text-slate-700">{formatBytes(originalMeta.size)}</span> • {originalMeta.width} × {originalMeta.height} px
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => {
                  setOriginalDataUrl(null);
                  setFile(null);
                  setCompressedDataUrl(null);
                }}
                className="btn-outline !px-4 !py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:border-rose-200"
              >
                Choose Another Image
              </button>
            </div>
          </div>

          {/* Main Workspace Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Compression Modes & Settings (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Preset Cards */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Compression Mode
                </label>

                <div className="space-y-2">
                  {PRESET_MODES.map((mode) => {
                    const isSelected = preset === mode.id;
                    return (
                      <div
                        key={mode.id}
                        onClick={() => handlePresetChange(mode.id)}
                        className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50/60 shadow-xs ring-1 ring-blue-500/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="presetMode"
                          checked={isSelected}
                          onChange={() => handlePresetChange(mode.id)}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{mode.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{mode.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Format & Sliders */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-5">
                {/* Target Format Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Output Format
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {FORMAT_OPTIONS.map((f) => {
                      const isSelected = targetFormat === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setTargetFormat(f.id)}
                          className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white shadow-xs scale-[1.02]"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span>{f.label}</span>
                          <span
                            className={`mt-0.5 text-[9px] font-medium ${
                              isSelected ? "text-cyan-300" : "text-slate-400"
                            }`}
                          >
                            {f.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {targetFormat === "image/png" && (
                    <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      💡 <strong>Tip:</strong> PNG is a lossless format. To get <strong>70% to 90% size reduction</strong>, select <strong>WebP</strong> or <strong>JPG</strong>.
                    </p>
                  )}
                </div>

                {/* Quality Slider (for JPG & WebP) */}
                {targetFormat !== "image/png" && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">Compression Quality</span>
                      <span className="font-mono text-blue-600 font-extrabold">{quality}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={quality}
                      onChange={(e) => {
                        setQuality(Number(e.target.value));
                        setPreset("custom");
                      }}
                      className="mt-2 w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                      <span>Smaller File (10%)</span>
                      <span>Balanced (80%)</span>
                      <span>Max Quality (100%)</span>
                    </div>
                  </div>
                )}

                {/* Optional Max Dimension / Resizing */}
                <div>
                  <label className="text-xs font-bold text-slate-700">
                    Resize Max Dimension (Optional)
                  </label>
                  <select
                    value={maxDimension}
                    onChange={(e) => setMaxDimension(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="original">Keep Original Dimensions ({originalMeta.width} × {originalMeta.height} px)</option>
                    <option value="3840">Scale to 4K Max (3840 px)</option>
                    <option value="1920">Scale to Full HD (1920 px)</option>
                    <option value="1280">Scale to HD (1280 px)</option>
                    <option value="800">Scale to Web Thumbnail (800 px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Column: Live Metrics & One-Click Download (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Savings & Metrics Card */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
                <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
                  <div className="px-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Original
                    </div>
                    <div className="mt-1 text-base font-extrabold text-slate-700">
                      {formatBytes(originalMeta.size)}
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                      Compressed
                    </div>
                    <div className="mt-1 text-base font-extrabold text-blue-600">
                      {isProcessing ? "Processing..." : formatBytes(compressedMeta.size)}
                    </div>
                  </div>

                  <div className="px-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
                      Reduction
                    </div>
                    <div className="mt-1 text-base font-extrabold text-emerald-600 flex items-center justify-center gap-1">
                      <span>{savingsPercent > 0 ? `-${savingsPercent}%` : "Ready"}</span>
                    </div>
                  </div>
                </div>

                {/* Primary Download Button (Instant One-Click) */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!compressedDataUrl || isProcessing}
                    className="btn-primary w-full !py-3.5 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 text-sm font-bold cursor-pointer disabled:opacity-50"
                  >
                    <span>Download Compressed Image</span>
                    {compressedMeta.size > 0 && (
                      <span className="font-mono text-xs opacity-90">({formatBytes(compressedMeta.size)})</span>
                    )}
                    <span className="text-base">↓</span>
                  </button>

                  {downloadSuccess && (
                    <div className="mt-2 text-center text-xs font-bold text-emerald-600 animate-pulse">
                      ✓ Download started successfully!
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview Display Box */}
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-3 border-b border-slate-100">
                  <span>Live Compressed Preview</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {compressedMeta.width} × {compressedMeta.height} px
                  </span>
                </div>

                <div className="relative mt-3 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950 p-2 min-h-[280px] max-h-[460px]">
                  {compressedDataUrl ? (
                    <img
                      src={compressedDataUrl}
                      alt="Compressed preview"
                      className="max-h-[440px] w-auto max-w-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-xs text-slate-400">Processing image...</div>
                  )}

                  {/* Savings pill overlay */}
                  {savingsPercent > 0 && (
                    <div className="absolute top-4 right-4 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                      Saved {savingsPercent}%
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
