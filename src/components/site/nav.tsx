"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AqLogo } from "@/components/brand/aq-logo";
import { cn } from "@/lib/utils";

const links = [
  { label: "My projects", href: "/projects" },
  { label: "Account", href: "/account" },
  { label: "Product", href: "/#product" },
  { label: "Debugging helper", href: "/debug" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "Platforms", href: "/#platforms" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Brand", href: "/brand" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 transition-all duration-300 sm:px-8",
          scrolled &&
            "mt-3 h-14 max-w-[1180px] rounded-full border border-white/[0.08] bg-[#08070c]/80 px-4 backdrop-blur-xl sm:px-5"
        )}
      >
        <Link
          href="/"
          aria-label="AUTQORA home"
          className="group flex items-center"
        >
          <AqLogo
            markClassName="h-7 w-7 transition-transform duration-300 group-hover:rotate-[8deg]"
            className="gap-2.5"
            tagline
          />
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex 2xl:gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-2.5 py-2 text-[12px] text-white/60 transition-colors hover:text-white 2xl:px-3.5 2xl:text-[13px]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 xl:flex 2xl:gap-2">
          <Link
            href="/strategy"
            className="rounded-full px-2.5 py-2 text-[12px] text-white/60 transition-colors hover:text-white 2xl:px-3.5 2xl:text-[13px]"
          >
            Strategy
          </Link>
          <Link
            href="/projects"
            className="group inline-flex h-9 items-center gap-1 rounded-full bg-mist px-3 text-[11px] font-medium text-ink transition-colors hover:bg-white 2xl:gap-1.5 2xl:px-4 2xl:text-[13px]"
          >
            My projects
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 xl:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 top-0 z-40 flex max-h-dvh flex-col overflow-y-auto overscroll-contain bg-[#07060a]/97 px-5 pb-6 pt-24 backdrop-blur-xl sm:px-6 sm:pb-8 xl:hidden">
          <nav className="flex flex-col divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-5 font-display text-2xl tracking-tight text-white/90"
              >
                {link.label}
                <ArrowUpRight className="h-4 w-4 text-white/30" />
              </Link>
            ))}
            <Link
              href="/strategy"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between py-5 font-display text-2xl tracking-tight text-white/90"
            >
              Strategy
              <ArrowUpRight className="h-4 w-4 text-white/30" />
            </Link>
          </nav>
          <Link
            href="/projects"
            onClick={() => setOpen(false)}
            className="mt-auto flex h-12 items-center justify-center gap-2 rounded-full bg-mist text-sm font-medium text-ink"
          >
            My projects
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </header>
  );
}
