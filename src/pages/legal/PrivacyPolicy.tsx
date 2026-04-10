import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>
        Receipt Cycle (“we”, “us”) respects your privacy. This Policy explains what we collect on <strong>this website</strong> and
        how the <strong>Receipt Cycle mobile application</strong> interacts with your chosen backend (e.g. Convex). It is a template:
        have it reviewed by counsel for your jurisdiction before launch.
      </p>
      <h2>1. Who we are</h2>
      <p>
        Contact:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
      <h2>2. Website (marketing pages)</h2>
      <p>
        Our public site is largely static. We may process technical data (IP address, browser type, basic logs) through our hosting
        provider for security and operations. See our <a href="/cookies">Cookie Policy</a> for optional analytics cookies if enabled.
      </p>
      <h2>3. Mobile app &amp; your data</h2>
      <p>
        When you use the app, content you create (receipts, transactions, preferences) is stored in the backend deployment you or your
        administrator configure. We do not access that data except as needed to operate services you explicitly use (e.g. support with
        your permission).
      </p>
      <h2>4. Retention</h2>
      <p>Retention depends on your backend settings and account lifecycle. Export or delete data according to your deployment policies.</p>
      <h2>5. Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, delete, or port personal data, and to object to certain
        processing. Contact us at the email above. You may also have the right to lodge a complaint with a supervisory authority.
      </p>
      <h2>6. Children</h2>
      <p>Receipt Cycle is not directed at children under 13 (or the age required in your region).</p>
      <h2>7. Changes</h2>
      <p>We may update this Policy. The “Last updated” date at the top reflects the latest revision.</p>
    </LegalLayout>
  );
}
