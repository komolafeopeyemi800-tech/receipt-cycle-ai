import { LegalLayout } from "./LegalLayout";
import { Link } from "react-router-dom";

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy">
      <p>
        This policy describes how Receipt Cycle’s <strong>public website</strong> may use cookies and similar technologies. The mobile
        app follows platform rules (e.g. IDFA / GAID) separately from web cookies.
      </p>
      <h2>1. What are cookies?</h2>
      <p>
        Cookies are small files stored on your device. We use the term to include pixels and similar storage where applicable.
      </p>
      <h2>2. Strictly necessary</h2>
      <p>Some cookies are required for security, load balancing, or basic site function. These do not need consent in many regions.</p>
      <h2>3. Optional analytics</h2>
      <p>
       If we enable analytics or marketing tags, we will only fire them after you opt in where required by law. You can change your
        choice anytime on our <Link to="/cookie-settings">Cookie Settings</Link> page.
      </p>
      <h2>4. Third parties</h2>
      <p>Third-party providers (e.g. hosting, fonts, or analytics) may set their own cookies subject to their policies.</p>
      <h2>5. Contact</h2>
      <p>
        Questions: <a href="mailto:support@receiptcycle.com">support@receiptcycle.com</a>
      </p>
    </LegalLayout>
  );
}
