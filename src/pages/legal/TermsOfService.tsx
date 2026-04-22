import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

const PADDLE_BUYER_TERMS = "https://www.paddle.com/legal/buyer-terms";
const PADDLE_REFUND_POLICY = "https://www.paddle.com/legal/refund-policy";

export default function TermsOfService() {
  return (
    <LegalLayout title="Terms of Service" updated="February 2, 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern access to and use of Receipt Cycle software, documentation, and
        related services (together, the &quot;Services&quot;) offered by the supplier identified below. They are
        intended as a clear starting point; you should have qualified legal counsel review them for your jurisdictions,
        industries, and distribution channels before relying on them as final.
      </p>

      <h2>1. Legal entity and branding</h2>
      <p>
        The supplier of the Receipt Cycle product and related Services is <strong>TempEmailGen</strong>, the legal
        business name used for payment, tax, and checkout registration where applicable. <strong>Receipt Cycle</strong>{" "}
        is the trade name, product name, and public brand under which TempEmailGen markets and delivers the Services.
        Unless the context requires otherwise, &quot;we&quot;, &quot;us&quot;, and &quot;our&quot; mean TempEmailGen.
      </p>
      <p>
        References to &quot;Receipt Cycle&quot; in user-facing materials describe the same Services supplied by
        TempEmailGen. If you need our legal name for contracts, invoices, or regulatory filings, use{" "}
        <strong>TempEmailGen</strong> unless we have provided a different registered name in writing for your specific
        deal.
      </p>

      <h2>2. Paddle and other payment relationships</h2>
      <p>
        When you purchase a paid plan or digital goods through our <strong>Paddle</strong> checkout, Paddle group
        companies act as <strong>Merchant of Record</strong> for that transaction. Your contract for payment, receipts,
        and many buyer-facing obligations runs with Paddle as described in Paddle&apos;s{" "}
        <a href={PADDLE_BUYER_TERMS} rel="noopener noreferrer" target="_blank">
          Buyer Terms and Conditions
        </a>{" "}
        and{" "}
        <a href={PADDLE_REFUND_POLICY} rel="noopener noreferrer" target="_blank">
          Refund Policy
        </a>
        . TempEmailGen remains the supplier of the Software as that term is used in Paddle&apos;s documentation.
      </p>
      <p>
        If you purchase through an <strong>app marketplace</strong> (for example Apple or Google), the marketplace is
        typically the seller of record for that channel, and its terms and privacy policy apply to the billing
        relationship in addition to these Terms where they govern use of the app.
      </p>

      <h2>3. Definitions</h2>
      <ul>
        <li>
          <strong>Software</strong> means the Receipt Cycle client applications, web properties we operate for Receipt
          Cycle, and any official downloadable materials we provide for Receipt Cycle.
        </li>
        <li>
          <strong>Your data</strong> means content you create in the Services (such as receipts, transactions, notes, and
          settings) and technical logs tied to your use where applicable.
        </li>
        <li>
          <strong>Backend</strong> means the servers, database, or cloud deployment (for example Convex or other
          infrastructure) that you or your organization connect to the Software to store or process Your data.
        </li>
        <li>
          <strong>You</strong> means the individual or entity agreeing to these Terms. If you use the Services on
          behalf of a company, you represent that you have authority to bind that company.
        </li>
      </ul>

      <h2>4. Eligibility and account responsibility</h2>
      <p>
        You must be old enough under the laws of your country to enter a binding contract and to use the Services as
        offered. You may need to create or maintain an account. You are responsible for the accuracy of information you
        provide and for safeguarding passwords, API keys, devices, and recovery codes. Notify us at{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you believe your account or credentials have been
        compromised.
      </p>

      <h2>5. License to use the Services</h2>
      <p>
        Subject to these Terms and any separate license grant in a paid plan, TempEmailGen grants you a limited,
        non-exclusive, non-transferable, revocable license to download and use the Software for your internal or personal
        purposes in accordance with our documentation and applicable store rules. You may not, except where law
        prohibits this restriction or we give written permission:
      </p>
      <ul>
        <li>Copy, modify, merge, or create derivative works of the Software except as needed for normal use.</li>
        <li>Reverse engineer, decompile, or disassemble the Software except to the limited extent mandatory law allows.</li>
        <li>Rent, lease, sell, sublicense, or redistribute the Software as a standalone product.</li>
        <li>Remove or alter proprietary notices or branding.</li>
        <li>Use the Services to build a competing product by scraping, mirroring, or systematically extracting our UI or
          non-public APIs.</li>
      </ul>

      <h2>6. Description of the Services</h2>
      <p>
        Receipt Cycle helps you capture, organize, and work with expense and receipt-related workflows, primarily through
        mobile experiences, with optional web or marketing surfaces. Features may include scanning or importing receipts,
        categorization, export, and sync with a Backend you control. Exact features depend on the product version, plan,
        and platform.
      </p>
      <p>
        We may modify, add, or remove features to improve security, performance, or compliance, or to reflect product
        strategy. Where practicable, we will give reasonable advance notice of material adverse changes to paid
        functionality; emergency fixes or legally required changes may ship without prior notice.
      </p>

      <h2>7. Your data and the Backend</h2>
      <p>
        Many deployments store Your data in a Backend that <strong>you or your administrator</strong> configure—not on
        servers we operate as a default for all users. You retain ownership of Your data subject to your agreements with
        your Backend provider. You are responsible for backups, retention, export, compliance with employment and
        financial record-keeping rules, and any processor or subprocessors you appoint.
      </p>
      <p>
        We process personal data as described in our Privacy Policy. Support access to Your data is limited to what is
        needed to help you when you contact us and grant permission, or what the law requires.
      </p>

      <h2>8. Acceptable use</h2>
      <p>You agree not to misuse the Services. Without limitation, you must not:</p>
      <ul>
        <li>Use the Services for unlawful, fraudulent, or harmful activity.</li>
        <li>Harass, threaten, or abuse others, or upload illegal content.</li>
        <li>Attempt to probe, scan, or test the vulnerability of our systems or bypass authentication.</li>
        <li>Overload or disrupt the Services or third-party infrastructure (for example denial-of-service style traffic).</li>
        <li>Misrepresent identity, forge headers, or send unsolicited bulk messages through our contact channels.</li>
        <li>Use the Services to infringe intellectual property or privacy rights of third parties.</li>
      </ul>
      <p>
        We may suspend or terminate access for violations, repeated abuse, or risk to other users or systems, with or
        without notice where the law or platform rules allow.
      </p>

      <h2>9. Third-party services</h2>
      <p>
        The Services may integrate with or link to third parties (payment processors, identity providers, cloud
        platforms, analytics where disclosed, etc.). Their terms and privacy notices apply to your use of their
        services. We are not responsible for third-party downtime, pricing, or policy changes beyond our reasonable
        control.
      </p>

      <h2>10. Fees, trials, and taxes</h2>
      <p>
        Paid features require timely payment through the channel you choose. Prices, currency, taxes, and invoicing for
        Paddle checkout follow Paddle&apos;s checkout and legal documents at the time of purchase. For marketplace
        purchases, the store sets price and tax presentation. You are responsible for providing accurate billing details
        and for any fees your bank or card issuer charges.
      </p>

      <h2>11. Intellectual property</h2>
      <p>
        The Software, Receipt Cycle branding, and our documentation are owned by TempEmailGen or its licensors and are
        protected by copyright, trademark, and other laws. Except for the limited license in Section 5, no rights are
        granted to you. Feedback you voluntarily provide may be used by us without restriction or compensation to improve
        the Services.
      </p>

      <h2>12. Disclaimers</h2>
      <p>
        To the fullest extent permitted by applicable law, the Services are provided <strong>&quot;as is&quot;</strong>{" "}
        and <strong>&quot;as available&quot;</strong> without warranties of any kind, whether express, implied, or
        statutory, including implied warranties of merchantability, fitness for a particular purpose, title, and
        non-infringement. We do not warrant that the Services will be uninterrupted, error-free, or free of harmful
        components.
      </p>
      <p>
        Receipt Cycle is <strong>not</strong> accounting, tax, legal, or compliance advice. You remain responsible for
        your financial records, filings, and professional advice.
      </p>

      <h2>13. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, TempEmailGen and its suppliers will not be liable for any indirect,
        incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, goodwill,
        data, or business opportunities, arising out of or related to the Services or these Terms, even if advised of
        the possibility of such damages.
      </p>
      <p>
        To the maximum extent permitted by law, our aggregate liability for claims arising out of or related to the
        Services or these Terms will not exceed the greater of (a) the amount you paid TempEmailGen directly for the
        Services in the twelve months before the claim (excluding amounts collected by Paddle or app stores as
        Merchant or seller of record), or (b) fifty US dollars (USD $50) if no such payment occurred.
      </p>
      <p>
        Some jurisdictions do not allow certain disclaimers or limitations; in those cases, our liability is limited to
        the extent permitted by law. Nothing in these Terms limits liability that cannot be limited under mandatory law
        (including gross negligence, fraud, or personal injury where applicable).
      </p>

      <h2>14. Indemnity</h2>
      <p>
        To the extent permitted by law, you will defend and indemnify TempEmailGen and its directors, officers, and
        employees against third-party claims, damages, and costs (including reasonable attorneys&apos; fees) arising
        from your misuse of the Services, your violation of these Terms, or your violation of others&apos; rights,
        except to the extent caused by our willful misconduct.
      </p>

      <h2>15. Term and termination</h2>
      <p>
        These Terms apply from your first use of the Services until terminated. You may stop using the Services at any
        time. We may suspend or terminate access for breach, risk, non-payment where we bill you directly, or
        discontinuance of the product line, in line with applicable law and any separate commercial agreement.
      </p>
      <p>
        Sections that by their nature should survive (including intellectual property, disclaimers, limitation of
        liability, indemnity, and governing law) survive termination.
      </p>

      <h2>16. Governing law and disputes</h2>
      <p>
        Unless mandatory consumer law in your country requires otherwise, these Terms are governed by the laws of the
        jurisdiction TempEmailGen designates after legal review, and exclusive venue may lie in the courts of that
        jurisdiction for business users. <strong>Placeholder:</strong> replace this paragraph with the governing law
        and venue your counsel selects (for example a specific U.S. state, EU member state, or England and Wales).
      </p>
      <p>
        For consumers, you may have rights to bring claims in your home courts or under mandatory local law regardless of
        the above choice of law for business counterparties.
      </p>

      <h2>17. Export and sanctions</h2>
      <p>
        You may not use or export the Services in violation of export control or sanctions laws. You represent that you
        are not prohibited from receiving the Services under applicable laws.
      </p>

      <h2>18. Changes to these Terms</h2>
      <p>
        We may update these Terms by posting a revised version on this site and updating the &quot;Last updated&quot; date.
        If a change is material, we will try to provide additional notice (for example by email or in-app message) where
        reasonable and required by law. Continued use after the effective date may constitute acceptance; if you do not
        agree, stop using the Services and cancel paid plans through the applicable billing channel.
      </p>

      <h2>19. General</h2>
      <ul>
        <li>
          <strong>Entire agreement:</strong> These Terms and policies linked from our site (such as the Privacy Policy and
          Refund Policy) are the entire agreement between you and TempEmailGen regarding the Services, superseding prior
          oral understandings on the same subject, except for written enterprise agreements you sign with us.
        </li>
        <li>
          <strong>Severability:</strong> If a provision is invalid or unenforceable, the remaining provisions remain in
          effect.
        </li>
        <li>
          <strong>No waiver:</strong> Failure to enforce a provision is not a waiver of future enforcement.
        </li>
        <li>
          <strong>Assignment:</strong> You may not assign these Terms without our consent. We may assign them in connection
          with a merger, acquisition, or sale of assets, with notice where required by law.
        </li>
        <li>
          <strong>Independent contractors:</strong> Nothing creates a partnership, agency, or joint venture.
        </li>
      </ul>

      <h2>20. Contact</h2>
      <p>
        Questions about these Terms or the Services:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
      <p>
        For Paddle receipts, refunds, and subscription management, use the links in your Paddle email or Paddle&apos;s{" "}
        <a href="https://paddle.net/" rel="noopener noreferrer" target="_blank">
          buyer support
        </a>
        .
      </p>
    </LegalLayout>
  );
}
