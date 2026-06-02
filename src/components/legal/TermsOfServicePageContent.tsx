import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import {
  TERMS_OF_SERVICE_EFFECTIVE_DATE,
  TERMS_OF_SERVICE_SECTIONS,
} from "@/lib/legal/termsOfServiceSections";

export function TermsOfServicePageContent() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      effectiveDate={TERMS_OF_SERVICE_EFFECTIVE_DATE}
      intro="These terms govern your use of Aquatics Empowered software and website. Please read them carefully before using the Service."
      sections={TERMS_OF_SERVICE_SECTIONS}
      footerLinks={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/login", label: "Return to sign in" },
      ]}
    />
  );
}
