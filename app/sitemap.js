import { site } from "@/lib/site";
import { posts } from "@/lib/posts";
import { getTools } from "@/lib/getTools";

export default async function sitemap() {
  const tools = await getTools();
  const pages = ["", "/tools", "/blog", "/about", "/contact", "/privacy-policy", "/terms", "/cookie-policy", "/disclaimer"];
  return [
    ...pages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly", priority: p === "" ? 1 : 0.7 })),
    ...tools.map((t) => ({ url: `${site.url}/tools/${t.slug}`, changeFrequency: "monthly", priority: 0.8 })),
    ...posts.map((p) => ({ url: `${site.url}/blog/${p.slug}`, lastModified: p.date, priority: 0.8 })),
  ];
}
