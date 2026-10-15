import { useEffect } from "react";
import { useSalesSetup } from "../../contexts/SalesSetupContext";
import { usePreferences } from "../../contexts/PreferencesContext";
import { setDocumentStyleSource } from "../../features/documents/styleStore";

/** Renders nothing; keeps the PDF builder in step with the person's invoice / estimate style settings. */
export function DocumentStyleSync() {
  const { invoiceSettings } = useSalesSetup();
  const { formatDate, numberFormat } = usePreferences();
  useEffect(() => { setDocumentStyleSource(invoiceSettings, formatDate); }, [invoiceSettings, formatDate, numberFormat]);
  return null;
}
