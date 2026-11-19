"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { mapCategory } from "@/lib/api-mappers";
import { mediaUrl } from "@/utils/mediaUrl";
import { useGetCategoriesQuery, useGetSiteSettingsQuery } from "@/services/client/catalog-api";

function SocialIcon({ label }: { label: string }) {
  if (label === "Facebook") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.361H7.332v3.209h2.753v8.196h3.312z" />
      </svg>
    );
  }
  if (label === "Instagram") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M6.94 5a2 2 0 1 1-4-.002 2 2 0 0 1 4 .002zM7 8.48H3V21h4V8.48zm6.32 0H9.34V21h3.94v-6.57c0-3.66 4.77-4 4.77 0V21H22v-7.93c0-6.17-7.06-5.94-8.72-2.91l.04-1.68z" />
    </svg>
  );
}

export function Footer() {
  const { data } = useGetSiteSettingsQuery();
  const { data: categoryResponse } = useGetCategoriesQuery();
  const settings = data?.data;
  const brand = settings?.platformBrandName || "Local Fix";
  const footerLogo = mediaUrl(settings?.footerLogo);
  const socials = [
    { href: settings?.facebookUrl || "https://www.facebook.com/localfix", label: "Facebook" },
    { href: settings?.instagramUrl || "https://www.instagram.com/localfix", label: "Instagram" },
    { href: settings?.linkedinUrl || "https://www.linkedin.com/company/localfix", label: "LinkedIn" },
  ].filter((item) => Boolean(item.href));

  const popularServiceLinks = useMemo(() => {
    const categories = (categoryResponse?.data || []).map(mapCategory);
    return categories.slice(0, 5).map((category) => ({
      href: `/browse-pros?category=${encodeURIComponent(category.slug)}`,
      label: category.name,
    }));
  }, [categoryResponse]);

  const groups = [
    {
      title: "Popular Services",
      links:
        popularServiceLinks.length > 0
          ? popularServiceLinks
          : [{ href: "/services", label: "All Services" }],
    },
    {
      title: "For Homeowners",
      links: [
        { href: "/browse-pros", label: "Find a Pro" },
        { href: "/services", label: "All Services" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/faq", label: "FAQ" },
      ],
    },
    {
      title: "For Contractors",
      links: [
        { href: "/pro-register", label: "Join Pro Network" },
        { href: "/pro/jobs", label: "Available Jobs Board" },
        { href: "/pro/pricing", label: "Pro Membership" },
        { href: "/pro", label: "Contractor Portal" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
        { href: "/terms", label: "Terms & Conditions" },
        { href: "/privacy", label: "Privacy Policy" },
      ],
    },
  ];

  return (
    <footer className="bg-title text-white">
      <div className="container-site grid gap-10 border-b border-white/10 py-16 md:grid-cols-2 lg:grid-cols-[1.2fr_repeat(4,0.7fr)]">
        <div>
          {footerLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={footerLogo} alt={brand} className="h-10 w-auto object-contain" />
          ) : (
            <Logo variant="dark" size="lg" />
          )}
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
            Your trusted local home repair network. Compare itemized quotes from background-checked local specialists, message privately, and pay directly upon job completion.
          </p>
          {(settings?.supportEmail || settings?.supportPhone || settings?.address) && (
            <div className="mt-4 space-y-1 text-sm text-white/70">
              {settings.supportEmail ? (
                <p>
                  <a href={`mailto:${settings.supportEmail}`} className="hover:text-white">
                    {settings.supportEmail}
                  </a>
                </p>
              ) : null}
              {settings.supportPhone ? <p>{settings.supportPhone}</p> : null}
              {settings.address ? <p>{settings.address}</p> : null}
            </div>
          )}
          <div className="mt-6 flex gap-2">
            {socials.map((item) => (
              <a
                key={item.label}
                href={item.href}
                aria-label={item.label}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:border-primary hover:bg-primary"
              >
                <SocialIcon label={item.label} />
              </a>
            ))}
          </div>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <p className="font-display text-base font-semibold tracking-tight text-white">{group.title}</p>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {group.links.map((link) => (
                <li key={`${group.title}-${link.href}-${link.label}`}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-site py-5 text-center text-xs text-white/50">
        <p>
          © {new Date().getFullYear()} {brand}
          {brand.toLowerCase().includes("inc") ? "" : " Inc."}
        </p>
      </div>
    </footer>
  );
}
