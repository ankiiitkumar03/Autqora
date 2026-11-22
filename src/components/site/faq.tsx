import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/site/section-heading";

const faqs = [
  {
    question: "Can I use AUTQORA today?",
    answer:
      "Yes. You can create a local account, change its password, save project requirements and plans, export supported n8n workflows, track setup, review local checks, and report manual test results. Accounts are stored on this AUTQORA server; there is no email recovery, cloud sync, live workflow execution, or connected provider account yet.",
  },
  {
    question: "Is AUTQORA another no-code builder?",
    answer:
      "The planned product is an implementation layer above the tools you already use. It is intended to help plan systems, generate artifacts, debug and verify workflows across automation platforms and custom code.",
  },
  {
    question: "Do I need to know how to code?",
    answer:
      "The product is being designed for both technical and non-technical users, with plain-language guidance and inspectable artifacts. Those capabilities are not available on this site yet.",
  },
  {
    question: "Will it work with my existing workflows?",
    answer:
      "The debugging helper accepts pasted error text and suggests checks for common patterns. It does not accept workflow file or screenshot uploads, inspect a workflow, or confirm a fix.",
  },
  {
    question: "How is “verified” different from “done”?",
    answer:
      "The intended design separates technical evidence from outcomes that need human judgement. The verification screens shown here are examples; AUTQORA does not currently run these checks.",
  },
  {
    question: "Does AUTQORA store my credentials?",
    answer:
      "This site does not connect accounts or store credentials. OAuth, secret storage and account revocation are product requirements still to be implemented; do not send secrets through the beta request email.",
  },
  {
    question: "Can agencies use AUTQORA across client accounts?",
    answer:
      "Multi-client workspaces, team seats and branded reports are planned for a future Studio offering. They are not available yet.",
  },
  {
    question: "What if the tool I need is not supported?",
    answer:
      "Custom API, webhook and SDK support is a planned direction. The current site cannot generate request layers or verify sandbox endpoints.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "A free Explorer tier is planned, but access is not open yet. Its project limits and features may change before launch.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative border-t border-white/[0.06] py-24 sm:py-32">
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              index="08"
              eyebrow="FAQ"
              title={
                <>
                  Questions,
                  <br />
                  answered directly.
                </>
              }
              description="If something is still unclear, ask us. We would rather explain the product than oversell it."
            />
            <Link
              href="mailto:hello@autqora.com"
              className="reveal mt-7 inline-flex items-center gap-1.5 text-[12.5px] text-violet-soft/80 transition-colors hover:text-violet-soft"
            >
              hello@autqora.com
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="reveal">
            <Accordion type="single" collapsible className="border-t border-white/[0.08]">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={faq.question}
                  value={`faq-${index}`}
                  className="border-white/[0.08]"
                >
                  <AccordionTrigger className="items-center gap-6 py-5 text-left font-display text-[14px] font-normal tracking-tight text-white/72 hover:no-underline hover:text-white [&[data-state=open]]:text-white">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pr-10">
                    <p className="max-w-2xl text-[12.5px] leading-relaxed text-white/38">
                      {faq.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
