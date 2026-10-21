// Central site configuration. Real values come from environment variables (.env.local).
export const site = {
  name: "One Lab Studio",
  tagline: "Free & premium tools for creators, marketers and developers",
  description:
    "One Lab Studio offers content creation, automation and AI tools, video lessons and a creator community. Start free, upgrade when you grow.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@example.com",
  adsense: {
    client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "", // e.g. ca-pub-1234567890123456
    slots: {
      top: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP || "",
      inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE || "",
      sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || "",
    },
  },
  adsterra: {
    domain: process.env.NEXT_PUBLIC_ADSTERRA_DOMAIN || "www.highperformanceformat.com",
    banner728: process.env.NEXT_PUBLIC_ADSTERRA_KEY_728X90 || "",
    banner300: process.env.NEXT_PUBLIC_ADSTERRA_KEY_300X250 || "",
  },
};
