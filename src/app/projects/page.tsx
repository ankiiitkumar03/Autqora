import type { Metadata } from "next";
import { ArrowLeft, FolderKanban } from "lucide-react";
import Link from "next/link";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { ProjectsWorkspace } from "@/components/site/projects-workspace";

export const metadata: Metadata = {
  title: "My Automation Projects",
  description: "Create and keep track of your AUTQORA automation project briefs.",
};

export default function ProjectsPage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="min-h-screen pt-28 sm:pt-36">
        <section className="relative overflow-hidden pb-12 sm:pb-16">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_65%_65%_at_50%_0%,black,transparent)]" />
            <div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-violet/[0.12] blur-[120px]" />
          </div>
          <div className="relative mx-auto max-w-[1120px] px-5 sm:px-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[11px] text-white/40 transition-colors hover:text-white/75">
              <ArrowLeft className="h-3 w-3" /> Back to AUTQORA
            </Link>
            <div className="mt-7 flex items-center gap-2 font-mono-brand text-[9px] uppercase tracking-[0.2em] text-violet-soft/70">
              <FolderKanban className="h-3 w-3" />
              Project workspace
            </div>
            <h1 className="mt-5 max-w-3xl text-balance font-display text-[clamp(2.25rem,8vw,4rem)] leading-[0.98] tracking-[-0.055em] text-mist sm:text-[clamp(3rem,6vw,4rem)]">
              Keep your automation work in one place.
            </h1>
            <p className="mt-5 max-w-2xl text-[14px] leading-relaxed text-white/65 sm:text-[15px]">
              Keep each automation&apos;s requirements, implementation plan, workflow versions, setup progress, verification and debugging history together.
            </p>
            <p className="mt-4 max-w-2xl text-[12px] leading-relaxed text-white/50">
              Projects are stored on this AUTQORA server. Create an account to link this browser&apos;s workspace and sign in from another browser connected to the same server. There is no cloud sync.
            </p>
          </div>
        </section>
        <ProjectsWorkspace />
      </main>
      <SiteFooter />
    </>
  );
}
