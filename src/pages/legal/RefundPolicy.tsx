import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

const PADDLE_BUYER_TERMS = "https://www.paddle.com/legal/buyer-terms";
const PADDLE_REFUND_POLICY = "https://www.paddle.com/legal/refund-policy";

export default function RefundPolicy() {
  return (
    <LegalLayout title="Refund Policy" updated="April 22, 2026">
      <p>
        This page describes how refunds work for Receipt Cycle when you pay through Paddle. Paddle is the Merchant of
        Record for those transactions. Your statutory rights and Paddle&apos;s rules take precedence over anything
        inconsistent on this site.
      </p>

      <h2>1. Paddle checkout</h2>
      <p>
        If you completed your purchase using Paddle, refunds, subscription cancellations, and withdrawal or cooling-off
        rights are handled under Paddle&apos;s{" "}
        <a href={PADDLE_REFUND_POLICY} rel="noopener noreferrer" target="_blank">
          Refund Policy
        </a>{" "}
        and{" "}
        <a href={PADDLE_BUYER_TERMS} rel="noopener noreferrer" target="_blank">
          Buyer Terms and Conditions
        </a>
        . Those documents explain eligibility, time limits, how to request a refund, and how subscriptions renew and
        cancel.
      </p>

      <h2>2. How to request a refund (Paddle)</h2>
      <p>
        Use the &quot;View receipt&quot; or &quot;Manage subscription&quot; link in your Paddle confirmation email, or
        follow the refund steps described in Paddle&apos;s Refund Policy (including{" "}
        <a href="https://paddle.net/" rel="noopener noreferrer" target="_blank">
          paddle.net
        </a>
        ).
      </p>

      <h2>3. Product or technical issues</h2>
      <p>
        If something is wrong with Receipt Cycle after purchase, contact us first at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> so we can help. If the issue cannot be resolved, Paddle
        may assist as described in the &quot;Refunds for Technical or Product Defects&quot; section of Paddle&apos;s
        Refund Policy.
      </p>

      <h2>4. Other payment channels</h2>
      <p>
        If you subscribed or purchased through an app marketplace (for example Apple App Store or Google Play), that
        platform&apos;s billing and refund rules apply. Use the store&apos;s purchase history or support flow to
        request a refund or manage your subscription.
      </p>

      <h2>5. Changes</h2>
      <p>
        We may update this page for clarity. The &quot;Last updated&quot; date reflects edits here; your purchase
        remains governed by the Paddle policies in effect at the time of your transaction.
      </p>
    </LegalLayout>
  );
}
