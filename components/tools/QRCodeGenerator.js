"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import Icon from "@/components/Icon";

const QR_TYPES = [
  { id: "url", name: "Website / URL", icon: "🌐" },
  { id: "wifi", name: "Wi-Fi Network", icon: "📶" },
  { id: "vcard", name: "Contact (vCard)", icon: "👤" },
  { id: "whatsapp", name: "WhatsApp", icon: "💬" },
  { id: "email", name: "Email", icon: "✉️" },
  { id: "phone", name: "Phone Call", icon: "📞" },
  { id: "sms", name: "SMS Message", icon: "💬" },
  { id: "text", name: "Plain Text", icon: "📝" },
  { id: "crypto", name: "Crypto", icon: "🪙" },
];

const COLOR_PRESETS = [
  { name: "Classic Slate", fg: "#0f172a", bg: "#ffffff" },
  { name: "Electric Blue", fg: "#2563eb", bg: "#ffffff" },
  { name: "Deep Indigo", fg: "#4338ca", bg: "#ffffff" },
  { name: "Emerald Pro", fg: "#059669", bg: "#ffffff" },
  { name: "Ruby Crimson", fg: "#e11d48", bg: "#ffffff" },
  { name: "Royal Purple", fg: "#7c3aed", bg: "#ffffff" },
  { name: "Dark Carbon", fg: "#18181b", bg: "#f4f4f5" },
];

export default function QRCodeGenerator() {
  const [activeType, setActiveType] = useState("url");

  // Form states for all types
  const [url, setUrl] = useState("https://");
  
  // Wi-Fi
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiAuth, setWifiAuth] = useState("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  // vCard
  const [vcardFirst, setVcardFirst] = useState("");
  const [vcardLast, setVcardLast] = useState("");
  const [vcardPhone, setVcardPhone] = useState("");
  const [vcardEmail, setVcardEmail] = useState("");
  const [vcardOrg, setVcardOrg] = useState("");
  const [vcardUrl, setVcardUrl] = useState("");

  // WhatsApp
  const [waPhone, setWaPhone] = useState("");
  const [waMsg, setWaMsg] = useState("");

  // Email
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  // Phone
  const [phoneNumber, setPhoneNumber] = useState("");

  // SMS
  const [smsPhone, setSmsPhone] = useState("");
  const [smsMsg, setSmsMsg] = useState("");

  // Plain Text
  const [plainText, setPlainText] = useState("");

  // Crypto
  const [cryptoCoin, setCryptoCoin] = useState("bitcoin");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");

  // Customization states
  const [fgColor, setFgColor] = useState("#0f172a");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [ecl, setEcl] = useState("M"); // L, M, Q, H
  const [margin, setMargin] = useState(2);
  const [isCopied, setIsCopied] = useState(false);
  const [copyDataAlert, setCopyDataAlert] = useState(false);

  const canvasRef = useRef(null);

  // Calculate encoded data payload based on active type
  const getEncodedData = () => {
    switch (activeType) {
      case "url":
        return url.trim() || "https://onelabstudio.com";
      case "wifi": {
        const ssid = wifiSsid.replace(/([\\;,:"])/g, "\\$1");
        const pass = wifiPass.replace(/([\\;,:"])/g, "\\$1");
        const hiddenStr = wifiHidden ? "H:true;" : "";
        return `WIFI:T:${wifiAuth};S:${ssid};P:${pass};${hiddenStr};`;
      }
      case "vcard": {
        const lines = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${vcardLast};${vcardFirst};;;`,
          `FN:${vcardFirst} ${vcardLast}`.trim(),
        ];
        if (vcardOrg) lines.push(`ORG:${vcardOrg}`);
        if (vcardPhone) lines.push(`TEL;TYPE=CELL:${vcardPhone}`);
        if (vcardEmail) lines.push(`EMAIL:${vcardEmail}`);
        if (vcardUrl) lines.push(`URL:${vcardUrl}`);
        lines.push("END:VCARD");
        return lines.join("\n");
      }
      case "whatsapp": {
        const cleanPhone = waPhone.replace(/[^0-9]/g, "");
        const query = waMsg ? `?text=${encodeURIComponent(waMsg)}` : "";
        return `https://wa.me/${cleanPhone}${query}`;
      }
      case "email": {
        const params = [];
        if (emailSubject) params.push(`subject=${encodeURIComponent(emailSubject)}`);
        if (emailBody) params.push(`body=${encodeURIComponent(emailBody)}`);
        const query = params.length ? `?${params.join("&")}` : "";
        return `mailto:${emailTo}${query}`;
      }
      case "phone":
        return `tel:${phoneNumber.replace(/\s+/g, "")}`;
      case "sms": {
        const cleanNum = smsPhone.replace(/\s+/g, "");
        return smsMsg ? `smsto:${cleanNum}:${smsMsg}` : `smsto:${cleanNum}`;
      }
      case "text":
        return plainText || "Welcome to OneLab Studio";
      case "crypto": {
        const amt = cryptoAmount ? `?amount=${cryptoAmount}` : "";
        return `${cryptoCoin}:${cryptoAddress}${amt}`;
      }
      default:
        return "https://onelabstudio.com";
    }
  };

  const payload = getEncodedData();

  // Render QR Code onto Canvas whenever inputs or styles change
  useEffect(() => {
    if (!canvasRef.current) return;
    try {
      QRCode.toCanvas(canvasRef.current, payload, {
        width: 320,
        margin: margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: ecl,
      });
    } catch (err) {
      console.error("QR Code generation error:", err);
    }
  }, [payload, fgColor, bgColor, ecl, margin]);

  // Download High-Resolution PNG (1024x1024)
  const downloadPNG = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(payload, {
        width: 1024,
        margin: margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: ecl,
      });
      const link = document.createElement("a");
      link.download = `qrcode-${activeType}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  // Download Vector SVG
  const downloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(payload, {
        type: "svg",
        margin: margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: ecl,
      });
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `qrcode-${activeType}-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  // Copy Image to Clipboard
  const copyImage = () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    } catch (err) {
      console.error("Clipboard copy failed, fallback to copy payload:", err);
      navigator.clipboard.writeText(payload);
      setCopyDataAlert(true);
      setTimeout(() => setCopyDataAlert(false), 2000);
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-blue-900/5 sm:p-8">
      {/* Top Header Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            100% Free In-Browser Tool
          </div>
          <h3 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
            Universal QR Code Generator
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Create high-resolution, custom-styled QR codes for any link, network, contact, or message with instant vector download.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <span>✓</span> Private
          </span>
          <span>•</span>
          <span>No Limits</span>
          <span>•</span>
          <span>100% Client-Side</span>
        </div>
      </div>

      {/* Main Grid: Left Controls (Tabs & Inputs), Right Preview */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: QR Type Switcher & Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* QR Type Selector Ribbon */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select QR Code Type
            </label>
            <div className="mt-2.5 grid grid-cols-3 sm:grid-cols-5 gap-2">
              {QR_TYPES.map((type) => {
                const isSelected = type.id === activeType;
                return (
                  <button
                    key={type.id}
                    onClick={() => setActiveType(type.id)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-2 border-blue-600 bg-blue-50/80 text-blue-800 shadow-xs"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <span className="mt-1 text-[11px] font-bold truncate max-w-full">
                      {type.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Input Form Based on Active Type */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-5 space-y-4">
            {/* 1. URL / Link */}
            {activeType === "url" && (
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Target Website URL
                </label>
                <div className="mt-1.5 flex rounded-xl border border-slate-300 bg-white shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="inline-flex items-center px-3 text-xs text-slate-400 font-mono">
                    https://
                  </span>
                  <input
                    type="text"
                    value={url.replace(/^https?:\/\//i, "")}
                    onChange={(e) => setUrl(`https://${e.target.value}`)}
                    placeholder="yourwebsite.com or link"
                    className="w-full bg-transparent py-2.5 pr-3 text-sm text-slate-900 outline-none"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-medium">Quick examples:</span>
                  <button
                    type="button"
                    onClick={() => setUrl("https://onelabstudio.com")}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    OneLab Studio
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setUrl("https://youtube.com")}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    YouTube Channel
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => setUrl("https://instagram.com")}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Instagram Profile
                  </button>
                </div>
              </div>
            )}

            {/* 2. Wi-Fi */}
            {activeType === "wifi" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. Studio_Guest_5G"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Wi-Fi Password
                    </label>
                    <input
                      type="text"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      placeholder="Enter password"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">
                      Security Type
                    </label>
                    <select
                      value={wifiAuth}
                      onChange={(e) => setWifiAuth(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3 (Default)</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Open (No Password)</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wifiHidden}
                    onChange={(e) => setWifiHidden(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Hidden Network (SSID not broadcast)</span>
                </label>
              </div>
            )}

            {/* 3. vCard Contact */}
            {activeType === "vcard" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">First Name</label>
                    <input
                      type="text"
                      value={vcardFirst}
                      onChange={(e) => setVcardFirst(e.target.value)}
                      placeholder="Alex"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Last Name</label>
                    <input
                      type="text"
                      value={vcardLast}
                      onChange={(e) => setVcardLast(e.target.value)}
                      placeholder="Morgan"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                    <input
                      type="tel"
                      value={vcardPhone}
                      onChange={(e) => setVcardPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={vcardEmail}
                      onChange={(e) => setVcardEmail(e.target.value)}
                      placeholder="alex@studio.com"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Company / Brand</label>
                    <input
                      type="text"
                      value={vcardOrg}
                      onChange={(e) => setVcardOrg(e.target.value)}
                      placeholder="Studio Co."
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Website</label>
                    <input
                      type="url"
                      value={vcardUrl}
                      onChange={(e) => setVcardUrl(e.target.value)}
                      placeholder="https://mysite.com"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. WhatsApp */}
            {activeType === "whatsapp" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Phone Number (Include Country Code)
                  </label>
                  <input
                    type="tel"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="e.g. +923001234567 or +15551234567"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    Pre-Filled Greeting Message (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={waMsg}
                    onChange={(e) => setWaMsg(e.target.value)}
                    placeholder="Hello! I would like to inquire about your creative services."
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* 5. Email */}
            {activeType === "email" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Recipient Email</label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="contact@company.com"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Subject Line</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Project Inquiry"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Message Body</label>
                  <textarea
                    rows={2}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Hi there, I wanted to reach out regarding..."
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* 6. Phone Call */}
            {activeType === "phone" && (
              <div>
                <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* 7. SMS */}
            {activeType === "sms" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Recipient Phone</label>
                  <input
                    type="tel"
                    value={smsPhone}
                    onChange={(e) => setSmsPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Message Text</label>
                  <textarea
                    rows={2}
                    value={smsMsg}
                    onChange={(e) => setSmsMsg(e.target.value)}
                    placeholder="Enter your SMS message here..."
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* 8. Plain Text */}
            {activeType === "text" && (
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  Custom Text or Note
                </label>
                <textarea
                  rows={4}
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  placeholder="Paste any plain text, serial number, wifi key, or private note..."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* 9. Crypto */}
            {activeType === "crypto" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Cryptocurrency</label>
                    <select
                      value={cryptoCoin}
                      onChange={(e) => setCryptoCoin(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    >
                      <option value="bitcoin">Bitcoin (BTC)</option>
                      <option value="ethereum">Ethereum (ETH)</option>
                      <option value="usdt">Tether (USDT)</option>
                      <option value="solana">Solana (SOL)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700">Amount (Optional)</label>
                    <input
                      type="text"
                      value={cryptoAmount}
                      onChange={(e) => setCryptoAmount(e.target.value)}
                      placeholder="0.05"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Wallet Address</label>
                  <input
                    type="text"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    placeholder="e.g. 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color & Styling Customizer */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Style &amp; Appearance
            </h4>

            {/* Presets Swatches */}
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFgColor(preset.fg);
                    setBgColor(preset.bg);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold hover:border-slate-400 transition"
                >
                  <span
                    className="h-3 w-3 rounded-full border border-black/10 inline-block"
                    style={{ backgroundColor: preset.fg }}
                  />
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>

            {/* Custom Color Pickers & Error Correction */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600">Foreground</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 p-1">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-xs text-slate-700">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600">Background</label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 p-1">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  <span className="font-mono text-xs text-slate-700">{bgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600">Correction</label>
                <select
                  value={ecl}
                  onChange={(e) => setEcl(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-1.5 text-xs text-slate-700"
                >
                  <option value="L">L (7% - Compact)</option>
                  <option value="M">M (15% - Standard)</option>
                  <option value="Q">Q (25% - Robust)</option>
                  <option value="H">H (30% - High)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600">Margin</label>
                <select
                  value={margin}
                  onChange={(e) => setMargin(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 p-1.5 text-xs text-slate-700"
                >
                  <option value={1}>Compact (1x)</option>
                  <option value={2}>Standard (2x)</option>
                  <option value={4}>Spacious (4x)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Preview & One-Click Downloads (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/70 p-6 flex flex-col items-center shadow-inner">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Live Real-Time Preview
            </span>

            {/* Elevated QR Canvas Display Frame */}
            <div
              className="relative flex items-center justify-center rounded-2xl p-4 shadow-xl ring-1 ring-slate-900/10 transition-transform duration-300 hover:scale-[1.02]"
              style={{ backgroundColor: bgColor }}
            >
              <canvas ref={canvasRef} className="max-w-full rounded-lg" />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Instant camera readable • 100% Verified</span>
            </div>

            {/* Export & Action Buttons */}
            <div className="mt-6 w-full space-y-2.5">
              <button
                type="button"
                onClick={downloadPNG}
                className="btn-primary w-full !py-3 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 text-sm font-bold"
              >
                <span>Download PNG (HD 1024px)</span>
                <span>↓</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={downloadSVG}
                  className="btn-outline w-full !py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold hover:border-blue-400"
                >
                  <span>Vector SVG</span>
                  <span>↓</span>
                </button>
                <button
                  type="button"
                  onClick={copyImage}
                  className="btn-outline w-full !py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold hover:border-blue-400"
                >
                  <span>{isCopied ? "✓ Copied!" : "Copy Image"}</span>
                </button>
              </div>
            </div>

            {/* Encoded Data Inspector */}
            <div className="mt-5 w-full rounded-xl border border-slate-200/80 bg-white p-3 text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Encoded Content:</span>
                <span className="font-mono text-[10px] text-blue-600 uppercase">
                  {activeType}
                </span>
              </div>
              <p className="font-mono text-xs text-slate-700 break-all line-clamp-2 select-all bg-slate-50 p-1.5 rounded border border-slate-100">
                {payload}
              </p>
              {copyDataAlert && (
                <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
                  ✓ Text copied to clipboard!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
