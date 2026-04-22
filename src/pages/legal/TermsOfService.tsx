import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" updated="April 22, 2026">
      <p>
        These Terms govern use of Receipt Cycle software and related materials. They are a <strong>starting template</strong> only—have
        legal counsel adapt them for your entity, product, and countries of operation.
      </p>

      <h2>Legal entity</h2>
      <p>
        The supplier of the Receipt Cycle product and related services is <strong>TempEmailGen</strong> (legal business
        name as registered for payment and checkout purposes). <strong>Receipt Cycle</strong> is the trade name and
        product branding under which TempEmailGen offers the software. In these Terms, &quot;we&quot;, &quot;us&quot;,
        and &quot;our&quot; refer to TempEmailGen in that capacity.
      </p>
      <p>
        Where you pay through Paddle, Paddle acts as Merchant of Record for the transaction; your purchase is also
        subject to Paddle&apos;s{" "}
        <a href="https://www.paddle.com/legal/buyer-terms" rel="noopener noreferrer" target="_blank">
          Buyer Terms and Conditions
        </a>{" "}
        and{" "}
        <a href="https://www.paddle.com/legal/refund-policy" rel="noopener noreferrer" target="_blank">
          Refund Policy
        </a>
        .
      </p>

      <h2>1. Acceptance</h2>
      <p>By downloading or using Receipt Cycle, you agree to these Terms. If you disagree, do not use the Services.</p>
      <h2>2. The Services</h2>
      <p>
        Receipt Cycle provides expense and receipt workflows in mobile form, connected to infrastructure you or your admin configure.
        Features may change; we may add or remove functionality with reasonable notice where practicable.
      </p>
      <h2>3. Accounts &amp; security</h2>
      <p>
        You are responsible for safeguarding credentials and devices. Notify us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you suspect unauthorized access.
      </p>
      <h2>4. Acceptable use</h2>
      <p>
        Do not misuse the Services (e.g. illegal activity, harassing others, attempting to break security, or overloading systems).
        We may suspend access for violations.
      </p>
      <h2>5. Disclaimers</h2>
      <p>
        The Services are provided <strong>“as is”</strong> without warranties of merchantability, fitness for a particular purpose, or
        non-infringement, to the fullest extent permitted by law. Receipt Cycle is not a substitute for professional tax or legal
        advice.
      </p>
      <h2>6. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or punitive
        damages, or loss of profits or data.
      </p>
      <h2>7. Governing law</h2>
      <p>[Specify governing law and venue—placeholder.]</p>
      <h2>8. Contact</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
    </LegalLayout>
  );
}
