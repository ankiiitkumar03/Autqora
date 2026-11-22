import { cn } from "@/lib/utils";

type MarkTone = "violet" | "light" | "mono";

type AqMarkProps = {
  className?: string;
  tone?: MarkTone;
  gradientId?: string;
  title?: string;
};

export function AqMark({
  className,
  tone = "violet",
  gradientId = "aq-mark-gradient",
  title,
}: AqMarkProps) {
  const mono = tone === "mono";
  const fill = mono ? "currentColor" : `url(#${gradientId})`;

  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("block", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {!mono && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="18"
            y1="10"
            x2="102"
            y2="112"
            gradientUnits="userSpaceOnUse"
          >
            {tone === "light" ? (
              <>
                <stop offset="0" stopColor="#8A6BFF" />
                <stop offset="0.5" stopColor="#6C46F5" />
                <stop offset="1" stopColor="#3E1FB8" />
              </>
            ) : (
              <>
                <stop offset="0" stopColor="#E7E0FF" />
                <stop offset="0.42" stopColor="#A48CFF" />
                <stop offset="1" stopColor="#5B32EE" />
              </>
            )}
          </linearGradient>
        </defs>
      )}

      <path
        d="M60 12 L106 108 L88 108 L60 54 L32 108 L14 108 Z"
        fill={fill}
      />
      <path d="M34 72 L84 72 L82 84 L31 84 Z" fill={fill} />
      <path
        d="M82 78 C92 82 100 93 104 107"
        stroke={fill}
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  );
}

type AqLogoProps = {
  className?: string;
  markClassName?: string;
  tagline?: boolean;
  theme?: "dark" | "light";
  tone?: MarkTone;
  gradientId?: string;
};

export function AqLogo({
  className,
  markClassName,
  tagline = false,
  theme = "dark",
  tone,
  gradientId,
}: AqLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 leading-none",
        theme === "light" ? "text-[#0b0812]" : "text-mist",
        className
      )}
    >
      <AqMark
        className={cn("h-8 w-8 shrink-0", markClassName)}
        tone={tone ?? (theme === "light" ? "light" : "violet")}
        gradientId={gradientId}
      />
      <span className="flex flex-col">
        <span className="font-display text-[1.02rem] font-semibold leading-none tracking-[0.2em]">
          AUTQORA
        </span>
        {tagline && (
          <span
            className={cn(
              "mt-1.5 font-mono-brand text-[0.4rem] leading-none tracking-[0.28em]",
              theme === "light" ? "text-[#6b6478]" : "text-dim"
            )}
          >
            AUTOMATION. ORCHESTRATED.
          </span>
        )}
      </span>
    </span>
  );
}
