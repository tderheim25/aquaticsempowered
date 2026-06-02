export type TermsOfServiceSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export const TERMS_OF_SERVICE_EFFECTIVE_DATE = "June 1, 2026";

export const TERMS_OF_SERVICE_SECTIONS: TermsOfServiceSection[] = [
  {
    id: "agreement",
    title: "Agreement to these terms",
    paragraphs: [
      'These Terms of Service ("Terms") govern your access to and use of the Aquatics Empowered™ website, applications, and related services (collectively, the "Service") operated by Aquatics Empowered ("we," "us," or "our").',
      "By creating an account, signing in, or using the Service, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the Service.",
      "If you use the Service on behalf of an organization, you represent that you have authority to bind that organization, and \"you\" includes the organization.",
    ],
  },
  {
    id: "eligibility",
    title: "Eligibility",
    paragraphs: [
      "You must be at least 18 years old and able to form a binding contract to use the Service.",
      "The Service is intended for aquatic facility operators, staff, vendors, and related professionals. You agree to provide accurate registration information and keep it current.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts and security",
    paragraphs: ["You are responsible for:"],
    bullets: [
      "Maintaining the confidentiality of your login credentials.",
      "All activity that occurs under your account, except where caused by our failure to provide reasonable security.",
      "Promptly notifying us if you suspect unauthorized access to your account.",
    ],
  },
  {
    id: "subscriptions",
    title: "Subscriptions and billing",
    paragraphs: [
      "Paid plans are billed through our payment processor (Stripe). Fees, billing cycles, and plan features are described on our pricing pages and at checkout.",
      "Subscriptions renew automatically unless cancelled according to the process provided in the Service or Stripe customer portal.",
      "We may change prices or plan features with reasonable notice where required by law. Price changes generally apply at the next renewal after notice.",
      "Except where required by law, fees are non-refundable once a billing period has started. Trial or promotional terms, if offered, will be stated at sign-up.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Use the Service in violation of law or third-party rights.",
      "Upload malware, attempt unauthorized access, or interfere with the Service's operation.",
      "Scrape, reverse engineer, or resell the Service except as expressly permitted.",
      "Use the Service to store or transmit content that is unlawful, harassing, or infringes intellectual property.",
      "Misrepresent your identity, facility, or affiliation.",
    ],
  },
  {
    id: "your-content",
    title: "Your content and facility data",
    paragraphs: [
      "You retain ownership of content you submit (for example, logs, inspections, documents, and messages). You grant us a limited license to host, process, and display that content solely to provide and improve the Service.",
      "You are responsible for the accuracy of operational and compliance data you enter and for how your organization uses exports or reports generated from the Service.",
      "We may remove content that violates these Terms or creates risk to the Service or others.",
    ],
  },
  {
    id: "intellectual-property",
    title: "Our intellectual property",
    paragraphs: [
      "The Service, including software, branding, documentation, and design, is owned by us or our licensors and protected by intellectual property laws. These Terms do not grant you any rights except the limited right to use the Service as permitted here.",
    ],
  },
  {
    id: "third-parties",
    title: "Third-party services",
    paragraphs: [
      "The Service may integrate with third-party services (for example, payment processing, email, analytics, or hosting). Your use of those services may be subject to their terms. We are not responsible for third-party services we do not control.",
    ],
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    paragraphs: [
      'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
      "The Service supports facility operations but does not replace professional judgment, applicable health codes, or regulatory requirements. You are solely responsible for pool safety, chemical treatment, staffing, and compliance with federal, state, and local rules.",
    ],
  },
  {
    id: "liability",
    title: "Limitation of liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, OR GOODWILL, ARISING FROM OR RELATED TO THE SERVICE.",
      "OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF THESE TERMS OR THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS ($100).",
      "Some jurisdictions do not allow certain limitations; in those cases, our liability is limited to the fullest extent permitted by law.",
    ],
  },
  {
    id: "indemnity",
    title: "Indemnification",
    paragraphs: [
      "You will defend, indemnify, and hold harmless Aquatics Empowered and its affiliates, officers, and employees from claims, damages, and expenses (including reasonable attorneys' fees) arising from your use of the Service, your content, or your violation of these Terms, except to the extent caused by our gross negligence or willful misconduct.",
    ],
  },
  {
    id: "termination",
    title: "Suspension and termination",
    paragraphs: [
      "You may stop using the Service at any time. You may cancel paid subscriptions through the billing tools we provide.",
      "We may suspend or terminate access if you violate these Terms, fail to pay fees, or if continued provision poses legal or security risk. We will provide notice where reasonable unless immediate action is required.",
      "Upon termination, your right to use the Service ends. Provisions that by nature should survive (including payment obligations, disclaimers, limitations of liability, and indemnity) will survive.",
    ],
  },
  {
    id: "changes",
    title: "Changes to these Terms",
    paragraphs: [
      "We may update these Terms from time to time. We will post the updated version on this page and update the effective date. Material changes may be communicated through the Service or by email where appropriate. Continued use after changes become effective constitutes acceptance.",
    ],
  },
  {
    id: "governing-law",
    title: "Governing law and disputes",
    paragraphs: [
      "These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict-of-law rules, except where mandatory consumer protection laws in your jurisdiction apply.",
      "Before filing a claim, you agree to contact us at the email below and attempt to resolve the dispute informally. Any dispute not resolved informally will be brought in the state or federal courts located in Delaware, unless applicable law requires otherwise.",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    paragraphs: ["Questions about these Terms:"],
  },
];
