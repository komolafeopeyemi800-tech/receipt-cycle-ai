import { LegalLayout } from "./LegalLayout";
import { SUPPORT_EMAIL } from "@/content/site";

export default function Impressum() {
  return (
    <LegalLayout title="Impressum" updated="April 9, 2026">
      <p>
        <strong>Angaben gemäß § 5 TMG (Platzhalter)</strong> — Replace with your German legal entity details if you market to users in
        Germany or are required to publish an Impressum.
      </p>
      <h2>Diensteanbieter</h2>
      <p>
        [Unternehmensname]
        <br />
        [Straße Hausnummer]
        <br />
        [PLZ Ort]
        <br />
        Deutschland
      </p>
      <h2>Kontakt</h2>
      <p>
        E-Mail:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </p>
      <h2>Vertretungsberechtigte</h2>
      <p>[Name der vertretungsberechtigten Person / Geschäftsführer]</p>
      <h2>Registereintrag (falls zutreffend)</h2>
      <p>[Registergericht, Registernummer]</p>
      <h2>Umsatzsteuer-ID (falls vorhanden)</h2>
      <p>[USt-IdNr.]</p>
      <h2>EU-Streitschlichtung</h2>
      <p>
        Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer">
          https://ec.europa.eu/consumers/odr/
        </a>
        . Unsere E-Mail-Adresse finden Sie oben im Impressum.
      </p>
      <h2>Verbraucherstreitbeilegung</h2>
      <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
    </LegalLayout>
  );
}
