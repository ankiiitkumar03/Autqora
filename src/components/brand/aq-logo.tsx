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
          <linearGradient id={`${gradientId}-left`} x1="32" y1="101" x2="55" y2="14" gradientUnits="userSpaceOnUse">
            {tone === "light" ? (
              <>
                <stop offset="0" stopColor="#0B0B0F" />
                <stop offset="0.7" stopColor="#15121F" />
                <stop offset="1" stopColor="#7C3AED" />
              </>
            ) : (
              <>
                <stop offset="0" stopColor="#F8F7FC" />
                <stop offset="0.7" stopColor="#F0EBFF" />
                <stop offset="1" stopColor="#C4B5FD" />
              </>
            )}
          </linearGradient>
          <linearGradient id={`${gradientId}-right`} x1="66" y1="15" x2="99" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={tone === "light" ? "#6D28D9" : "#C4B5FD"} />
            <stop offset="0.58" stopColor="#7C3AED" />
            <stop offset="1" stopColor={tone === "light" ? "#4C1D95" : "#6D28D9"} />
          </linearGradient>
          <linearGradient id={`${gradientId}-fold`} x1="27" y1="76" x2="94" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#7C3AED" />
            <stop offset="0.55" stopColor={tone === "light" ? "#6D28D9" : "#A78BFA"} />
            <stop offset="1" stopColor="#4C1D95" />
          </linearGradient>
        </defs>
      )}

      <path
        d="M18 100 L49 29 C53 19 59 13 66 14"
        stroke={mono ? "currentColor" : `url(#${gradientId}-left)`}
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M65 14 C72 15 76 21 81 31 L103 87 C108 99 103 106 96 106 C91 106 88 102 85 96 L63 49"
        stroke={mono ? "currentColor" : `url(#${gradientId}-right)`}
        strokeWidth="20"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 101 C31 96 37 84 43 77 C50 69 59 69 67 77 C76 87 81 100 95 101 C88 110 78 110 69 104 C61 98 57 87 51 87 C45 87 40 100 30 105 C26 107 22 105 20 101 Z"
        fill={mono ? "currentColor" : `url(#${gradientId}-fold)`}
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
        <span className="font-display text-[1.02rem] font-semibold leading-none tracking-[0.14em]">
          AUTQORA
        </span>
        {tagline && (
          <span
            className={cn(
              "mt-1.5 font-sans text-[0.4rem] font-medium leading-none tracking-[0.2em]",
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
