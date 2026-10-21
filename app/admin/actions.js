"use server";
// Admin-only server actions. Every action re-checks that the caller is an admin
// (and the database's own security rules check it again).
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

const CATEGORIES = ["Content Creation", "Automation", "AI"];
const TYPES = ["js", "python", "download"];
const ACCESS = ["free", "paid"];
const STATUS = ["draft", "live"];

// Admin check + "database connected" check in one place.
async function guard(path) {
  const session = await requireAdmin(path);
  if (!session.configured) redirect("/admin");
  return session;
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/tools");
  revalidatePath("/admin");
  revalidatePath("/admin/tools");
}

export async function saveTool(formData) {
  await guard("/admin/tools");
  const id = String(formData.get("id") || "");
  const back = id ? `/admin/tools/${id}` : "/admin/tools/new";

  const name = String(formData.get("name") || "").trim();
  const payload = {
    name,
    slug: slugify(formData.get("slug") || name),
    category: String(formData.get("category") || ""),
    description: String(formData.get("description") || "").trim(),
    icon: String(formData.get("icon") || "🛠️").trim() || "🛠️",
    art: Math.min(12, Math.max(1, Number(formData.get("art")) || 1)),
    type: String(formData.get("type") || ""),
    access: String(formData.get("access") || ""),
    status: String(formData.get("status") || ""),
    entry: String(formData.get("entry") || "").trim() || null,
    sort_order: Number(formData.get("sort_order")) || 100,
    updated_at: new Date().toISOString(),
  };

  let problem = "";
  if (!payload.name) problem = "Enter a tool name.";
  else if (!payload.slug) problem = "Enter a valid web address (slug).";
  else if (!CATEGORIES.includes(payload.category)) problem = "Pick a category.";
  else if (!TYPES.includes(payload.type)) problem = "Pick a tool type.";
  else if (!ACCESS.includes(payload.access)) problem = "Choose Free or Paid.";
  else if (!STATUS.includes(payload.status)) problem = "Choose Draft or Live.";
  if (problem) redirect(`${back}?error=${encodeURIComponent(problem)}`);

  const supabase = createClient();
  const { error } = id ? await supabase.from("tools").update(payload).eq("id", id) : await supabase.from("tools").insert(payload);
  if (error) {
    const msg = error.code === "23505" ? "That web address (slug) is already used by another tool." : error.message;
    redirect(`${back}?error=${encodeURIComponent(msg)}`);
  }

  refresh();
  redirect("/admin/tools?saved=1");
}

export async function toggleAccess(formData) {
  await guard("/admin/tools");
  const id = String(formData.get("id") || "");
  const to = String(formData.get("to") || "");
  if (!id || !ACCESS.includes(to)) redirect("/admin/tools");
  const { error } = await createClient().from("tools").update({ access: to, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/tools?error=${encodeURIComponent(error.message)}`);
  refresh();
  redirect("/admin/tools");
}

export async function toggleStatus(formData) {
  await guard("/admin/tools");
  const id = String(formData.get("id") || "");
  const to = String(formData.get("to") || "");
  if (!id || !STATUS.includes(to)) redirect("/admin/tools");
  const { error } = await createClient().from("tools").update({ status: to, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(`/admin/tools?error=${encodeURIComponent(error.message)}`);
  refresh();
  redirect("/admin/tools");
}

export async function deleteTool(formData) {
  await guard("/admin/tools");
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin/tools");
  const { error } = await createClient().from("tools").delete().eq("id", id);
  if (error) redirect(`/admin/tools?error=${encodeURIComponent(error.message)}`);
  refresh();
  redirect("/admin/tools?deleted=1");
}
