import { LegalDocumentPage } from "@/components/legal/LegalDocumentPage";
import {
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_SECTIONS,
} from "@/lib/legal/privacyPolicySections";

export function PrivacyPolicyPageContent() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      effectiveDate={PRIVACY_POLICY_EFFECTIVE_DATE}
      intro="This policy describes how Aquatics Empowered handles personal information when you use our website and software."
      sections={PRIVACY_POLICY_SECTIONS}
      footerLinks={[
        { href: "/terms", label: "Terms of Service" },
        { href: "/login", label: "Return to sign in" },
      ]}
    />
  );
}
