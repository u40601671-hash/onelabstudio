import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata = { title: "Disclaimer", description: `Important information about using ${site.name}.` };

export default function Disclaimer() {
  return (
    <LegalPage title="Disclaimer" updated="October 2026">
      <p>
        The information and tools on {site.name} are provided for general informational and productivity purposes only.
      </p>
      <h2>No guarantees</h2>
      <p>
        We work to keep content accurate and tools reliable, but we make no promise that results will be error-free or
        suitable for your specific needs. Use your own judgment, especially with AI-generated output, and verify
        important facts before relying on them.
      </p>
      <h2>Advertising and affiliate disclosure</h2>
      <p>
        This site shows advertisements and may in the future include affiliate links. We may earn revenue when you view
        or click ads or make purchases through such links, at no extra cost to you. Ads are labeled and do not affect
        our editorial content.
      </p>
      <h2>External links</h2>
      <p>We are not responsible for the content or practices of other websites that we link to or that ads link to.</p>
    </LegalPage>
  );
}
