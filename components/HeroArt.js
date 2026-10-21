// Hero illustration: a clean SaaS-style dashboard window (original artwork, crisp vector).
const F = "Arial, Helvetica, sans-serif";

function Stat({ x, label, value, delta, color }) {
  return (
    <g>
      <rect x={x} y="132" width="140" height="66" rx="12" fill="#fff" stroke="#e2e8f0" />
      <rect x={x + 12} y="144" width="22" height="22" rx="7" fill={color} opacity="0.18" />
      <rect x={x + 18} y="150" width="10" height="10" rx="3" fill={color} />
      <text x={x + 44} y="150" fontSize="9" fontWeight="700" fill="#64748b" fontFamily={F}>{label}</text>
      <text x={x + 12} y="188" fontSize="22" fontWeight="800" fill="#0a1530" fontFamily={F}>{value}</text>
      <rect x={x + 88} y="172" width="42" height="18" rx="9" fill="#dcfce7" />
      <text x={x + 109} y="184.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#15803d" fontFamily={F}>{delta}</text>
    </g>
  );
}

export default function HeroArt({ className = "" }) {
  const bars = [38, 62, 50, 84, 68, 104, 90];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <svg viewBox="0 0 650 420" className={className} role="img" aria-label="A professional dashboard showing tools used, projects, hours saved and weekly activity">
      <defs>
        <clipPath id="ha-win">
          <rect x="20" y="30" width="600" height="360" rx="18" />
        </clipPath>
      </defs>

      {/* window shadow (solid, no blur) */}
      <rect x="30" y="44" width="600" height="360" rx="18" fill="#020617" opacity="0.38" />

      <g clipPath="url(#ha-win)">
        <rect x="20" y="30" width="600" height="360" fill="#f1f5f9" />

        {/* title bar */}
        <rect x="20" y="30" width="600" height="34" fill="#fff" />
        <circle cx="42" cy="47" r="4.5" fill="#f87171" />
        <circle cx="58" cy="47" r="4.5" fill="#fbbf24" />
        <circle cx="74" cy="47" r="4.5" fill="#34d399" />
        <rect x="230" y="38" width="220" height="18" rx="9" fill="#eef2ff" />
        <text x="340" y="50.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b" fontFamily={F}>onelabstudio.com/dashboard</text>
        <rect x="20" y="64" width="600" height="1" fill="#e2e8f0" />

        {/* sidebar */}
        <rect x="20" y="65" width="132" height="325" fill="#0b1f5c" />
        <circle cx="46" cy="90" r="12" fill="#3b82f6" />
        <text x="46" y="94" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily={F}>OL</text>
        <text x="66" y="94" fontSize="12" fontWeight="800" fill="#fff" fontFamily={F}>One Lab</text>
        <rect x="30" y="120" width="112" height="30" rx="9" fill="#2563eb" />
        <rect x="40" y="130" width="10" height="10" rx="3" fill="#fff" />
        <text x="58" y="139.5" fontSize="11" fontWeight="800" fill="#fff" fontFamily={F}>Dashboard</text>
        {["Tools", "Lessons", "Community", "Settings"].map((t, i) => (
          <g key={t}>
            <rect x="40" y={166 + i * 34} width="10" height="10" rx="3" fill="#60a5fa" opacity="0.8" />
            <text x="58" y={175.5 + i * 34} fontSize="11" fontWeight="700" fill="#bfdbfe" fontFamily={F}>{t}</text>
          </g>
        ))}
        <rect x="30" y="330" width="112" height="48" rx="12" fill="#13306f" />
        <text x="42" y="349" fontSize="9" fontWeight="800" fill="#fff" fontFamily={F}>Go Pro</text>
        <text x="42" y="363" fontSize="8" fontWeight="600" fill="#93c5fd" fontFamily={F}>Unlock AI tools</text>

        {/* header */}
        <text x="172" y="96" fontSize="17" fontWeight="800" fill="#0a1530" fontFamily={F}>Welcome back, Creator</text>
        <text x="172" y="113" fontSize="10" fontWeight="600" fill="#64748b" fontFamily={F}>Here is what is happening in your studio today</text>
        <circle cx="596" cy="92" r="14" fill="#bfdbfe" />
        <circle cx="596" cy="88" r="5" fill="#2563eb" />
        <path d="M586 101a10 8 0 0 1 20 0z" fill="#2563eb" />
        <circle cx="607" cy="81" r="4" fill="#f97316" stroke="#f1f5f9" strokeWidth="2" />

        {/* stats */}
        <Stat x={172} label="Tools used" value="24" delta="+12%" color="#2563eb" />
        <Stat x={324} label="Projects" value="8" delta="+3" color="#f97316" />
        <Stat x={476} label="Hours saved" value="12h" delta="+18%" color="#22c55e" />

        {/* weekly activity */}
        <rect x="172" y="210" width="290" height="170" rx="12" fill="#fff" stroke="#e2e8f0" />
        <text x="188" y="232" fontSize="12" fontWeight="800" fill="#0a1530" fontFamily={F}>Weekly activity</text>
        <rect x="396" y="220" width="52" height="18" rx="9" fill="#eff6ff" />
        <text x="422" y="232.5" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#1d4ed8" fontFamily={F}>This week</text>
        {[0, 1, 2].map((i) => (
          <line key={i} x1="188" x2="446" y1={270 + i * 30} y2={270 + i * 30} stroke="#eef2f7" />
        ))}
        {bars.map((h, i) => (
          <g key={i}>
            <rect x={196 + i * 36} y={352 - h} width="22" height={h} rx="6" fill={i === 5 ? "#2563eb" : "#bfdbfe"} />
            <text x={207 + i * 36} y="368" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#94a3b8" fontFamily={F}>{days[i]}</text>
          </g>
        ))}

        {/* recent tools */}
        <rect x="474" y="210" width="142" height="170" rx="12" fill="#fff" stroke="#e2e8f0" />
        <text x="488" y="232" fontSize="12" fontWeight="800" fill="#0a1530" fontFamily={F}>Recent tools</text>
        {[
          ["Thumbnail Maker", "#2563eb", 100],
          ["Caption Writer", "#f97316", 80],
          ["Content Planner", "#22c55e", 60],
        ].map(([name, c, pct], i) => (
          <g key={name}>
            <rect x="488" y={248 + i * 42} width="24" height="24" rx="7" fill={c} opacity="0.18" />
            <rect x="495" y={255 + i * 42} width="10" height="10" rx="3" fill={c} />
            <text x="520" y={258 + i * 42} fontSize="9" fontWeight="800" fill="#0a1530" fontFamily={F}>{name}</text>
            <rect x="520" y={266 + i * 42} width="84" height="5" rx="2.5" fill="#e2e8f0" />
            <rect x="520" y={266 + i * 42} width={(84 * pct) / 100} height="5" rx="2.5" fill={c} />
          </g>
        ))}
      </g>

      {/* floating notification cards */}
      <rect x="462" y="6" width="176" height="46" rx="13" fill="#fff" />
      <circle cx="486" cy="29" r="12" fill="#22c55e" />
      <path d="M480 29l5 5 8-9" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="506" y="26" fontSize="10" fontWeight="800" fill="#0a1530" fontFamily={F}>3 tasks completed</text>
      <text x="506" y="40" fontSize="8.5" fontWeight="600" fill="#64748b" fontFamily={F}>Great work today!</text>

      <rect x="0" y="334" width="170" height="52" rx="13" fill="#2563eb" />
      <path d="M26 350l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#fff" />
      <text x="48" y="357" fontSize="10.5" fontWeight="800" fill="#fff" fontFamily={F}>AI idea ready</text>
      <text x="48" y="372" fontSize="8.5" fontWeight="600" fill="#bfdbfe" fontFamily={F}>New video script</text>
    </svg>
  );
}
