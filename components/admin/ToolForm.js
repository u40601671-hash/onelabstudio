import Link from "next/link";
import ToolArt from "@/components/ToolArt";
import { saveTool } from "@/app/admin/actions";

const categories = ["Content Creation", "Automation", "AI"];
const artNames = ["Thumbnail", "Caption", "Hashtag", "Title ideas", "File renamer", "Link shortener", "Planner", "AI robot", "Text cleaner", "Script", "Auto poster", "Voice over"];

const field = "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-100";
const label = "block text-sm font-bold text-ink";
const hint = "mt-1 text-xs font-medium text-slate-600";

export default function ToolForm({ tool, error }) {
  const t = tool || { name: "", slug: "", category: "Content Creation", description: "", icon: "🛠️", art: 1, type: "js", access: "free", status: "draft", entry: "", sort_order: 100 };

  return (
    <form action={saveTool} className="space-y-6">
      {tool && <input type="hidden" name="id" value={tool.id} />}

      {error && <p role="alert" className="rounded-xl bg-red-50 px-5 py-3 font-semibold text-red-700">{error}</p>}

      <div className="card !p-7">
        <h2 className="text-lg font-bold">Basics</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <label className={label}>
            Tool name
            <input name="name" defaultValue={t.name} required placeholder="e.g. Thumbnail Maker" className={field} />
          </label>
          <label className={label}>
            Web address (slug)
            <input name="slug" defaultValue={t.slug} placeholder="auto from the name" className={field} />
            <span className={hint}>Letters, numbers and dashes only. Example: thumbnail-maker</span>
          </label>
          <label className={`${label} sm:col-span-2`}>
            Short description
            <textarea name="description" defaultValue={t.description} rows={3} placeholder="One clear sentence about what the tool does." className={field} />
          </label>
          <label className={label}>
            Category
            <select name="category" defaultValue={t.category} className={field}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className={label}>
            Icon (one emoji)
            <input name="icon" defaultValue={t.icon} className={field} />
          </label>
        </div>
      </div>

      <div className="card !p-7">
        <h2 className="text-lg font-bold">Access and publishing</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <label className={label}>
            Free or Paid
            <select name="access" defaultValue={t.access} className={field}>
              <option value="free">Free for everyone</option>
              <option value="paid">Paid (Pro only)</option>
            </select>
          </label>
          <label className={label}>
            Status
            <select name="status" defaultValue={t.status} className={field}>
              <option value="draft">Draft (hidden)</option>
              <option value="live">Live (visible)</option>
            </select>
          </label>
          <label className={label}>
            Order
            <input name="sort_order" type="number" defaultValue={t.sort_order} className={field} />
            <span className={hint}>Smaller number shows first.</span>
          </label>
          <label className={label}>
            Tool type
            <select name="type" defaultValue={t.type} className={field}>
              <option value="js">JavaScript (runs in the browser)</option>
              <option value="python">Python (runs on the server)</option>
              <option value="download">Download</option>
            </select>
          </label>
          <label className={`${label} sm:col-span-2`}>
            Link / endpoint (optional)
            <input name="entry" defaultValue={t.entry || ""} placeholder="Download link or server address" className={field} />
            <span className={hint}>Used when the tool is connected in Phase 3.</span>
          </label>
        </div>
      </div>

      <div className="card !p-7">
        <h2 className="text-lg font-bold">Picture</h2>
        <p className="mt-1 text-sm text-slate-700">Choose the illustration shown on the tool card.</p>
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {artNames.map((name, i) => (
            <label key={name} className="cursor-pointer">
              <input type="radio" name="art" value={i + 1} defaultChecked={Number(t.art) === i + 1} className="peer sr-only" />
              <span className="block overflow-hidden rounded-xl ring-2 ring-slate-200 peer-checked:ring-4 peer-checked:ring-brand-600 peer-focus-visible:ring-brand-600">
                <ToolArt tool={{ art: i + 1, category: t.category }} className="h-24 w-full" />
                <span className="block bg-white px-2 py-1.5 text-center text-xs font-bold text-slate-800">{name}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary">
          {tool ? "Save changes" : "Create tool"}
        </button>
        <Link href="/admin/tools" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
