import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

const POLAR_TERMS = "https://polar.sh/legal/terms";
const POLAR_PRIVACY = "https://polar.sh/legal/privacy";
const POLAR_PORTAL = "https://polar.sh/receipt-cycle/portal";

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" updated="October 8, 2026">
      <p>
        This Refund Policy explains how refunds, subscription cancellations, and related buyer rights work for Receipt
        Cycle. Payments are processed by Polar, which acts as Merchant of Record for purchases made through our checkout.
      </p>
      <p>
        <strong>Important:</strong> Nothing on this page overrides mandatory consumer protection law in your country. If
        local law gives you stronger rights than those described here, the stronger rights apply.
      </p>

      <h2>1. Who does what</h2>
      <p>
        <strong>TempEmailGen</strong> (supplier) develops and supports Receipt Cycle under the Receipt Cycle brand. When
        you buy through our checkout, <strong>Polar</strong> acts as <strong>Merchant of Record</strong>: it collects
        payment, issues receipts, and handles applicable sales taxes (such as VAT or GST) on your transaction, as described
        in Polar&apos;s{" "}
        <a href={POLAR_TERMS} rel="noopener noreferrer" target="_blank">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href={POLAR_PRIVACY} rel="noopener noreferrer" target="_blank">
          Privacy Policy
        </a>
        .
      </p>
      <p>
        Refunds for Polar transactions are issued through Polar to your original payment method. We review requests and
        help with product questions, bugs, and account issues when you contact us directly.
      </p>

      <h2>2. Definitions</h2>
      <ul>
        <li>
          <strong>Services / Product</strong> means the Receipt Cycle software and related materials you purchased or
          subscribe to.
        </li>
        <li>
          <strong>Polar checkout</strong> means a purchase completed through the hosted checkout we provide, where Polar is
          identified as Merchant of Record on your receipt or bank statement.
        </li>
        <li>
          <strong>Marketplace purchase</strong> means a purchase billed by a third-party app store (for example Apple App
          Store or Google Play) rather than Polar.
        </li>
      </ul>

      <h2>3. Purchases through Polar</h2>
      <h3>3.1 Standard refund window</h3>
      <p>
        For Receipt Cycle subscriptions sold through Polar, we apply a <strong>14-day full refund window</strong> from the
        timestamp of your first successful payment.
      </p>
      <ul>
        <li>
          If you request a refund within <strong>14 calendar days</strong> of that payment, you are eligible for a{" "}
          <strong>full refund</strong> (subject to verification against transaction records and applicable law).
        </li>
        <li>
          If you request a refund <strong>after 14 calendar days</strong>, the payment is not refunded for the current
          billing period. Instead, your subscription is <strong>canceled at period end</strong>, and you can keep using paid
          features until the end of the billing period you already paid for.
        </li>
      </ul>
      <p>
        This window is our standard commercial rule and does not limit any stronger statutory rights you may have under
        applicable law.
      </p>

      <h3>3.2 How to request a refund or manage your subscription</h3>
      <ul>
        <li>
          Open the <strong>customer portal</strong> at{" "}
          <a href={POLAR_PORTAL} rel="noopener noreferrer" target="_blank">
            polar.sh/receipt-cycle/portal
          </a>{" "}
          (or use <strong>Manage subscription</strong> inside Receipt Cycle) to view receipts, update your card, or cancel.
        </li>
        <li>
          To request a refund, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the address used at
          checkout, and tell us the date of purchase. We will confirm and arrange the refund through Polar.
        </li>
        <li>You can also use the links in your Polar receipt email.</li>
      </ul>

      <h3>3.3 Free trials, renewals, and cancellation</h3>
      <p>
        Paid plans include a free trial where shown at checkout. You are not charged until the trial ends. Cancel before the
        trial ends and you will not be charged. After that, subscriptions renew automatically each month or year until you
        cancel. Canceling stops future renewals; it does not reverse past charges, and you keep paid features until the end
        of the period you paid for. Failed payments may be retried for a short period before access ends.
      </p>

      <h3>3.4 Taxes</h3>
      <p>
        Prices shown at checkout may include or add applicable taxes depending on your location. If you are a business
        customer and need tax documentation or a tax adjustment, contact us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and include your receipt.
      </p>

      <h2>4. Product, access, and technical issues</h2>
      <p>
        If you have trouble using Receipt Cycle after purchase (bugs, login problems, missing features you reasonably
        expected from our public description), please email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with:
      </p>
      <ul>
        <li>The email address associated with your Receipt Cycle account.</li>
        <li>Whether you paid through Polar or a marketplace, and the approximate purchase date.</li>
        <li>Steps to reproduce the problem, screenshots if helpful, and what you expected to happen.</li>
        <li>Device model and app or browser version where relevant.</li>
      </ul>
      <p>
        We will try to resolve good-faith technical issues promptly. If a defect cannot be fixed and you remain unable to use
        paid functionality as described, we will work with you on a fair remedy, including a refund where appropriate.
      </p>

      <h2>5. Chargebacks and payment disputes</h2>
      <p>
        Please contact us before starting a chargeback or bank dispute; resolving it directly is usually faster. Chargebacks
        can temporarily affect access to paid features while the claim is reviewed.
      </p>

      <h2>6. Purchases outside Polar (app stores)</h2>
      <p>
        If you subscribed through <strong>Apple App Store</strong>, <strong>Google Play</strong>, or another marketplace,
        that platform sets the refund and cancellation rules. Use the store&apos;s purchase history or subscription
        management screen to request a refund or cancel renewals. Marketplace purchases may appear under the store&apos;s
        name on your card statement. Keep your store receipt or order ID when contacting support.
      </p>

      <h2>7. After a refund</h2>
      <p>
        When a refund is approved, access to paid functionality may end as described above. Refunds are returned to the
        original payment method where possible; posting times depend on banks and card networks.
      </p>

      <h2>8. Changes to this page</h2>
      <p>
        We may update this Refund Policy to improve clarity or reflect product or checkout changes. The &quot;Last
        updated&quot; date at the top shows when this page was last revised. A completed purchase remains governed by the
        policy in effect on the purchase date, together with any mandatory laws that apply to you.
      </p>

      <h2>9. Contact</h2>
      <p>
        Product, billing, and refund questions: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <br />
        Receipts and subscription management:{" "}
        <a href={POLAR_PORTAL} rel="noopener noreferrer" target="_blank">
          polar.sh/receipt-cycle/portal
        </a>
        .
      </p>
    </LegalLayout>
  );
}
