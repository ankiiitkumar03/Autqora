import { SectionHeading } from "@/components/site/section-heading";

const platforms = [
  ["n8n", "Runtime"],
  ["Make", "Runtime"],
  ["Zapier", "Runtime"],
  ["OpenAI", "Models"],
  ["Claude", "Models"],
  ["Python", "Custom code"],
  ["REST APIs", "Integration"],
  ["Webhooks", "Events"],
  ["Postgres", "Data"],
  ["Airtable", "Data"],
  ["Notion", "Knowledge"],
  ["Slack", "Comms"],
  ["HubSpot", "CRM"],
  ["Sheets", "Data"],
  ["Stripe", "Payments"],
];

export function Platforms() {
  return (
    <section
      id="platforms"
      className="relative border-t border-white/[0.06] py-24 sm:py-32"
    >
      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading
              index="06"
              eyebrow="Supported platforms"
              title={
                <>
                  Fits the stack
                  <br />
                  you already have.
                </>
              }
              description="AUTQORA doesn’t replace your tools. It makes them work together — and keeps the implementation portable."
            />

            <div className="reveal mt-8 rounded-xl border border-white/[0.07] bg-white/[0.018] p-4">
              <p className="font-mono-brand text-[7.5px] uppercase tracking-[0.16em] text-white/25">
                Missing an integration?
              </p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/42">
                The Architect can still design a custom API path, generate the
                request layer and verify it against a sandbox.
              </p>
            </div>
          </div>

          <div className="reveal grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] sm:grid-cols-3">
            {platforms.map(([name, category]) => (
              <div
                key={name}
                className="group relative flex min-h-[88px] flex-col justify-between bg-[#09070e] p-4 transition-colors hover:bg-[#0d0a14]"
              >
                <span className="font-display text-[13px] font-medium tracking-tight text-white/65 transition-colors group-hover:text-white/95">
                  {name}
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono-brand text-[7px] uppercase tracking-[0.14em] text-white/22">
                    {category}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/10 transition-colors group-hover:bg-violet-soft" />
                </div>
              </div>
            ))}
            <div className="flex min-h-[88px] flex-col justify-between bg-[#09070e] p-4">
              <span className="font-display text-[13px] font-medium tracking-tight text-violet-soft/70">
                + Custom
              </span>
              <span className="font-mono-brand text-[7px] uppercase tracking-[0.14em] text-violet-soft/35">
                API / SDK / CLI
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
