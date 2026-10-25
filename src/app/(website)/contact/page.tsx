"use client";

import { useState } from "react";
import {
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextField } from "@/components/ui/field";
import { PageBanner } from "@/components/layout/page-banner";
import { photos } from "@/lib/media";

const socialLinks = [
  {
    href: "https://www.facebook.com/localhomefix",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="h-12 w-12" aria-hidden="true">
        <path
          fill="#1877F2"
          d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.49 0-1.953.93-1.953 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
        />
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/localhomefix",
    label: "Instagram",
    icon: (
      <svg viewBox="0 0 24 24" className="h-12 w-12" aria-hidden="true">
        <defs>
          <radialGradient id="ig-contact" cx="0.3" cy="1.1" r="1.2">
            <stop offset="0" stopColor="#fdf497" />
            <stop offset="0.45" stopColor="#fd5949" />
            <stop offset="0.7" stopColor="#d6249f" />
            <stop offset="1" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect width="24" height="24" rx="6.5" fill="url(#ig-contact)" />
        <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="3.35" fill="none" stroke="#fff" strokeWidth="1.7" />
        <circle cx="16.35" cy="7.7" r="1.05" fill="#fff" />
      </svg>
    ),
  },
  {
    href: "https://www.linkedin.com/company/localhomefix",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" className="h-12 w-12" aria-hidden="true">
        <path
          fill="#0A66C8"
          d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
        />
      </svg>
    ),
  },
  {
    href: "https://x.com/localhomefix",
    label: "X",
    icon: (
      <svg viewBox="0 0 24 24" className="h-12 w-12" aria-hidden="true">
        <path
          fill="#0F1419"
          d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
      </svg>
    ),
  },
];

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }

  return (
    <>
      <PageBanner
        eyebrow="Contact"
        title="Contact Us"
        description="Have questions or need assistance? Reach out to our Austin support team anytime."
        image={photos.banners.contact}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contact Us" },
        ]}
      />

      <section className="bg-surface/50 py-12 md:py-20 border-b border-line/60">
        <div className="container-site grid items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          {/* ========================================================= */}
          {/* LEFT COLUMN: GET IN TOUCH CARD                            */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-[28px] border border-line/80 bg-white p-6 sm:p-8 md:p-9 shadow-xs">
            <div className="space-y-6 sm:space-y-7">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-title tracking-tight">
                  Get in Touch
                </h2>
                <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-muted">
                  Have questions or need help with a request? Reach out to us directly.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href="mailto:admin@localhomefix.com"
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-line/70 bg-white p-4 transition-all duration-200 hover:border-primary/60 hover:shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary border border-blue-100 transition-colors group-hover:bg-primary group-hover:text-white">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Email
                      </h3>
                      <p className="text-sm font-semibold text-title group-hover:text-primary transition-colors">
                        admin@localhomefix.com
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </a>

                <a
                  href="tel:5125550140"
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-line/70 bg-white p-4 transition-all duration-200 hover:border-primary/60 hover:shadow-xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary border border-blue-100 transition-colors group-hover:bg-primary group-hover:text-white">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Phone
                      </h3>
                      <p className="text-sm font-semibold text-title group-hover:text-primary transition-colors">
                        (512) 555-0140
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </a>

                <div className="group flex items-center gap-3.5 rounded-2xl border border-line/70 bg-white p-4 transition-all duration-200 hover:border-primary/60 hover:shadow-xs">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary border border-blue-100 transition-colors group-hover:bg-primary group-hover:text-white">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Service Area
                    </h3>
                    <p className="text-sm font-semibold text-title group-hover:text-primary transition-colors">
                      Austin, TX &amp; surrounding areas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Follow us</p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="transition hover:opacity-80"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: SEND MESSAGE FORM                           */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-[28px] border border-line/80 bg-white p-6 sm:p-8 md:p-9 shadow-xs space-y-6">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-title tracking-tight">
                Send a Message
              </h2>
              <p className="mt-2 text-sm sm:text-[15px] leading-relaxed text-muted">
                Drop us a note below and a representative will reply to your email promptly.
              </p>
            </div>

            {sent ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 sm:p-7 text-center space-y-3">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white shadow-xs">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold text-title">Message Successfully Sent</h3>
                <p className="text-sm text-copy/90 max-w-sm mx-auto leading-relaxed">
                  Thank you for reaching out. We have received your inquiry and will follow up shortly at your provided email.
                </p>
                <div className="pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSent(false)} className="rounded-full text-xs">
                    Send another message
                  </Button>
                </div>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name">
                    <TextField required name="name" placeholder="Luis Ortega" />
                  </Field>
                  <Field label="Email Address">
                    <TextField required name="email" type="email" placeholder="you@example.com" />
                  </Field>
                </div>

                <Field label="Subject">
                  <TextField required name="subject" placeholder="Contractor verification, quote question, etc." />
                </Field>

                <Field label="Your Message">
                  <TextArea required name="message" placeholder="Provide as much detail as possible..." className="min-h-32" />
                </Field>

                <Button type="submit" size="lg" className="w-full justify-center rounded-full shadow-xs">
                  Send Message ↗
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
