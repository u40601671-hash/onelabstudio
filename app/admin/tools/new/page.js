import ToolForm from "@/components/admin/ToolForm";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewTool({ searchParams }) {
  const session = await requireAdmin("/admin/tools/new");
  if (!session.configured) return null;
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Add a tool</h1>
      <p className="mb-8 mt-1 text-slate-700">New tools start as a draft. Switch to Live when you are ready.</p>
      <ToolForm tool={null} error={searchParams?.error} />
    </div>
  );
}
