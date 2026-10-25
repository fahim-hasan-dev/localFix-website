import type { Metadata } from "next";
import Link from "next/link";
import { PageBanner } from "@/components/layout/page-banner";
import { photos } from "@/lib/media";

export const metadata: Metadata = {
  title: "LocalHomeFix Guarantee",
  description:
    "How the LocalHomeFix Guarantee works — workmanship, property protection, and how to file.",
};

const sections = [
  {
    title: "How you are protected",
    body: "Every qualified job booked through LocalHomeFix includes the Guarantee. If completed work does not meet standard trade practice or local code, we arrange corrective repair with another specialist. If a pro causes accidental physical damage to your home during the job, we step in to help make it right. Our team also reviews the quote, messages, and payment record to help both sides reach a fair outcome.",
  },
  {
    title: "How the Guarantee works",
    body: "Book and confirm the job on LocalHomeFix so there is a record. Pay the pro directly and keep the estimate, change orders, and proof of payment. If something is wrong, tell the pro within 14 days and give them a reasonable chance to inspect. If it is still unresolved, file with us within 30 days of the scheduled completion date — photos and receipts help us review quickly.",
  },
  {
    title: "What is covered",
    body: "Defective workmanship that falls short of trade standards or building codes. Direct physical damage to your property caused during the service. Incomplete work where you paid in full and the pro stopped responding. Improper install of parts the pro supplied. Work by a pro you contacted and booked on LocalHomeFix.",
  },
  {
    title: "What is not covered",
    body: "Normal wear, pre-existing issues, or moisture rot. Work done outside the written estimate with no documentation. Indirect costs such as lodging or lost income. Materials you supplied yourself. Jobs arranged off the platform before you found the pro here.",
  },
  {
    title: "Claims and questions",
    body: "Notify the pro within 14 days of completion and file with LocalHomeFix within 30 days. If we approve a claim, we either arrange the repair or send another reviewed pro. Keep your estimate and proof of payment so we can review the job history quickly.",
  },
];

export default function GuaranteePage() {
  return (
    <>
      <PageBanner
        eyebrow="Protection"
        title="LocalHomeFix Guarantee"
        description="If work falls short or something is damaged on a booked job, we help you get it resolved."
        image={photos.banners.legal}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Guarantee" },
        ]}
      />

      <section className="bg-white py-12 md:py-16">
        <div className="container-site">
          <div className="mx-auto max-w-3xl divide-y divide-line/70">
            {sections.map((section, idx) => (
              <article key={section.title} className={idx === 0 ? "pb-10" : "py-10"}>
                <h2 className="font-display text-[20px] font-bold tracking-tight text-title sm:text-[22px]">
                  {idx + 1}. {section.title}
                </h2>
                <p className="mt-3.5 font-sans text-[15.5px] leading-[1.8] text-[#444] sm:text-[16px]">
                  {section.body}
                </p>
              </article>
            ))}

            <p className="pt-8 text-sm text-muted">
              Questions?{" "}
              <Link href="/contact?topic=guarantee" className="font-semibold text-primary hover:underline">
                Contact us
              </Link>
              {" · "}
              <Link href="/browse-pros" className="font-semibold text-primary hover:underline">
                Find a pro
              </Link>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
