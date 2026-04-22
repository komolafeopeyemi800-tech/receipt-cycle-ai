import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

const PADDLE_BUYER_TERMS = "https://www.paddle.com/legal/buyer-terms";
const PADDLE_REFUND_POLICY = "https://www.paddle.com/legal/refund-policy";
const PADDLE_HELP = "https://www.paddle.com/help";

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" updated="February 2, 2026">
      <p>
        This Refund Policy explains how refunds, subscription cancellations, and related buyer rights work for Receipt
        Cycle. It is written for clarity on our website and to complement the policies that apply when Paddle processes
        your payment as Merchant of Record.
      </p>
      <p>
        <strong>Important:</strong> If you paid through Paddle, Paddle&apos;s{" "}
        <a href={PADDLE_REFUND_POLICY} rel="noopener noreferrer" target="_blank">
          Refund Policy
        </a>{" "}
        and{" "}
        <a href={PADDLE_BUYER_TERMS} rel="noopener noreferrer" target="_blank">
          Buyer Terms and Conditions
        </a>{" "}
        are the authoritative documents for refund eligibility, timing, and process. Nothing on this page overrides
        mandatory consumer protection law in your country or Paddle&apos;s published policies.
      </p>

      <h2>1. Who does what</h2>
      <p>
        <strong>TempEmailGen</strong> (supplier) develops and supports Receipt Cycle under the Receipt Cycle brand. When
        you buy through our Paddle checkout, <strong>Paddle.com Market Limited</strong> and its affiliates act as{" "}
        <strong>Merchant of Record</strong>: they collect payment, issue receipts, handle applicable taxes where
        Paddle does so on your transaction, and operate the buyer support flows described in Paddle&apos;s legal
        documents.
      </p>
      <p>
        That division matters for refunds: for Paddle transactions, Paddle (not TempEmailGen) decides refund requests in
        line with its policies and applicable law. We still help with product questions, bugs, and account issues when
        you contact us directly.
      </p>

      <h2>2. Definitions</h2>
      <ul>
        <li>
          <strong>Services / Product</strong> means the Receipt Cycle software and related materials you purchased or
          subscribe to.
        </li>
        <li>
          <strong>Paddle checkout</strong> means a purchase completed through Paddle&apos;s hosted checkout or
          invoicing where Paddle is identified as Merchant of Record on your receipt or bank statement.
        </li>
        <li>
          <strong>Marketplace purchase</strong> means a purchase billed by a third-party app store (for example Apple App
          Store or Google Play) rather than Paddle.
        </li>
        <li>
          <strong>Transaction</strong> has the meaning used in Paddle&apos;s Buyer Terms for your Paddle purchase.
        </li>
      </ul>

      <h2>3. Purchases through Paddle</h2>
      <h3>3.1 What governs your refund rights</h3>
      <p>
        For Paddle checkout, your rights and remedies are set out in Paddle&apos;s{" "}
        <a href={PADDLE_REFUND_POLICY} rel="noopener noreferrer" target="_blank">
          Refund Policy
        </a>
        , which forms part of Paddle&apos;s{" "}
        <a href={PADDLE_BUYER_TERMS} rel="noopener noreferrer" target="_blank">
          Buyer Terms and Conditions
        </a>
        . Those documents describe, among other things:
      </p>
      <ul>
        <li>How to withdraw from a purchase or request a refund, including time limits that depend on your location.</li>
        <li>How subscription cancellation works (including that cancellation typically stops future renewals rather than
          automatically reversing past charges).</li>
        <li>Rules for discretionary refunds, technical or defective products, chargebacks, and fraud prevention.</li>
        <li>How Paddle may verify your request against transaction records.</li>
      </ul>
      <p>
        Paddle&apos;s Refund Policy also explains that, where local consumer law grants you non-waivable rights, the
        highest level of protection that applies to you will govern.
      </p>

      <h3>3.2 How to request a refund or manage a Paddle subscription</h3>
      <p>Follow Paddle&apos;s instructions. In summary, you can typically:</p>
      <ul>
        <li>
          Use the <strong>&quot;View receipt&quot;</strong> or <strong>&quot;Manage subscription&quot;</strong> link in
          your Paddle order or subscription confirmation email.
        </li>
        <li>
          Visit Paddle&apos;s buyer support site at{" "}
          <a href="https://paddle.net/" rel="noopener noreferrer" target="_blank">
            paddle.net
          </a>{" "}
          and use the options there (including &quot;Request refund&quot; where available).
        </li>
        <li>
          Refer to section 3 (&quot;How to Withdraw and Request a Refund&quot;) of Paddle&apos;s Refund Policy for the
          official step list and any updates Paddle publishes.
        </li>
      </ul>
      <p>
        If you are unsure whether you are eligible, Paddle&apos;s support channels are the right place to confirm for
        Paddle-billed orders. General Paddle help topics are listed at{" "}
        <a href={PADDLE_HELP} rel="noopener noreferrer" target="_blank">
          paddle.com/help
        </a>
        .
      </p>

      <h3>3.3 Region-specific and statutory rights (summary only)</h3>
      <p>
        Paddle&apos;s Refund Policy includes country- and region-specific rules (for example rules for consumers in the
        EU, EEA, UK, United States, Canada, and other territories). Those sections may describe cooling-off periods,
        withdrawal conditions for digital content, and other requirements. Because the details can change and depend on
        where you bought from and how you used the Product, the current text on Paddle&apos;s site—not a summary on
        this page—is controlling.
      </p>

      <h3>3.4 Subscription renewals and free trials</h3>
      <p>
        Paddle&apos;s Buyer Terms describe how subscriptions renew, how failed payments may be retried, and how you can
        cancel so you are not charged again after the end of the current billing period. If your plan includes a free
        trial, Paddle&apos;s documents explain when billing starts and how cancellation before the trial ends works.
        Always check the checkout screen and confirmation email for your specific plan terms.
      </p>

      <h3>3.5 Tax-only refunds for businesses</h3>
      <p>
        If you are a business customer and need a <strong>sales tax</strong> (VAT, GST, or similar) adjustment rather
        than a full transaction refund, Paddle&apos;s Buyer Terms include a dedicated section on tax refunds, including
        documentation you may need to provide and time limits. See Paddle&apos;s Buyer Terms for the current process.
      </p>

      <h2>4. Product, access, and technical issues</h2>
      <p>
        If you have trouble using Receipt Cycle after purchase—bugs, login problems, missing features you reasonably
        expected from our public description—please email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with:
      </p>
      <ul>
        <li>The email address associated with your Receipt Cycle account (if any).</li>
        <li>Whether you paid via Paddle or a marketplace, and approximate purchase date.</li>
        <li>Steps to reproduce the problem, screenshots if helpful, and what you expected to happen.</li>
        <li>Device model and app or browser version where relevant.</li>
      </ul>
      <p>
        We will try to resolve good-faith technical issues promptly. If a defect cannot be fixed and you remain unable to
        use paid functionality as described, Paddle&apos;s Refund Policy includes a process for technical or product
        defects—often involving contact with the supplier first, then Paddle if needed. Follow that policy so Paddle can
        coordinate any refund with the facts of your case.
      </p>

      <h2>5. Chargebacks and payment disputes (Paddle)</h2>
      <p>
        If you paid through Paddle, Paddle encourages you to contact Paddle before initiating a chargeback or bank
        dispute, because that route is often faster. Chargebacks can temporarily affect access while the claim is reviewed.
        For the official wording, see Paddle&apos;s Refund Policy and Buyer Terms.
      </p>

      <h2>6. Purchases outside Paddle (app stores)</h2>
      <p>
        If you subscribed or bought Receipt Cycle through <strong>Apple App Store</strong>, <strong>Google Play</strong>
        , or another marketplace, that platform—not Paddle and not this page—sets refund and cancellation rules. Use the
        store&apos;s purchase history, subscription management screen, or support article for your platform to request a
        refund or cancel renewals.
      </p>
      <p>
        Marketplace purchases may appear under the store&apos;s name on your card statement. Keep your store receipt or
        order ID when contacting support.
      </p>

      <h2>7. After a refund</h2>
      <p>
        When Paddle (or a marketplace) approves a refund, access to paid functionality may end as described in the
        applicable policy. Refunds are typically returned to the original payment method where possible; posting times
        depend on banks and card networks.
      </p>

      <h2>8. Changes to this page</h2>
      <p>
        We may update this Refund Policy to improve clarity or reflect product or checkout changes. The &quot;Last
        updated&quot; date at the top shows when this page was last revised. Your completed Transaction remains governed
        by the Paddle (or marketplace) policies that were in effect for that purchase, together with any mandatory laws
        that apply to you.
      </p>

      <h2>9. Contact</h2>
      <p>
        Product and account support:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <br />
        Paddle checkout, receipts, and subscription management: use Paddle&apos;s links from your receipt or{" "}
        <a href="https://paddle.net/" rel="noopener noreferrer" target="_blank">
          paddle.net
        </a>
        .
      </p>
    </LegalLayout>
  );
}
