import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import ToolForm from "@/components/admin/ToolForm";

export const dynamic = "force-dynamic";

export default async function EditTool({ params, searchParams }) {
  const session = await requireAdmin(`/admin/tools/${params.id}`);
  if (!session.configured) return null;

  const { data: tool } = await createClient().from("tools").select("*").eq("id", params.id).maybeSingle();
  if (!tool) notFound();

  return (
    <div>
      <h1 className="text-3xl font-extrabold">Edit tool</h1>
      <p className="mb-8 mt-1 text-slate-700">{tool.name}</p>
      <ToolForm tool={tool} error={searchParams?.error} />
    </div>
  );
}
