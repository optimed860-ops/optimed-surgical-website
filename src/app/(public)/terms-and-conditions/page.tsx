import type { Metadata } from "next";
import { LegalPage } from "@/components/shared/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms for using the Optimed website and submitting quotation requests.",
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      crumb="Terms & Conditions"
      intro="The terms that apply when you use this website and send us a quotation request."
      sections={[
        {
          heading: "About this website",
          body: [
            "This website is a business-to-business product catalogue operated by Optimed. It is intended for companies and professional buyers such as distributors, healthcare organisations and wholesalers.",
          ],
        },
        {
          heading: "Quotation requests are not orders",
          body: [
            "Submitting a quotation request does not create a purchase, an order or any obligation for either party. No payment is taken on this website. Prices, availability, delivery terms and other conditions are confirmed only in a quotation issued by Optimed.",
          ],
        },
        {
          heading: "Product information",
          body: [
            "We aim to keep product information accurate, but descriptions, images and specifications are provided for general guidance and may change. Please confirm any specification that matters to your purchase in your quotation request.",
          ],
        },
        {
          heading: "Acceptable use",
          body: [
            "You agree not to misuse the website, including by submitting false information, sending automated or bulk requests, or attempting to access areas or data that are not intended for you.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            "The website content, including text, design and the Optimed name and logo, belongs to Optimed or its licensors and may not be reused without permission.",
          ],
        },
        {
          heading: "Liability",
          body: [
            "The website is provided “as is”. To the extent permitted by law, Optimed is not liable for losses arising from the use of, or inability to use, this website. Nothing in these terms limits liability that cannot be limited by law.",
          ],
        },
        {
          heading: "Changes and contact",
          body: [
            "We may update these terms from time to time. Questions about them can be sent through the details on our Contact page.",
          ],
        },
      ]}
    />
  );
}
