import { site } from "@/lib/site";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/login", "/signup", "/forgot-password", "/account", "/admin", "/auth"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
