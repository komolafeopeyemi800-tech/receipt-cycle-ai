import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

export default function DoNotSell() {
  return (
    <LegalLayout title="Do Not Sell or Share My Personal Information">
      <p>
        Certain U.S. state laws (including California) give residents the right to opt out of the <strong>sale</strong> or{" "}
        <strong>sharing</strong> of personal information for cross-context behavioral advertising.
      </p>
      <h2>Our practices</h2>
      <p>
        Receipt Cycle’s consumer product is built around your chosen backend. We do not sell personal information for money. If we
        ever use advertising technology that constitutes a “sale” or “sharing” under applicable law, we will provide an opt-out and
        honor browser GPC signals where required.
      </p>
      <h2>Submit a request</h2>
      <p>
        Email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}?subject=Do%20Not%20Sell%20or%20Share`}>{SUPPORT_EMAIL}</a> with the subject line “Do Not
        Sell or Share” and include the email associated with your account (if any). We may need to verify your identity.
      </p>
      <h2>Authorized agents</h2>
      <p>You may designate an authorized agent where permitted by law; we may require proof of authorization.</p>
    </LegalLayout>
  );
}
