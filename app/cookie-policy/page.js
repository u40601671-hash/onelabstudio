import LegalPage from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata = { title: "Cookie Policy", description: `How ${site.name} uses cookies.` };

export default function CookiePolicy() {
  return (
    <LegalPage title="Cookie Policy" updated="October 2026">
      <p>Cookies are small text files stored on your device. This page explains how we use them.</p>
      <h2>Types of cookies we use</h2>
      <ul>
        <li><strong>Essential:</strong> needed for the site to work, such as remembering your cookie choice and keeping you logged in.</li>
        <li><strong>Analytics:</strong> help us understand how visitors use the site so we can improve it.</li>
        <li><strong>Advertising:</strong> set by our ad partners (Google AdSense and Adsterra) to show and measure ads and to limit how often you see the same ad.</li>
      </ul>
      <h2>Your choices</h2>
      <p>
        When you first visit, you can accept or decline non-essential cookies. Advertising scripts are loaded only after
        you accept. You can change your decision at any time by clearing this site’s data in your browser, after which
        the banner will appear again. You can also block cookies in your browser settings, though some features may stop
        working.
      </p>
      <h2>More information</h2>
      <p>
        See our <a href="/privacy-policy">Privacy Policy</a> or email <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
