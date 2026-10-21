import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata = { title: "Terms of Service", description: `The terms for using ${site.name}.` };

export default function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="October 2026">
      <p>By using {site.name} you agree to these terms. If you do not agree, please do not use the site.</p>
      <h2>Using the site</h2>
      <ul>
        <li>You must follow the law and these terms, and you must not misuse, disrupt or attempt to break the site.</li>
        <li>You are responsible for keeping your account details secure and for activity under your account.</li>
        <li>We may suspend or remove accounts that break these terms.</li>
      </ul>
      <h2>Tools and Pro plans</h2>
      <p>
        Some tools are free and some require a paid Pro plan. Prices, features and availability may change. Paid plans
        are described at the time of purchase, including any renewal and refund terms.
      </p>
      <h2>Community content</h2>
      <p>
        You own what you post, but you give us permission to display it on the site. Do not post anything illegal,
        hateful, misleading, infringing or spammy. We may remove content and accounts at our discretion.
      </p>
      <h2>Intellectual property</h2>
      <p>
        The site, its tools, design and text belong to {site.name} or its licensors. You may not copy, resell or
        redistribute them without written permission.
      </p>
      <h2>Advertising</h2>
      <p>
        The site displays advertisements from third parties. We are not responsible for the content of those ads or the
        sites they link to.
      </p>
      <h2>No warranty and limits of liability</h2>
      <p>
        The site and tools are provided “as is” without warranties of any kind. To the fullest extent allowed by law,
        {" "}{site.name} is not liable for indirect or consequential losses arising from your use of the site.
      </p>
      <h2>Changes and contact</h2>
      <p>
        We may update these terms; continued use means you accept the changes. Contact us at{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
