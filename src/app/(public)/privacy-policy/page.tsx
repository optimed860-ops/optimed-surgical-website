import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Optimed handles information submitted through this website.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      crumb="Privacy Policy"
      intro="How we collect, use and protect the information you share with us through this website."
      sections={[
        {
          heading: "Who we are",
          body: [
            "This website is operated by Optimed (“we”, “us”). It presents our product catalogue and lets business customers send quotation requests.",
          ],
        },
        {
          heading: "Information we collect",
          body: [
            "When you submit a quotation request, we collect:",
            [
              "your full name, company name, business email address, phone number and country;",
              "the products and quantities you select, and any message you add;",
              "the date and time of the request.",
            ],
            "To protect the form against abuse, we also store a one-way, keyed hash derived from your IP address for a short period. We do not store your IP address itself.",
          ],
        },
        {
          heading: "How we use your information",
          body: [
            "We use the information only to review your request, contact you about it, prepare a quotation and manage any resulting order. We do not sell your information, and we do not send marketing emails from this website.",
          ],
        },
        {
          heading: "Your quote list and browser storage",
          body: [
            "The products you add to your quote list are kept in your own browser (local storage) so the list survives page reloads. This contains product references and quantities only, never your personal details, and you can clear it by removing the products or clearing your browser data.",
            "We do not use advertising or tracking cookies.",
          ],
        },
        {
          heading: "Where your information is stored",
          body: [
            "Quotation requests are stored in a secured database operated by our hosting and database providers on our behalf. Access is limited to authorised Optimed staff through a protected administration area.",
          ],
        },
        {
          heading: "How long we keep it",
          body: [
            "We keep quotation and order records for as long as needed to respond to your request, fulfil orders and meet our legal and accounting obligations.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Depending on where you are, you may have the right to access, correct or delete your personal information, or to object to its use. To make a request, contact us using the details on our Contact page.",
          ],
        },
        {
          heading: "Changes to this policy",
          body: ["We may update this policy from time to time. The current version is always published on this page."],
        },
      ]}
    />
  );
}
