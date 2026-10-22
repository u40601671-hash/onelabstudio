// Original illustrations for every tool (so each card has a relevant "product image").
const B = "#2563eb"; // brand blue
const LB = "#bfdbfe"; // light blue
const N = "#0a1a4a"; // navy
const SK = "#60a5fa"; // sky
const OR = "#f97316"; // orange accent
const GR = "#22c55e"; // green

const bgByCategory = { "Content Creation": "#e8f0ff", Automation: "#e6f6f0", AI: "#eeebfd" };

function Frame({ bg, children }) {
  return (
    <svg viewBox="0 0 240 150" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="240" height="150" fill={bg} />
      {children}
    </svg>
  );
}

const art = {
  // Thumbnail Maker
  1: () => (
    <>
      <rect x="48" y="24" width="144" height="92" rx="10" fill="#fff" stroke={LB} strokeWidth="2" />
      <rect x="56" y="32" width="128" height="66" rx="6" fill={SK} />
      <circle cx="84" cy="50" r="8" fill="#fde68a" />
      <path d="M56 98 L96 62 L124 86 L148 66 L184 98 Z" fill={B} />
      <circle cx="150" cy="58" r="14" fill="#fff" />
      <path d="M146 51 L158 58 L146 65 Z" fill="#ef4444" />
      <rect x="56" y="104" width="72" height="6" rx="3" fill={LB} />
      <rect x="136" y="104" width="40" height="6" rx="3" fill={SK} />
    </>
  ),
  // Caption Generator
  2: () => (
    <>
      <rect x="82" y="12" width="76" height="126" rx="12" fill="#fff" stroke={LB} strokeWidth="2" />
      <rect x="90" y="22" width="60" height="46" rx="6" fill={LB} />
      <circle cx="108" cy="38" r="7" fill={SK} />
      <path d="M90 68 L112 50 L126 60 L136 52 L150 68 Z" fill={B} />
      <rect x="90" y="78" width="60" height="6" rx="3" fill={N} />
      <rect x="90" y="90" width="46" height="5" rx="2.5" fill={LB} />
      <rect x="90" y="100" width="54" height="5" rx="2.5" fill={LB} />
      <path d="M140 118c-4-6-12-2-8 4l8 8 8-8c4-6-4-10-8-4z" fill="#ef4444" />
      <path d="M182 26l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" fill={OR} />
    </>
  ),
  // Hashtag Finder
  3: () => (
    <>
      <circle cx="120" cy="52" r="32" fill={B} />
      <text x="120" y="67" textAnchor="middle" fontSize="44" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">#</text>
      <rect x="34" y="100" width="58" height="24" rx="12" fill="#fff" stroke={LB} />
      <text x="63" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill={B} fontFamily="Arial, sans-serif">#viral</text>
      <rect x="98" y="100" width="52" height="24" rx="12" fill="#fff" stroke={LB} />
      <text x="124" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill={B} fontFamily="Arial, sans-serif">#tips</text>
      <rect x="156" y="100" width="54" height="24" rx="12" fill="#fff" stroke={LB} />
      <text x="183" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill={B} fontFamily="Arial, sans-serif">#grow</text>
    </>
  ),
  // Title Idea Generator
  4: () => (
    <>
      <circle cx="84" cy="62" r="27" fill="#fde68a" />
      <rect x="74" y="87" width="20" height="10" rx="3" fill={N} />
      <rect x="77" y="99" width="14" height="5" rx="2.5" fill={N} />
      <g stroke="#f59e0b" strokeWidth="3" strokeLinecap="round">
        <path d="M84 24v-8M50 40l-6-6M118 40l6-6M44 62h-8M124 62h8" />
      </g>
      <rect x="146" y="38" width="64" height="10" rx="5" fill={B} />
      <rect x="146" y="58" width="52" height="10" rx="5" fill={LB} />
      <rect x="146" y="78" width="60" height="10" rx="5" fill={LB} />
      <rect x="146" y="98" width="44" height="10" rx="5" fill={LB} />
    </>
  ),
  // Bulk File Renamer
  5: () => (
    <>
      {[26, 62, 98].map((y, i) => (
        <g key={y}>
          <rect x="26" y={y} width="76" height="28" rx="6" fill="#fff" stroke={LB} />
          <text x="64" y={y + 18} textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="Arial, sans-serif">IMG_041{i + 2}</text>
          <rect x="140" y={y} width="76" height="28" rx="6" fill={B} />
          <text x="178" y={y + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">trip-0{i + 1}</text>
        </g>
      ))}
      <path d="M108 76h24m-8-8l8 8-8 8" stroke={N} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  // Link Shortener
  6: () => (
    <>
      <rect x="22" y="26" width="196" height="32" rx="16" fill="#fff" stroke={LB} />
      <text x="120" y="46" textAnchor="middle" fontSize="10" fill="#94a3b8" fontFamily="Arial, sans-serif">example.com/a-very-long-page/…</text>
      <path d="M120 64v18m-7-7l7 7 7-7" stroke={N} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="66" y="92" width="108" height="34" rx="17" fill={B} />
      <text x="120" y="114" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">ols.link/go</text>
    </>
  ),
  // Content Planner
  7: () => (
    <>
      <rect x="50" y="22" width="140" height="112" rx="12" fill="#fff" stroke={LB} strokeWidth="2" />
      <rect x="50" y="22" width="140" height="28" rx="12" fill={B} />
      <rect x="50" y="38" width="140" height="12" fill={B} />
      <rect x="78" y="14" width="6" height="16" rx="3" fill={N} />
      <rect x="156" y="14" width="6" height="16" rx="3" fill={N} />
      {[...Array(15)].map((_, i) => {
        const x = 64 + (i % 5) * 24;
        const y = 60 + Math.floor(i / 5) * 24;
        const hot = [1, 6, 8, 12].includes(i);
        return <rect key={i} x={x} y={y} width="17" height="15" rx="4" fill={hot ? (i === 8 ? OR : B) : LB} />;
      })}
    </>
  ),
  // AI Idea Assistant
  8: () => (
    <>
      <rect x="40" y="48" width="78" height="64" rx="16" fill="#fff" stroke={B} strokeWidth="3" />
      <circle cx="65" cy="76" r="7" fill={B} />
      <circle cx="93" cy="76" r="7" fill={B} />
      <rect x="65" y="92" width="28" height="5" rx="2.5" fill={SK} />
      <rect x="76" y="34" width="6" height="14" rx="3" fill={N} />
      <circle cx="79" cy="32" r="5" fill={OR} />
      <rect x="28" y="68" width="8" height="22" rx="4" fill={SK} />
      <rect x="122" y="68" width="8" height="22" rx="4" fill={SK} />
      <path d="M142 26H200A8 8 0 0 1 208 34V58A8 8 0 0 1 200 66H170L160 76V66H142A8 8 0 0 1 134 58V34A8 8 0 0 1 142 26Z" fill={B} />
      <path d="M171 36l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff" />
      <rect x="140" y="98" width="62" height="8" rx="4" fill={LB} />
      <rect x="140" y="114" width="44" height="8" rx="4" fill={LB} />
    </>
  ),
  // Text Cleaner
  9: () => (
    <>
      {[34, 52, 70, 88].map((y, i) => (
        <rect key={y} x="24" y={y} width={[62, 44, 72, 40][i]} height="8" rx="4" fill="#cbd5e1" />
      ))}
      <rect x="24" y="52" width="44" height="8" rx="4" fill="#fecaca" />
      <rect x="24" y="88" width="40" height="8" rx="4" fill="#fecaca" />
      <path d="M102 66h28m-8-8l8 8-8 8" stroke={N} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {[34, 52, 70, 88].map((y, i) => (
        <rect key={y} x="146" y={y} width="64" height="8" rx="4" fill={i === 0 ? B : LB} />
      ))}
      <circle cx="190" cy="118" r="14" fill={GR} />
      <path d="M183 118l5 5 9-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  // Video Script Writer
  10: () => (
    <>
      <rect x="84" y="16" width="104" height="120" rx="10" fill="#fff" stroke={LB} strokeWidth="2" />
      {[32, 46, 60, 74, 88, 102].map((y, i) => (
        <rect key={y} x="98" y={y} width={[70, 56, 64, 48, 66, 40][i]} height="6" rx="3" fill={i === 0 ? B : LB} />
      ))}
      <rect x="32" y="62" width="62" height="16" rx="3" fill={B} />
      <path d="M44 62l8 16h-8zM60 62l8 16h-8zM76 62l8 16h-8z" fill="#fff" />
      <rect x="32" y="78" width="62" height="44" rx="4" fill={N} />
      <text x="63" y="104" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="Arial, sans-serif">ACTION</text>
    </>
  ),
  // Auto Poster
  11: () => (
    <>
      <path d="M26 112q34-10 54-30" stroke={SK} strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" fill="none" />
      <path d="M62 80L176 30L134 122L108 90Z" fill={B} />
      <path d="M108 90L176 30" stroke="#fff" strokeWidth="3" />
      <path d="M108 90l2 24 16-20z" fill={N} />
      <circle cx="190" cy="106" r="24" fill="#fff" stroke={OR} strokeWidth="5" />
      <path d="M190 92v14l10 6" stroke={N} strokeWidth="3.5" strokeLinecap="round" fill="none" />
    </>
  ),
  // AI Voice Over
  12: () => (
    <>
      {[[30, 30], [46, 50], [62, 72], [170, 72], [186, 50], [202, 30]].map(([x, h], i) => (
        <rect key={i} x={x} y={62 - h / 2} width="8" height={h} rx="4" fill={SK} />
      ))}
      <rect x="104" y="20" width="32" height="58" rx="16" fill={B} />
      <path d="M92 64a28 28 0 0 0 56 0" stroke={N} strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="117" y="92" width="6" height="16" fill={N} />
      <rect x="102" y="108" width="36" height="7" rx="3.5" fill={N} />
    </>
  ),
  // QR Code Generator
  14: () => (
    <>
      <rect x="70" y="25" width="100" height="100" rx="12" fill="#fff" stroke={LB} strokeWidth="2" />
      <rect x="80" y="35" width="24" height="24" rx="4" fill={B} />
      <rect x="84" y="39" width="16" height="16" rx="2" fill="#fff" />
      <rect x="87" y="42" width="10" height="10" rx="1" fill={B} />

      <rect x="136" y="35" width="24" height="24" rx="4" fill={B} />
      <rect x="140" y="39" width="16" height="16" rx="2" fill="#fff" />
      <rect x="143" y="42" width="10" height="10" rx="1" fill={B} />

      <rect x="80" y="91" width="24" height="24" rx="4" fill={B} />
      <rect x="84" y="95" width="16" height="16" rx="2" fill="#fff" />
      <rect x="87" y="98" width="10" height="10" rx="1" fill={B} />

      <rect x="112" y="40" width="8" height="8" rx="2" fill={N} />
      <rect x="124" y="48" width="6" height="6" rx="1" fill={B} />
      <rect x="110" y="60" width="20" height="8" rx="2" fill={SK} />
      <rect x="136" y="70" width="12" height="12" rx="2" fill={B} />
      <rect x="116" y="80" width="10" height="20" rx="2" fill={N} />
      <rect x="136" y="95" width="14" height="14" rx="3" fill={OR} />

      <line x1="60" y1="75" x2="180" y2="75" stroke="#06b6d4" strokeWidth="2.5" strokeDasharray="3 3" />
    </>
  ),
  // Image Compressor
  15: () => (
    <>
      <rect x="44" y="22" width="152" height="106" rx="12" fill="#fff" stroke={LB} strokeWidth="2" />
      <rect x="52" y="30" width="136" height="74" rx="8" fill={SK} />
      <circle cx="76" cy="48" r="9" fill="#fde68a" />
      <path d="M52 104 L92 64 L120 88 L144 68 L188 104 Z" fill={B} />
      <path d="M24 75 L38 75 M33 70 L38 75 L33 80" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M216 75 L202 75 M207 70 L202 75 L207 80" stroke={B} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="80" y="112" width="80" height="22" rx="11" fill="#10b981" />
      <text x="120" y="127" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        -85% SAVED
      </text>
    </>
  ),
  // Music & SFX Vault
  16: () => (
    <>
      <rect x="36" y="20" width="168" height="110" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
      {/* Vinyl / Disc glow */}
      <circle cx="74" cy="75" r="32" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
      <circle cx="74" cy="75" r="20" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
      <circle cx="74" cy="75" r="7" fill="#38bdf8" />
      {/* Sound waves & equalizer */}
      <rect x="120" y="80" width="5" height="18" rx="2.5" fill="#38bdf8" />
      <rect x="129" y="66" width="5" height="32" rx="2.5" fill="#818cf8" />
      <rect x="138" y="52" width="5" height="46" rx="2.5" fill="#c084fc" />
      <rect x="147" y="60" width="5" height="38" rx="2.5" fill="#38bdf8" />
      <rect x="156" y="72" width="5" height="26" rx="2.5" fill="#60a5fa" />
      <rect x="165" y="58" width="5" height="40" rx="2.5" fill="#a855f7" />
      <rect x="174" y="82" width="5" height="16" rx="2.5" fill="#38bdf8" />
      <rect x="183" y="76" width="5" height="22" rx="2.5" fill="#818cf8" />
      {/* Badge */}
      <rect x="118" y="32" width="76" height="16" rx="8" fill="#1e293b" stroke="#475569" />
      <text x="156" y="43" textAnchor="middle" fontSize="8" fontWeight="700" fill="#38bdf8" fontFamily="Arial, sans-serif">
        1,290+ TRACKS
      </text>
    </>
  ),
};

export const toolThumbnails = {
  "music-sfx-vault": "/hero-music-tool.png",
  "music-and-sfx-vault": "/hero-music-tool.png",
  "image-compressor": "/tool-compressor-studio.png",
  "thumbnail-maker": "/tool-thumbnail-studio.png",
  "auto-video-editor": "/hero-studio-mockup.png",
  "qr-code-generator": "/tool-qr-studio.png",
  "word-counter": "/tool-word-studio.png",
  "caption-generator": "/tool-caption-studio.png",
  "audio-transcriber": "/tool-voice-studio.png",
  "text-cleaner": "/tool-text-cleaner-studio.png",
};

export default function ToolArt({ tool, className = "" }) {
  const imgSrc = toolThumbnails[tool?.slug];
  if (imgSrc) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-slate-900 ${className}`}>
        <img
          src={imgSrc}
          alt={tool?.name || "Tool Showcase"}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
      </div>
    );
  }

  let Art = art[tool.art ?? tool.id];
  if (!Art) Art = art[1];
  return (
    <div className={className}>
      <Frame bg={bgByCategory[tool.category] || "#e8f0ff"}>
        <Art />
      </Frame>
    </div>
  );
}
