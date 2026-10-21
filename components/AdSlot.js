"use client";
import { useEffect } from "react";
import { site } from "@/lib/site";
import { useConsent } from "@/lib/consent";

const isDev = process.env.NODE_ENV === "development";

// One reusable ad slot.
//   network: "adsense" | "adsterra"
//   slot:    "top" | "inline" | "sidebar"   (AdSense slot id lookup)
//   size:    "728x90" | "300x250"           (Adsterra banner size)
// Renders nothing in production until the matching IDs are set in .env.local.
export default function AdSlot({ network = "adsense", slot = "inline", size = "300x250", className = "" }) {
  const consent = useConsent();
  const [w, h] = size.split("x").map(Number);

  const adsenseSlot = site.adsense.slots[slot];
  const adsterraKey = size === "728x90" ? site.adsterra.banner728 : site.adsterra.banner300;
  const configured = network === "adsense" ? site.adsense.client && adsenseSlot : adsterraKey;

  useEffect(() => {
    if (network === "adsense" && consent === "accepted" && configured) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {}
    }
  }, [network, consent, configured]);

  if (!configured) {
    if (!isDev) return null;
    return (
      <div className={`flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-100 text-xs text-slate-500 ${className}`} style={{ minHeight: h }}>
        Ad space ({network} {size}) – visible in development only
      </div>
    );
  }

  if (consent !== "accepted") return null;

  return (
    <div className={`mx-auto w-full text-center ${className}`} aria-label="Advertisement">
      <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Advertisement</p>
      {network === "adsense" ? (
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={site.adsense.client}
          data-ad-slot={adsenseSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        // Each Adsterra banner runs inside its own iframe so several can share one page.
        <iframe
          title="Advertisement"
          width={w}
          height={h}
          style={{ border: 0, maxWidth: "100%" }}
          scrolling="no"
          srcDoc={`<html><body style="margin:0"><script>atOptions={'key':'${adsterraKey}','format':'iframe','height':${h},'width':${w},'params':{}};</script><script src="https://${site.adsterra.domain}/${adsterraKey}/invoke.js"></script></body></html>`}
        />
      )}
    </div>
  );
}
