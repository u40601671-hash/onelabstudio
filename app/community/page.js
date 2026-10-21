import { getCommunityPosts } from "@/lib/community";
import CommunityClient from "@/components/community/CommunityClient";

export const metadata = {
  title: "Community Q&A - One Lab Studio",
  description: "Ask questions and share advice with video editors, thumbnail designers, AI creators, and YouTubers.",
};

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const initialPosts = await getCommunityPosts({ sort: "trending" });

  return <CommunityClient initialPosts={initialPosts} />;
}
