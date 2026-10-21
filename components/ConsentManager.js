"use client";
import Link from "next/link";
import Script from "next/script";
import { site } from "@/lib/site";
import { setConsent, useConsent } from "@/lib/consent";

// Cookie banner + loads the AdSense script only after the visitor accepts.
export default function ConsentManager() {
  const consent = useConsent();

  return (
    <>
      {consent === "accepted" && site.adsense.client && (
        <Script
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${site.adsense.client}`}
          crossOrigin="anonymous"
        />
      )}

      {consent === null && (
        <div
          role="dialog"
          aria-label="Cookie consent"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-blue-500/20 bg-[#0c101d]/95 p-4 shadow-2xl backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              We use cookies to run the platform, measure creator traffic and show relevant ads. You can accept or decline non-essential
              cookies. See our{" "}
              <Link href="/cookie-policy" className="font-semibold text-cyan-400 hover:underline">
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-semibold text-cyan-400 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <div className="flex shrink-0 gap-3">
              <button onClick={() => setConsent("declined")} className="btn-outline !px-5 !py-2 text-sm">
                Decline
              </button>
              <button onClick={() => setConsent("accepted")} className="btn-primary !px-5 !py-2 text-sm">
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
