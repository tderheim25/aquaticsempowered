export type PrivacyPolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const PRIVACY_POLICY_EFFECTIVE_DATE = "June 1, 2026";

export const PRIVACY_POLICY_SECTIONS: PrivacyPolicySection[] = [
  {
    id: "introduction",
    title: "Introduction",
    paragraphs: [
      'Aquatics Empowered™ ("Aquatics Empowered," "we," "us," or "our") provides software for aquatic facility operators to manage inspections, chemistry, maintenance, teams, and related workflows.',
      "This Privacy Policy explains how we collect, use, disclose, and protect personal information when you visit our website, create an account, or use our services (collectively, the \"Service\").",
      "By using the Service, you acknowledge this policy. If you do not agree, please do not use the Service.",
    ],
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    paragraphs: ["We collect information in these categories:"],
    bullets: [
      "Account information — name, email address, password (stored in hashed form by our authentication provider), organization membership, role, and profile details you choose to provide.",
      "Facility and operational data — pool and site details, inspection records, chemical logs, maintenance tasks, equipment data, documents, and other content you or your organization enter into the Service.",
      "Billing information — when you subscribe to a paid plan, payment details are collected and processed by our payment processor; we receive limited billing metadata such as subscription status and customer identifiers.",
      "Usage and technical data — device type, browser, IP address, pages viewed, and similar diagnostics used to operate, secure, and improve the Service.",
      "Communications — messages you send to us (for example, support requests) and transactional emails we send related to your account.",
    ],
  },
  {
    id: "how-we-use",
    title: "How we use information",
    paragraphs: ["We use personal information to:"],
    bullets: [
      "Provide, maintain, and improve the Service.",
      "Authenticate users and enforce role-based access within your organization.",
      "Process subscriptions and send billing-related notices.",
      "Send transactional messages such as sign-in links, invitations, and account alerts.",
      "Monitor security, prevent abuse, and troubleshoot errors.",
      "Comply with law and respond to lawful requests.",
      "With your consent or at your direction, where applicable.",
    ],
  },
  {
    id: "legal-bases",
    title: "Legal bases (where applicable)",
    paragraphs: [
      "If you are in a region that requires a legal basis for processing (such as the EEA or UK), we rely on: performance of our contract with you or your organization; legitimate interests in operating and securing the Service; compliance with legal obligations; and consent where we ask for it explicitly.",
    ],
  },
  {
    id: "sharing",
    title: "How we share information",
    paragraphs: [
      "We do not sell your personal information. We share information only as described below:",
    ],
    bullets: [
      "Service providers — trusted vendors that help us run the Service (for example, hosting, authentication, email delivery, payments, analytics, and error monitoring), subject to contractual obligations to protect your data.",
      "Your organization — other users in your organization may see information you submit according to your role and workspace permissions.",
      "Business transfers — in connection with a merger, acquisition, or sale of assets, subject to appropriate confidentiality commitments.",
      "Legal and safety — when required by law or to protect rights, safety, and security of Aquatics Empowered, our users, or the public.",
    ],
  },
  {
    id: "processors",
    title: "Third-party services",
    paragraphs: [
      "We use third-party infrastructure and tools to deliver the Service. These providers process data on our behalf and may store data in the United States or other countries. Categories include:",
    ],
    bullets: [
      "Cloud hosting and application delivery.",
      "Database, authentication, and file storage (Supabase).",
      "Email delivery (Resend).",
      "Payment processing (Stripe), when you use paid features.",
      "Product analytics (PostHog), when enabled in your environment.",
      "Error and performance monitoring (Sentry), when configured.",
    ],
  },
  {
    id: "retention",
    title: "Data retention",
    paragraphs: [
      "We retain personal information for as long as your account is active or as needed to provide the Service, comply with legal obligations, resolve disputes, and enforce our agreements.",
      "Organization administrators may be able to export or delete certain workspace data subject to product capabilities and your contract. Contact us if you need help with account-level deletion.",
    ],
  },
  {
    id: "security",
    title: "Security",
    paragraphs: [
      "We use administrative, technical, and organizational measures designed to protect personal information, including encryption in transit, access controls, and audit-oriented logging. No method of transmission or storage is completely secure; we cannot guarantee absolute security.",
    ],
  },
  {
    id: "your-rights",
    title: "Your choices and rights",
    paragraphs: [
      "Depending on where you live, you may have rights to access, correct, delete, or port your personal information, or to object to or restrict certain processing.",
      "You can update profile details in the Service where available. To exercise other rights, contact us at the email below. We may need to verify your identity before responding.",
      "You may opt out of non-essential marketing emails by using unsubscribe instructions in those messages. Transactional emails related to your account may still be sent.",
    ],
  },
  {
    id: "children",
    title: "Children",
    paragraphs: [
      "The Service is intended for organizations and adults managing aquatic facilities. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, contact us and we will take appropriate steps to delete it.",
    ],
  },
  {
    id: "international",
    title: "International users",
    paragraphs: [
      "If you access the Service from outside the United States, your information may be transferred to and processed in the United States or other countries where our providers operate, which may have different data protection laws than your jurisdiction.",
    ],
  },
  {
    id: "changes",
    title: "Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. We will post the revised version on this page and update the effective date. Material changes may be communicated through the Service or by email where appropriate.",
    ],
  },
  {
    id: "contact",
    title: "Contact us",
    paragraphs: ["Questions about this Privacy Policy or our privacy practices:"],
  },
];
