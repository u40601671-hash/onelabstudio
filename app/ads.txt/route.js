// Serves /ads.txt. Set NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-...) and, optionally, ADS_TXT_EXTRA
// (extra lines, separated by "|", e.g. the line Adsterra gives you) in .env.local.
export const dynamic = "force-static";

export function GET() {
  const lines = [];
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
  if (client) lines.push(`google.com, ${client.replace("ca-", "")}, DIRECT, f08c47fec0942fa0`);
  const extra = process.env.ADS_TXT_EXTRA || "";
  extra.split("|").map((l) => l.trim()).filter(Boolean).forEach((l) => lines.push(l));
  if (lines.length === 0) lines.push("# Add your ad network lines via .env.local");
  return new Response(lines.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
