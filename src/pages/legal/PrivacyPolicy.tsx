import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

export default function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="October 2, 2026">
      <p>
        This Privacy Policy explains how Receipt Cycle ("Receipt Cycle," "we," "us," or "our") collects, uses,
        discloses, and protects personal information when you visit our website, use our web or mobile applications,
        contact support, or otherwise use our services. It also explains the choices and privacy rights available to you.
      </p>

      <h2>1. Scope and who is responsible</h2>
      <p>
        This Policy applies to Receipt Cycle's public website, accounts, mobile application, web application, and related
        support services. Receipt Cycle is responsible for the personal information described here, except where a third
        party independently determines how it uses information under its own privacy policy. Questions can be sent to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>2. Information we collect</h2>
      <p>Depending on the features you use, we may collect the following categories of information:</p>
      <ul>
        <li><strong>Account information:</strong> name, email address, authentication identifiers, profile details, preferences, and account settings.</li>
        <li><strong>Business and financial records you provide:</strong> receipts and receipt images, expenses, transactions, income records, budgets, customers, services, estimates, invoices, payment records, reports, notes, categories, tax-related labels, and attached documents.</li>
        <li><strong>AI and OCR inputs:</strong> files, images, prompts, and related context you choose to submit for extraction, categorization, analysis, or assistance, together with the generated output.</li>
        <li><strong>Subscription information:</strong> plan, subscription status, purchase history, and limited transaction details. Payment processors or app stores generally process full payment-card details rather than Receipt Cycle.</li>
        <li><strong>Device and usage information:</strong> IP address, browser and device type, operating system, app version, language, approximate region, pages or features used, timestamps, crash data, and security logs.</li>
        <li><strong>Communications:</strong> messages, feedback, support requests, and any files you send to our team.</li>
        <li><strong>Integration information:</strong> data required to connect or use an optional service you authorize, such as sign-in or backup functionality.</li>
      </ul>

      <h2>3. How we collect information</h2>
      <p>
        We collect information directly from you, automatically when you use our services, and from services you choose
        to connect. We may also receive subscription confirmation from an app marketplace or payment provider and basic
        authentication details from a sign-in provider. We only request access appropriate to the feature you enable.
      </p>

      <h2>4. How we use information</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>create and administer accounts, authenticate users, and provide requested features;</li>
        <li>store, organize, display, export, and synchronize the records you enter;</li>
        <li>scan receipts, extract data, categorize records, and provide AI-assisted analysis when requested;</li>
        <li>process subscriptions, maintain entitlements, and send service communications;</li>
        <li>respond to questions, investigate problems, and provide customer support;</li>
        <li>protect accounts, prevent fraud or abuse, and maintain the reliability of our services;</li>
        <li>understand feature performance and improve accessibility, usability, and product quality; and</li>
        <li>meet legal obligations, enforce our terms, and establish or defend legal claims.</li>
      </ul>

      <h2>5. Legal bases for processing</h2>
      <p>
        Where applicable law requires a legal basis, we process information as needed to perform our contract with you,
        comply with law, pursue legitimate interests such as security and service improvement, or act with your consent.
        You may withdraw consent at any time, without affecting processing that occurred before withdrawal.
      </p>

      <h2>6. AI, receipt scanning, and automated processing</h2>
      <p>
        Receipt Cycle may use automated tools to read receipt images, suggest fields or categories, summarize records, and
        answer questions about information in your workspace. Automated output can be incomplete or incorrect, so you
        should review it before relying on it for accounting, tax, payment, or business decisions. Receipt Cycle does not
        use these tools to make decisions that produce legal or similarly significant effects about you without meaningful
        human involvement.
      </p>

      <h2>7. When we disclose information</h2>
      <p>We may disclose information only as reasonably necessary to:</p>
      <ul>
        <li><strong>Service providers:</strong> companies supporting hosting, databases, authentication, payments, app distribution, communications, security, customer support, AI, or OCR processing. They may process information only for contracted services and subject to appropriate obligations.</li>
        <li><strong>Your direction:</strong> people or services you choose to share with, connect, export to, or authorize.</li>
        <li><strong>Legal and safety purposes:</strong> authorities or other parties when required by law or reasonably necessary to protect rights, safety, users, and the integrity of the service.</li>
        <li><strong>Business transactions:</strong> advisers and a prospective or completed buyer in a merger, financing, reorganization, or sale, subject to appropriate confidentiality and legal safeguards.</li>
      </ul>
      <p>
        We do not sell personal information for money, and we do not use the financial content in your workspace for
        cross-context behavioral advertising.
      </p>

      <h2>8. Cookies and similar technologies</h2>
      <p>
        We may use essential storage technologies for authentication, security, preferences, and core site operation.
        If optional analytics or similar technologies are enabled, we will provide the choices required by applicable law.
        Learn more in our <a href="/cookies">Cookie Policy</a>.
      </p>

      <h2>9. Data retention</h2>
      <p>
        We retain personal information for as long as needed to provide your account and requested services, meet legal or
        accounting obligations, resolve disputes, enforce agreements, and maintain security. Retention depends on the data's
        nature, sensitivity, purpose, and legal requirements. After account deletion, some information may remain for a
        limited period in protected backups or where law requires retention, after which it is deleted or de-identified.
      </p>

      <h2>10. Security</h2>
      <p>
        We use administrative, technical, and organizational safeguards designed to protect information, including access
        controls and measures appropriate to the service. No online service can guarantee absolute security. Protect your
        sign-in credentials, use a strong unique password, and contact us promptly if you suspect unauthorized access.
      </p>

      <h2>11. International data transfers</h2>
      <p>
        Receipt Cycle and its service providers may process information in countries other than where you live. Where
        required, we use recognized safeguards for international transfers, such as contractual protections, and take steps
        designed to ensure an appropriate level of protection.
      </p>

      <h2>12. Your privacy rights and choices</h2>
      <p>
        Depending on your location, you may have the right to request access, correction, deletion, restriction, objection,
        or portability; withdraw consent; or appeal a decision about a request. You may also have the right to opt out of
        certain sale, sharing, targeted advertising, or profiling practices and to receive equal service after exercising a
        privacy right. Some information can be reviewed or changed through your account.
      </p>
      <p>
        To submit a request, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. We may need to verify your
        identity and authority before acting. An authorized agent may submit a request where local law permits. We will
        respond within the period required by applicable law. You may also complain to your local data-protection authority.
      </p>

      <h2>13. Account deletion and exports</h2>
      <p>
        Where available, use the account tools to export records or request deletion. Deleting the mobile app does not by
        itself delete an online account or records stored with the service. If you cannot access the relevant control,
        contact support from the email associated with your account.
      </p>

      <h2>14. Children's privacy</h2>
      <p>
        Receipt Cycle is intended for business users and is not directed to children under 13, or a higher minimum age where
        local law requires it. We do not knowingly collect personal information from children in violation of applicable law.
        Contact us if you believe a child has provided information improperly.
      </p>

      <h2>15. Third-party services and links</h2>
      <p>
        Our services may link to or integrate with third-party products. Their privacy practices are governed by their own
        notices, and we encourage you to review them before authorizing a connection or submitting information.
      </p>

      <h2>16. Changes to this Policy</h2>
      <p>
        We may update this Policy as our services, practices, or legal obligations change. We will post the revised version
        with a new effective date and provide additional notice when a material change requires it.
      </p>

      <h2>17. Contact us</h2>
      <p>
        For privacy questions or requests, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Please do not send
        card numbers, passwords, government identifiers, or other sensitive credentials by email.
      </p>
    </LegalLayout>
  );
}
