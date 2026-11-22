import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Contrast,
  Download,
  Grid3x3,
  RotateCw,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import { AqLogo, AqMark } from "@/components/brand/aq-logo";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";

export const metadata: Metadata = {
  title: "Brand System",
  description:
    "The AUTQORA identity system: the Folded A mark, logo suite, color, typography, usage rules and applications.",
};

const palette = [
  {
    name: "Void",
    hex: "#07060A",
    rgb: "7 6 10",
    role: "Primary canvas",
    className: "bg-[#07060A] text-white",
    muted: "text-white/40",
  },
  {
    name: "Carbon",
    hex: "#0E0B15",
    rgb: "14 11 21",
    role: "Surfaces & panels",
    className: "bg-[#0E0B15] text-white",
    muted: "text-white/40",
  },
  {
    name: "Graphite",
    hex: "#171320",
    rgb: "23 19 32",
    role: "Raised surfaces",
    className: "bg-[#171320] text-white",
    muted: "text-white/40",
  },
  {
    name: "Mist",
    hex: "#F4F1FB",
    rgb: "244 241 251",
    role: "Primary text",
    className: "bg-[#F4F1FB] text-[#0B0812]",
    muted: "text-[#0B0812]/50",
  },
  {
    name: "Violet",
    hex: "#7C5CFF",
    rgb: "124 92 255",
    role: "Brand signal",
    className: "bg-[#7C5CFF] text-white",
    muted: "text-white/60",
  },
  {
    name: "Violet Soft",
    hex: "#A48CFF",
    rgb: "164 140 255",
    role: "Interactive & accent",
    className: "bg-[#A48CFF] text-[#120a2e]",
    muted: "text-[#120a2e]/55",
  },
  {
    name: "Lavender",
    hex: "#CBBDFF",
    rgb: "203 189 255",
    role: "Highlights & data",
    className: "bg-[#CBBDFF] text-[#1a1035]",
    muted: "text-[#1a1035]/55",
  },
  {
    name: "Deep Violet",
    hex: "#4A2BD9",
    rgb: "74 43 217",
    role: "Gradient depth",
    className: "bg-[#4A2BD9] text-white",
    muted: "text-white/55",
  },
  {
    name: "Signal",
    hex: "#3DDC97",
    rgb: "61 220 151",
    role: "Verified only",
    className: "bg-[#3DDC97] text-[#052e1e]",
    muted: "text-[#052e1e]/55",
  },
  {
    name: "Amber",
    hex: "#F5B759",
    rgb: "245 183 89",
    role: "User confirmation",
    className: "bg-[#F5B759] text-[#2b1c05]",
    muted: "text-[#2b1c05]/55",
  },
  {
    name: "Error",
    hex: "#F0567A",
    rgb: "240 86 122",
    role: "Failures",
    className: "bg-[#F0567A] text-white",
    muted: "text-white/60",
  },
  {
    name: "Hairline",
    hex: "#FFFFFF · 8%",
    rgb: "255 255 255 / 8%",
    role: "Borders & dividers",
    className: "bg-[#FFFFFF14] text-white",
    muted: "text-white/45",
  },
];

const typeScale = [
  ["Display XL", "Sora 500", "84 / 88", "−5.5%", "Launch headlines"],
  ["Display L", "Sora 500", "64 / 66", "−5%", "Section heroes"],
  ["Heading 2", "Sora 500", "44 / 46", "−4.5%", "Section titles"],
  ["Heading 3", "Sora 500", "24 / 28", "−3%", "Card titles"],
  ["Body", "Inter 400", "16 / 26", "0", "Long-form copy"],
  ["Body S", "Inter 400", "13 / 21", "0", "Product UI"],
  ["Label", "JetBrains Mono 500", "10 / 10", "+24%", "Eyebrows & meta"],
  ["Code", "JetBrains Mono 400", "12 / 20", "0", "Artifacts & logs"],
];

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="font-mono-brand text-[9px] uppercase tracking-[0.22em] text-violet-soft/70">
        {children}
      </span>
      <span className="h-px flex-1 bg-white/[0.07]" />
    </div>
  );
}

export default function BrandPage() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <section className="relative overflow-hidden border-b border-white/[0.06] pb-16 pt-32 sm:pb-20 sm:pt-40">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
            <div className="absolute left-1/2 top-[-10rem] h-96 w-[40rem] -translate-x-1/2 rounded-full bg-violet/15 blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono-brand text-[9px] uppercase tracking-[0.22em] text-white/30">
              <span className="text-violet-soft/80">Brand system</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>Version 1.0</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>November 2026</span>
            </div>

            <div className="mt-8 grid items-end gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <h1 className="font-display text-[clamp(2.8rem,9vw,5.4rem)] font-medium leading-[0.94] tracking-[-0.055em] text-mist sm:text-[clamp(3.8rem,7vw,5.4rem)]">
                  The
                  <br />
                  <span className="text-gradient">Folded A.</span>
                </h1>
                <p className="mt-7 max-w-lg text-[14px] leading-relaxed text-white/45">
                  One continuous ribbon that resolves into an A for automation
                  and a Q for orchestration. Geometric, quiet and built to survive
                  the next decade of the category.
                </p>
              </div>

              <div className="flex justify-start lg:justify-end">
                <div className="relative flex aspect-square w-56 items-center justify-center rounded-3xl border border-white/[0.09] bg-[radial-gradient(circle_at_30%_15%,#1a1230,#09070e_70%)] sm:w-64">
                  <div className="absolute inset-4 rounded-2xl border border-white/[0.05]" />
                  <AqMark
                    className="h-32 w-32 animate-float sm:h-36 sm:w-36"
                    gradientId="brand-hero-mark"
                    title="AUTQORA mark"
                  />
                  <span className="absolute bottom-4 left-5 font-mono-brand text-[8px] uppercase tracking-[0.18em] text-white/25">
                    Primary mark
                  </span>
                  <span className="absolute right-5 top-4 font-mono-brand text-[8px] uppercase tracking-[0.18em] text-violet-soft/50">
                    A + Q
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-mono-brand text-[10px] tracking-[0.2em] text-violet-soft">
                    01
                  </span>
                  <span className="h-px w-6 bg-white/20" />
                  <span className="font-mono-brand text-[10px] uppercase tracking-[0.24em] text-white/40">
                    The idea
                  </span>
                </div>
                <h2 className="mt-5 font-display text-[2rem] leading-[1.05] tracking-[-0.045em] text-mist sm:text-[2.5rem]">
                  A ribbon under tension.
                </h2>
                <p className="mt-5 text-[13px] leading-relaxed text-white/42">
                  The mark is drawn as a single folded band. The outer edges form
                  the A; the crossbar extends into a Q tail. Nothing is added for
                  decoration — every gesture carries meaning.
                </p>

                <div className="mt-8 space-y-4">
                  {[
                    ["A — Automation", "A tapered chevron, weighted at the base."],
                    ["Q — Orchestration", "The crossbar resolves into a loop and tail."],
                    ["Negative space", "The counter stays open. The system stays readable."],
                  ].map(([title, copy]) => (
                    <div key={title} className="flex gap-3 border-t border-white/[0.07] pt-3">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-soft" />
                      <div>
                        <p className="text-[12px] font-medium text-white/70">{title}</p>
                        <p className="mt-1 text-[12px] leading-relaxed text-white/32">
                          {copy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0810]">
                <div className="absolute inset-0 bg-grid-fine opacity-60" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(124,92,255,0.14),transparent_60%)]" />
                <div className="relative flex min-h-[380px] items-center justify-center p-10 sm:min-h-[440px]">
                  <div className="absolute left-6 top-6 font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/22">
                    Construction · 120 × 120 grid
                  </div>
                  <div className="absolute right-6 top-6 font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-violet-soft/40">
                    v1.0
                  </div>

                  <div className="absolute inset-12 rounded-full border border-dashed border-white/[0.06]" />
                  <div className="absolute left-1/2 top-12 h-[calc(100%-6rem)] w-px bg-white/[0.05]" />
                  <div className="absolute left-12 top-1/2 h-px w-[calc(100%-6rem)] bg-white/[0.05]" />

                  <AqMark
                    className="relative h-52 w-52 sm:h-64 sm:w-64"
                    gradientId="brand-construction-mark"
                  />

                  <div className="absolute bottom-7 left-7 rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/35">
                    A / 45° fold
                  </div>
                  <div className="absolute bottom-7 right-7 rounded-md border border-violet/20 bg-violet/[0.08] px-2 py-1 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-violet-soft/70">
                    Q / tail
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <GroupLabel>02 / Logo suite</GroupLabel>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex min-h-[210px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6 md:col-span-2">
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                  Primary lockup · dark
                </span>
                <AqLogo
                  tagline
                  markClassName="h-14 w-14"
                  className="gap-5 [&_span]:text-[1.7rem] [&_span_span:last-child]:text-[0.55rem]"
                />
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.14em] text-white/20">
                  Use on Void, Carbon and photography with scrim
                </span>
              </div>

              <div className="flex min-h-[210px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#F4F1FB] p-6">
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-[#0B0812]/35">
                  Primary lockup · light
                </span>
                <AqLogo
                  theme="light"
                  markClassName="h-11 w-11"
                  className="gap-3.5 [&_span]:text-[1.2rem]"
                />
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.14em] text-[#0B0812]/30">
                  Use on Mist and paper stocks
                </span>
              </div>

              <div className="flex min-h-[190px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                  Icon · gradient
                </span>
                <AqMark className="h-20 w-20" gradientId="brand-suite-icon" />
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.14em] text-white/20">
                  Favicon, app, social avatar
                </span>
              </div>

              <div className="flex min-h-[190px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-white p-6">
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-[#0B0812]/35">
                  Icon · one colour
                </span>
                <AqMark tone="mono" className="h-20 w-20 text-[#0B0812]" />
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.14em] text-[#0B0812]/30">
                  Print, engraving, single-ink
                </span>
              </div>

              <div className="flex min-h-[190px] flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                  Icon · reverse
                </span>
                <AqMark tone="mono" className="h-20 w-20 text-white" />
                <span className="font-mono-brand text-[8.5px] uppercase tracking-[0.14em] text-white/20">
                  Dark UI, merchandise
                </span>
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0a0810] p-5">
                <div>
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                    App icon
                  </p>
                  <p className="mt-1.5 text-[11px] text-white/40">
                    512 × 512 · radius 112
                  </p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/autqora-app-icon.svg"
                  alt="AUTQORA app icon"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-[14px]"
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0a0810] p-5">
                <div>
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                    Social avatar
                  </p>
                  <p className="mt-1.5 text-[11px] text-white/40">
                    Circular crop safe zone
                  </p>
                </div>
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.1] bg-[radial-gradient(circle_at_30%_20%,#1a1230,#09070e)]">
                  <AqMark className="h-9 w-9" gradientId="brand-avatar-mark" />
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0a0810] p-5">
                <div>
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                    Favicon sizes
                  </p>
                  <p className="mt-1.5 text-[11px] text-white/40">
                    16 · 24 · 32 · 48
                  </p>
                </div>
                <div className="flex items-end gap-2.5">
                  <AqMark className="h-4 w-4" gradientId="brand-fav-1" />
                  <AqMark className="h-6 w-6" gradientId="brand-fav-2" />
                  <AqMark className="h-8 w-8" gradientId="brand-fav-3" />
                  <AqMark className="h-10 w-10" gradientId="brand-fav-4" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <GroupLabel>03 / Clear space & scale</GroupLabel>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                  Clear space
                </p>
                <div className="mt-6 flex items-center justify-center rounded-xl border border-dashed border-white/10 p-8 sm:p-12">
                  <div className="relative border border-dashed border-violet/25 p-8 sm:p-10">
                    <AqMark className="h-28 w-28" gradientId="brand-clear-mark" />
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#0a0810] px-2 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-violet-soft/60">
                      0.5×
                    </span>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0a0810] px-2 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-violet-soft/60">
                      0.5×
                    </span>
                  </div>
                </div>
                <p className="mt-5 text-[12.5px] leading-relaxed text-white/38">
                  Keep a minimum clear space of half the mark height on all sides.
                  No text, rules or other marks may enter this zone.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                  Minimum size
                </p>
                <div className="mt-6 space-y-4">
                  {[
                    ["Digital mark", "24 px", "Below this, use the app icon"],
                    ["Print mark", "8 mm", "Below this, use the icon only"],
                    ["Lockup", "120 px wide", "Below this, switch to the mark"],
                  ].map(([label, size, note]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] px-4 py-3"
                    >
                      <div>
                        <p className="text-[12px] text-white/60">{label}</p>
                        <p className="mt-0.5 text-[10.5px] text-white/28">{note}</p>
                      </div>
                      <span className="font-mono-brand text-[12px] text-violet-soft/80">
                        {size}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-[12.5px] leading-relaxed text-white/38">
                  The icon is optimised for small sizes: the crossbar and Q tail
                  stay legible at 16 px.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <GroupLabel>04 / Colour</GroupLabel>
                <h2 className="max-w-lg font-display text-[2rem] leading-[1.05] tracking-[-0.045em] text-mist sm:text-[2.5rem]">
                  Black canvas. Violet signal.
                </h2>
              </div>
              <p className="max-w-sm text-[12.5px] leading-relaxed text-white/38">
                Violet is reserved for progress, intelligence and interaction. It
                is never used for body copy or large flat backgrounds.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-4">
              {palette.map((color) => (
                <div
                  key={color.name}
                  className={`flex min-h-[158px] flex-col justify-between p-4 ${color.className}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-display text-[13px] font-medium tracking-tight">
                      {color.name}
                    </span>
                    <span className="font-mono-brand text-[8px] uppercase tracking-[0.12em] opacity-50">
                      {color.role}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono-brand text-[11px]">{color.hex}</p>
                    <p className={`mt-1 font-mono-brand text-[8.5px] ${color.muted}`}>
                      RGB {color.rgb}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                  Contrast rule
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-white/38">
                  Body copy sits at 60–80% Mist on Void for WCAG AA. Never set
                  violet text below 14 px.
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                  Status semantics
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-white/38">
                  Signal green means technically verified — never “success” in
                  general. Amber means a human confirmation is pending.
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-4">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                  Gradient
                </p>
                <p className="mt-2 text-[11.5px] leading-relaxed text-white/38">
                  #E7E0FF → #A48CFF → #5B32EE at 104°. Use on the mark and one
                  focal word per screen — not both at once.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <GroupLabel>05 / Typography</GroupLabel>
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6 lg:col-span-2">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                  Display · Sora
                </p>
                <p className="mt-8 font-display text-[2.5rem] leading-[0.98] tracking-[-0.05em] text-mist sm:text-[3.2rem]">
                  Built to
                  <br />
                  execute.
                </p>
                <div className="mt-8 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-white/[0.06] pt-5">
                  <span className="text-[11px] text-white/30">ABCDEFGHIJKLM</span>
                  <span className="text-[11px] text-white/30">abcdefghijklm</span>
                  <span className="text-[11px] text-white/30">0123456789</span>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex-1 rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                    Text · Inter
                  </p>
                  <p className="mt-5 text-[19px] leading-snug tracking-[-0.02em] text-white/70">
                    From idea to execution.
                  </p>
                  <p className="mt-3 text-[11px] leading-relaxed text-white/30">
                    Inter carries every product surface, paragraph and table. Use
                    400 for reading, 500 for emphasis.
                  </p>
                </div>
                <div className="flex-1 rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                    Mono · JetBrains Mono
                  </p>
                  <p className="mt-5 font-mono-brand text-[11px] uppercase tracking-[0.2em] text-violet-soft/70">
                    AUTOMATION. ORCHESTRATED.
                  </p>
                  <p className="mt-2 font-mono-brand text-[10px] text-white/30">
                    node 04 · 401 invalid_grant
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0810]">
              <div className="grid grid-cols-5 gap-4 border-b border-white/[0.07] px-4 py-2.5 font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/25 sm:px-6">
                <span>Role</span>
                <span>Face</span>
                <span>Size / line</span>
                <span>Tracking</span>
                <span className="hidden sm:block">Use</span>
              </div>
              {typeScale.map(([role, face, size, tracking, use]) => (
                <div
                  key={role}
                  className="grid grid-cols-5 items-center gap-4 border-b border-white/[0.05] px-4 py-3 last:border-b-0 sm:px-6"
                >
                  <span className="text-[11px] text-white/55">{role}</span>
                  <span className="text-[10px] text-white/35">{face}</span>
                  <span className="font-mono-brand text-[10px] text-white/42">{size}</span>
                  <span className="font-mono-brand text-[10px] text-white/42">{tracking}</span>
                  <span className="hidden text-[10px] text-white/28 sm:block">{use}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <GroupLabel>06 / Usage</GroupLabel>
            <div className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-signal/60">
                  Always
                </p>
                <div className="mt-5 space-y-3">
                  {[
                    "Use the supplied mark and lockup files.",
                    "Keep the 0.5× clear space on every side.",
                    "Use the light variant on light surfaces.",
                    "Keep the wordmark tracking at 0.2 em.",
                    "Use the icon alone below 120 px lockup width.",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-signal/70" strokeWidth={2.5} />
                      <span className="text-[12px] leading-relaxed text-white/45">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  {
                    label: "Don’t stretch",
                    inner: (
                      <AqMark className="h-16 w-16 scale-x-[1.55]" gradientId="bad-1" />
                    ),
                    icon: Grid3x3,
                  },
                  {
                    label: "Don’t rotate",
                    inner: (
                      <AqMark className="h-16 w-16 rotate-[18deg]" gradientId="bad-2" />
                    ),
                    icon: RotateCw,
                  },
                  {
                    label: "Don’t recolour",
                    inner: <AqMark tone="mono" className="h-16 w-16 text-[#F0567A]" />,
                    icon: Contrast,
                  },
                  {
                    label: "Don’t distort",
                    inner: <AqMark className="h-16 w-16 -skew-x-12" gradientId="bad-3" />,
                    icon: Type,
                  },
                  {
                    label: "Don’t crowd",
                    inner: (
                      <div className="flex -space-x-5">
                        <AqMark className="h-14 w-14" gradientId="bad-4" />
                        <AqMark className="h-14 w-14" gradientId="bad-5" />
                        <AqMark className="h-14 w-14" gradientId="bad-6" />
                      </div>
                    ),
                    icon: X,
                  },
                  {
                    label: "Don’t add effects",
                    inner: (
                      <AqMark
                        className="h-16 w-16 drop-shadow-[0_0_18px_rgba(124,92,255,0.95)]"
                        gradientId="bad-7"
                      />
                    ),
                    icon: Sparkles,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex min-h-[150px] flex-col justify-between rounded-2xl border border-[#f0567a]/12 bg-[#f0567a]/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono-brand text-[8px] uppercase tracking-[0.12em] text-[#f0567a]/50">
                          {item.label}
                        </span>
                        <Icon className="h-3 w-3 text-[#f0567a]/30" />
                      </div>
                      <div className="flex items-center justify-center py-2">{item.inner}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <GroupLabel>07 / Voice</GroupLabel>
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <h2 className="font-display text-[2rem] leading-[1.05] tracking-[-0.045em] text-mist sm:text-[2.5rem]">
                  Calm authority.
                  <br />
                  <span className="text-white/35">No magic tricks.</span>
                </h2>
                <div className="mt-7 space-y-4">
                  {[
                    ["Clear over clever", "Say what the product does, then prove it."],
                    ["Specific over impressive", "Use real nodes, real errors and real limits."],
                    ["Practical over magical", "Respect the work. Never promise effortless."],
                  ].map(([title, copy]) => (
                    <div key={title} className="border-t border-white/[0.07] pt-3">
                      <p className="text-[12.5px] font-medium text-white/70">{title}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-white/32">{copy}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.015] p-5">
                  <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.16em] text-white/25">
                    Messaging hierarchy
                  </p>
                  <div className="mt-4 space-y-3">
                    {[
                      ["Promise", "From automation ideas to working execution."],
                      ["Tagline", "AUTOMATION. ORCHESTRATED."],
                      ["Positioning", "Don’t just plan automation. Make it work."],
                      ["Hero", "Turn automation ideas into working systems."],
                    ].map(([label, value]) => (
                      <div key={label} className="grid grid-cols-[80px_1fr] gap-3">
                        <span className="font-mono-brand text-[8px] uppercase tracking-[0.12em] text-white/22">
                          {label}
                        </span>
                        <span className="text-[12px] leading-relaxed text-white/50">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-signal/12 bg-signal/[0.02] p-4">
                    <p className="font-mono-brand text-[8px] uppercase tracking-[0.14em] text-signal/60">
                      Use
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                      working system · implementation · verified · deploy ·
                      root cause · artifact
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#f0567a]/12 bg-[#f0567a]/[0.02] p-4">
                    <p className="font-mono-brand text-[8px] uppercase tracking-[0.14em] text-[#f0567a]/60">
                      Avoid
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                      magic · revolutionary · 10× · effortless · fully autonomous ·
                      set and forget
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/[0.06] py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <GroupLabel>08 / Applications</GroupLabel>
            <div className="grid gap-3 lg:grid-cols-3">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                  Product icon
                </p>
                <div className="mt-6 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/autqora-app-icon.svg"
                    alt="AUTQORA application icon"
                    width={128}
                    height={128}
                    className="h-32 w-32 rounded-[28px] shadow-[0_24px_50px_-20px_rgba(94,58,255,0.6)]"
                  />
                </div>
                <p className="mt-6 text-[11.5px] leading-relaxed text-white/32">
                  Use the supplied icon on macOS, iOS and Android. Do not rebuild
                  the container radius.
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                  Browser tab
                </p>
                <div className="mt-6 overflow-hidden rounded-t-xl border border-white/[0.08] bg-[#15121c]">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
                      <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
                    </div>
                    <div className="ml-2 flex min-w-0 flex-1 items-center gap-2 rounded-t-md border border-b-0 border-white/[0.06] bg-[#0a0810] px-2 py-1.5">
                      <AqMark className="h-3 w-3" gradientId="brand-tab-mark" />
                      <span className="truncate text-[8.5px] text-white/45">
                        AUTQORA — Turn automation ideas into working systems
                      </span>
                    </div>
                  </div>
                  <div className="flex h-28 items-center justify-center bg-[#08060d]">
                    <AqLogo markClassName="h-5 w-5" className="gap-2 [&_span]:text-[0.7rem]" />
                  </div>
                </div>
                <p className="mt-5 text-[11.5px] leading-relaxed text-white/32">
                  The favicon keeps the gradient at 32 px and switches to the
                  mono mark when the platform strips colour.
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0810] p-6">
                <p className="font-mono-brand text-[8.5px] uppercase tracking-[0.18em] text-white/25">
                  Social profile
                </p>
                <div className="mt-6 rounded-xl border border-white/[0.07] bg-[#08060d] p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.1] bg-[radial-gradient(circle_at_30%_20%,#1a1230,#09070e)]">
                      <AqMark className="h-6 w-6" gradientId="brand-social-mark" />
                    </span>
                    <div>
                      <p className="font-display text-[12px] font-medium tracking-[0.1em] text-white/85">
                        AUTQORA
                      </p>
                      <p className="font-mono-brand text-[8px] uppercase tracking-[0.14em] text-white/25">
                        @autqora
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] leading-relaxed text-white/38">
                    Automation. Orchestrated. Plan, build, debug and deploy
                    working automation systems.
                  </p>
                  <div className="mt-3 flex items-center gap-3 border-t border-white/[0.06] pt-3 font-mono-brand text-[8px] text-white/22">
                    <span>From idea</span>
                    <span className="h-px w-3 bg-violet/40" />
                    <span>To execution</span>
                  </div>
                </div>
                <p className="mt-5 text-[11.5px] leading-relaxed text-white/32">
                  Keep the mark centred inside the circular crop. Never place the
                  wordmark inside the avatar.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="grid gap-10 rounded-2xl border border-white/[0.08] bg-white/[0.015] p-6 sm:p-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <GroupLabel>09 / Assets</GroupLabel>
                <h2 className="font-display text-[2rem] leading-[1.05] tracking-[-0.045em] text-mist sm:text-[2.4rem]">
                  Download the system.
                </h2>
                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-white/38">
                  Source SVGs for the mark, mono mark, lockup and app icon. For
                  co-branding, press or partner use, contact{" "}
                  <a
                    href="mailto:brand@autqora.com"
                    className="text-violet-soft/80 hover:text-violet-soft"
                  >
                    brand@autqora.com
                  </a>
                  .
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    ["Mark", "/brand/autqora-mark.svg"],
                    ["Mono mark", "/brand/autqora-mark-mono.svg"],
                    ["Lockup", "/brand/autqora-lockup.svg"],
                    ["App icon", "/brand/autqora-app-icon.svg"],
                  ].map(([label, href]) => (
                    <a
                      key={label}
                      href={href}
                      download
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] px-3.5 py-2 text-[11.5px] text-white/55 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                    >
                      <Download className="h-3 w-3" />
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-white/[0.07] bg-[#F4F1FB]">
                  <AqLogo theme="light" markClassName="h-7 w-7" className="gap-2.5 [&_span]:text-[0.8rem]" />
                </div>
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-white/[0.07] bg-[#07060A]">
                  <AqLogo markClassName="h-7 w-7" className="gap-2.5 [&_span]:text-[0.8rem]" />
                </div>
                <div className="col-span-2 flex aspect-[8/3] items-center justify-center rounded-xl border border-white/[0.07] bg-[radial-gradient(circle_at_20%_10%,#1a1230,#09070e_65%)]">
                  <AqLogo tagline markClassName="h-10 w-10" className="gap-4 [&_span]:text-[1.2rem] [&_span_span:last-child]:text-[0.45rem]" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p className="font-mono-brand text-[9px] uppercase tracking-[0.16em] text-white/22">
                Brand system v1.0 · AUTQORA
              </p>
              <Link
                href="/strategy"
                className="inline-flex items-center gap-1.5 text-[12px] text-white/40 transition-colors hover:text-white"
              >
                Read the positioning & screening memo
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
