import { PageBanner } from "@/components/layout/page-banner";
import { FaqSection } from "@/components/web-pages/faq-section";
import { photos } from "@/lib/media";

export default function FaqPage() {
  return (
    <>
      <PageBanner
        eyebrow="Help & FAQ"
        title="Frequently Asked Questions"
        description="Find clear answers about booking, quoting, direct payments, and contractor verification."
        image={photos.banners.how}
      />
      <FaqSection
        eyebrow="Help Center"
        title="Everything you need to know"
        description="Clear, transparent answers about posting repairs, comparing contractor quotes, direct payments, and quality guarantees."
        className="bg-white"
        showViewAll={false}
      />
    </>
  );
}
