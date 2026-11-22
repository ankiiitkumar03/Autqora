import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "reveal",
        align === "center" && "mx-auto max-w-2xl text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          align === "center" && "justify-center"
        )}
      >
        <span className="font-mono-brand text-[10px] tracking-[0.2em] text-violet-soft">
          {index}
        </span>
        <span className="h-px w-6 bg-white/20" />
        <span className="font-mono-brand text-[10px] uppercase tracking-[0.24em] text-white/45">
          {eyebrow}
        </span>
      </div>
      <h2 className="mt-6 max-w-3xl font-display text-[clamp(1.9rem,6.4vw,3.15rem)] leading-[1.06] tracking-[-0.045em] text-mist sm:text-[clamp(2.3rem,4.5vw,3.15rem)]">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "mt-5 max-w-xl text-[15px] leading-relaxed text-white/50",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
