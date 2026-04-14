import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" updated="April 14, 2026">
      <p>
        This Refund Policy explains when payments for Receipt Cycle are refundable, how to request a refund, and what
        happens after a refund is approved. This page is intended to be clear and practical for users. For legal
        compliance in your country or state, have counsel review and adapt this policy.
      </p>

      <h2>1. Scope</h2>
      <p>
        This policy applies to paid subscriptions and one-time purchases made for Receipt Cycle through our supported
        billing channels, including web checkout providers and app marketplaces where applicable.
      </p>

      <h2>2. General refund window</h2>
      <p>
        Unless a stricter local law applies, first-time subscription purchases are eligible for a refund request within
        <strong> 14 calendar days</strong> of the initial charge if you are not satisfied with the service.
      </p>
      <p>
        Renewal charges are generally non-refundable once processed, except where required by law or in cases of proven
        duplicate/accidental billing.
      </p>

      <h2>3. Eligible refund scenarios</h2>
      <ul>
        <li>Duplicate charges for the same billing period.</li>
        <li>Accidental purchase reported promptly after checkout.</li>
        <li>Technical failure that prevents use of core paid features and cannot be resolved within reasonable time.</li>
        <li>Charge made after valid cancellation before renewal date (billing error).</li>
      </ul>

      <h2>4. Non-refundable scenarios</h2>
      <ul>
        <li>Requests submitted outside the applicable refund window.</li>
        <li>Partial usage-based dissatisfaction after substantial use of paid features during the billing cycle.</li>
        <li>Delays caused by third-party banks, card networks, or app stores after we have processed correctly.</li>
        <li>Account actions that violate our Terms of Service.</li>
      </ul>

      <h2>5. Platform-specific billing rules</h2>
      <p>
        If you purchased through a third-party marketplace (for example Google Play or Apple App Store), refunds may be
        controlled by that marketplace&apos;s policy and process. In those cases, submit your request directly in that
        store first.
      </p>
      <p>
        For purchases made via our direct web checkout, request refunds through our support channel listed below.
      </p>

      <h2>6. How to request a refund</h2>
      <p>
        Send your refund request to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with:
      </p>
      <ul>
        <li>The account email used for purchase.</li>
        <li>Purchase date and amount.</li>
        <li>Transaction/order reference (if available).</li>
        <li>A short description of the issue.</li>
      </ul>
      <p>
        We may ask for extra verification details to protect your account and prevent unauthorized claims.
      </p>

      <h2>7. Review timeline and payout timing</h2>
      <p>
        We aim to review refund requests within <strong>3-5 business days</strong>. If approved, refunds are issued to
        the original payment method. Depending on your bank or provider, funds typically appear within
        <strong> 5-10 business days</strong>, but in some regions may take longer.
      </p>

      <h2>8. Cancellation vs refund</h2>
      <p>
        Cancelling a subscription stops future renewal charges. Cancellation does not automatically refund charges
        already processed. You can still submit a refund request if your case meets the conditions above.
      </p>

      <h2>9. Chargebacks</h2>
      <p>
        Before filing a card chargeback, please contact support so we can resolve the issue quickly. Chargebacks may
        temporarily restrict access while the payment dispute is under review.
      </p>

      <h2>10. Policy updates</h2>
      <p>
        We may update this Refund Policy to reflect product, billing, or legal changes. Material changes are reflected
        by updating the date at the top of this page.
      </p>
    </LegalLayout>
  );
}
