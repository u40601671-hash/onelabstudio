import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata = { title: "Privacy Policy", description: `How ${site.name} collects, uses and protects your data.` };

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>
        This Privacy Policy explains what information {site.name} (“we”, “us”) collects when you visit our website, how
        we use it and the choices you have.
      </p>
      <h2>Information we collect</h2>
      <ul>
        <li>Account information you give us, such as your name and email address when you sign up.</li>
        <li>Content you post in the community or send through our contact email.</li>
        <li>Usage data such as pages visited, device type, browser and approximate location, collected through cookies and similar technologies.</li>
      </ul>
      <h2>How we use information</h2>
      <ul>
        <li>To provide, maintain and improve our tools, videos and community.</li>
        <li>To respond to your messages and provide support.</li>
        <li>To measure traffic and understand how the site is used.</li>
        <li>To show advertising that helps fund the free parts of the site.</li>
      </ul>
      <h2>Advertising and third-party vendors</h2>
      <p>
        We use third-party advertising partners, including Google AdSense and Adsterra, to show ads. Third-party vendors,
        including Google, use cookies to serve ads based on your prior visits to this and other websites. Google’s use of
        advertising cookies enables it and its partners to serve ads based on your visit to our site and other sites on
        the Internet. You can opt out of personalized advertising by visiting{" "}
        <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>{" "}
        or <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">aboutads.info</a>. These partners
        may collect information such as your IP address and browsing activity according to their own privacy policies.
      </p>
      <h2>Cookies</h2>
      <p>
        We ask for your consent before loading advertising cookies. You can read more in our Cookie Policy. You can also
        control cookies in your browser settings.
      </p>
      <h2>Your rights</h2>
      <p>
        Depending on where you live (for example the EEA, UK or California), you may have the right to access, correct,
        delete or export your personal data, and to object to or restrict certain processing. To make a request, contact
        us at <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
      <h2>Data retention and security</h2>
      <p>
        We keep personal data only as long as needed for the purposes above and use reasonable technical measures to
        protect it. No online service can be guaranteed to be completely secure.
      </p>
      <h2>Children</h2>
      <p>Our site is not directed to children under 13, and we do not knowingly collect their personal information.</p>
      <h2>Changes</h2>
      <p>We may update this policy from time to time. The date at the top shows when it was last changed.</p>
      <h2>Contact</h2>
      <p>
        Questions about this policy? Email <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
