import ToolsBrowser from "@/components/ToolsBrowser";
import { getTools } from "@/lib/getTools";

export const revalidate = 30; // refreshed automatically; the admin panel also refreshes it instantly
export const metadata = {
  title: "Tools",
  description: "Browse free and Pro tools for content creation, automation and AI.",
  alternates: { canonical: "/tools" },
};

export default async function ToolsPage() {
  const tools = await getTools();
  return <ToolsBrowser tools={tools} />;
}
