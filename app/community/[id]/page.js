import { notFound } from "next/navigation";
import { getCommunityPost, getCommunityComments } from "@/lib/community";
import DiscussionThread from "@/components/community/DiscussionThread";

export async function generateMetadata({ params }) {
  const post = await getCommunityPost(params.id);
  if (!post) {
    return { title: "Discussion Not Found - One Lab Community" };
  }
  return {
    title: `${post.title} - One Lab Community`,
    description: post.content.slice(0, 150) + "...",
  };
}

export const dynamic = "force-dynamic";

export default async function DiscussionPage({ params }) {
  const post = await getCommunityPost(params.id);

  if (!post) {
    notFound();
  }

  const comments = await getCommunityComments(params.id);

  return <DiscussionThread post={post} comments={comments} />;
}
