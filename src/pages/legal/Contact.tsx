import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";
import { INSTAGRAM_URL, TWITTER_URL } from "@/content/site";

export default function Contact() {
  return (
    <LegalLayout title="Contact">
      <p>We’d love to hear from you—product feedback, partnerships, press, or support.</p>
      <h2>Email</h2>
      <p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-lg font-semibold">
          {SUPPORT_EMAIL}
        </a>
      </p>
      <h2>Social</h2>
      <ul>
        <li>
          <a href={TWITTER_URL} target="_blank" rel="noopener noreferrer">
            X (Twitter)
          </a>
        </li>
        <li>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        </li>
      </ul>
      <h2>Response times</h2>
      <p>We aim to reply to support requests within a few business days. Security issues should be marked “URGENT” in the subject line.</p>
    </LegalLayout>
  );
}
