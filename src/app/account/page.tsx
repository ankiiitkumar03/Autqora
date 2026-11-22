import type { Metadata } from "next";
import { SiteNav } from "@/components/site/nav";
import { SiteFooter } from "@/components/site/footer";
import { AccountForm } from "@/components/site/account-form";

export const metadata: Metadata = {
  title: "Account · AUTQORA",
  description: "Sign in to access your AUTQORA automation projects on this server.",
};

export default function AccountPage() {
  return <>
    <SiteNav />
    <main id="main" className="min-h-screen px-5 pb-20 pt-32 sm:px-8 sm:pt-40">
      <div className="mx-auto max-w-xl">
        <p className="font-mono-brand text-[10px] uppercase tracking-[0.2em] text-violet-soft">Your workspace</p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-mist">Sign in to AUTQORA</h1>
        <p className="mt-3 mb-8 text-sm leading-relaxed text-white/60">Create an account to connect your local browser workspace and access its projects from another browser on the same AUTQORA server.</p>
        <AccountForm />
      </div>
    </main>
    <SiteFooter />
  </>;
}
