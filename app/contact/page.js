import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata = { title: "Contact Us", description: `Get in touch with the ${site.name} team.` };

export default function Contact() {
  return (
    <LegalPage title="Contact Us">
      <p>We read every message. Email us and we will reply as soon as we can, usually within a few business days.</p>
      <ul>
        <li>
          General questions, support and feedback: <a href={`mailto:${site.email}`}>{site.email}</a>
        </li>
        <li>Advertising and partnership enquiries: use the same address and put “Partnership” in the subject line.</li>
        <li>Privacy requests (access or deletion of your data): put “Privacy” in the subject line.</li>
      </ul>
    </LegalPage>
  );
}
