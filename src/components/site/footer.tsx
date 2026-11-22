import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AqLogo } from "@/components/brand/aq-logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Automation Architect", href: "/#product" },
      { label: "Workflow Generator", href: "/#product" },
      { label: "Debugging helper", href: "/debug" },
      { label: "My projects", href: "/projects" },
      { label: "Verification Engine", href: "/#product" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "The strategy memo", href: "/strategy" },
      { label: "Brand system", href: "/brand" },
      { label: "Manifesto", href: "/#problem" },
      { label: "Contact", href: "mailto:hello@autqora.com" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Supported platforms", href: "/#platforms" },
      { label: "Example project", href: "/#example" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#060509]">
      <div className="pointer-events-none absolute -left-40 top-0 h-80 w-80 rounded-full bg-violet/10 blur-[120px]" />
      <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-9 sm:gap-12 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link href="/" aria-label="AUTQORA home" className="inline-flex">
              <AqLogo tagline markClassName="h-9 w-9" />
            </Link>
            <p className="mt-6 max-w-xs text-[13.5px] leading-relaxed text-white/45">
              The implementation layer for automation. Start with a clear brief
              and build toward a working system.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
              <span className="font-mono-brand text-[9px] uppercase tracking-[0.18em] text-white/45">
                Private beta · 2026
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-8">
            {columns.map((column) => (
              <div key={column.title}>
                <p className="font-mono-brand text-[9px] uppercase tracking-[0.22em] text-white/35">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[13.5px] text-white/55 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-white/[0.07] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11.5px] text-white/30">
            © 2026 AUTQORA. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-white/30">
            <span className="font-mono-brand tracking-[0.16em]">
              AUTOMATION. ORCHESTRATED.
            </span>
            <Link href="/brand" className="inline-flex items-center gap-1 hover:text-white/70">
              Brand v1.0 <ArrowUpRight className="h-3 w-3" />
            </Link>
            <Link href="/strategy" className="inline-flex items-center gap-1 hover:text-white/70">
              Strategy memo <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
