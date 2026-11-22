import { SiteNav } from "@/components/site/nav";
import { Hero } from "@/components/site/hero";
import { Problem } from "@/components/site/problem";
import { HowItWorks } from "@/components/site/how-it-works";
import { Capabilities } from "@/components/site/capabilities";
import { ExampleProject } from "@/components/site/example-project";
import { Debugging } from "@/components/site/debugging";
import { Platforms } from "@/components/site/platforms";
import { Pricing } from "@/components/site/pricing";
import { Faq } from "@/components/site/faq";
import { FinalCta } from "@/components/site/final-cta";
import { SiteFooter } from "@/components/site/footer";

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AUTQORA",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Create and save automation project briefs, track their status, and troubleshoot common workflow errors.",
};

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main">
        <Hero />
        <Problem />
        <HowItWorks />
        <Capabilities />
        <ExampleProject />
        <Debugging />
        <Platforms />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
