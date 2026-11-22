import Image from "next/image";
import { cn } from "@/lib/utils";
import fdaLogo from "../../../public/certs/fda.png";

/**
 * Certification marks for the trust bar, drawn as SVG so they stay sharp.
 * pendingClientReview: show only marks the company genuinely holds. The FDA
 * and ISO organisations restrict use of their logos; the client has asked for
 * them and accepts responsibility for confirming permission.
 */

const NAVY = "#03286a";

export function FdaMark({ className }: { className?: string }) {
  // Logo file supplied by the client: public/certs/fda.png (round mark).
  return <Image src={fdaLogo} alt="FDA" className={cn("h-14 w-auto", className)} sizes="72px" />;
}

export function IsoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 64" className={cn("h-12 w-auto", className)} role="img" aria-label="ISO certified">
      {/* Globe arc */}
      <g fill="none" stroke={NAVY} strokeWidth="2.4" strokeLinecap="round">
        <path d="M22 30 A26 22 0 0 1 74 30" />
        <path d="M48 8 V30" />
        <path d="M48 8 C38 14 36 22 36 30" />
        <path d="M48 8 C58 14 60 22 60 30" />
        <path d="M26 21 H70" />
      </g>
      <text x="48" y="61" textAnchor="middle" fontFamily="Rockwell, 'Roboto Slab', Georgia, serif" fontWeight={900} fontSize="36" fill={NAVY}>
        ISO
      </text>
    </svg>
  );
}

export function CeMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 230 110" className={cn("h-11 w-auto", className)} role="img" aria-label="CE marking">
      <g fill="none" stroke={NAVY} strokeWidth="16">
        <path d="M100 13 A47 47 0 1 0 100 97" />
        <path d="M215 13 A47 47 0 1 0 215 97" />
        <path d="M147 55 H200" />
      </g>
    </svg>
  );
}

export function EuFlag({ className }: { className?: string }) {
  const stars = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * Math.PI) / 6;
    return { x: 45 + 20 * Math.sin(angle), y: 30 - 20 * Math.cos(angle) };
  });
  return (
    <svg viewBox="0 0 90 60" className={cn("h-10 w-auto rounded-[2px]", className)} aria-hidden>
      <rect width="90" height="60" fill="#003399" />
      {stars.map((s, i) => (
        <polygon
          key={i}
          fill="#FFCC00"
          transform={`translate(${s.x} ${s.y}) scale(3.3)`}
          points="0,-1 0.2245,-0.309 0.951,-0.309 0.363,0.118 0.588,0.809 0,0.382 -0.588,0.809 -0.363,0.118 -0.951,-0.309 -0.2245,-0.309"
        />
      ))}
    </svg>
  );
}

export function TrustMarks({ className }: { className?: string }) {
  const items = [
    <FdaMark key="fda" />,
    <IsoMark key="iso" />,
    <CeMark key="ce" />,
    <span key="eu" className="flex items-center gap-2 sm:gap-3 [&>svg]:h-8 sm:[&>svg]:h-auto [&>svg]:w-auto" role="img" aria-label="EU MDR">
      <EuFlag />
      <span aria-hidden className="text-lg font-bold tracking-tight whitespace-nowrap text-navy-800 sm:text-[1.5rem]">
        EU MDR
      </span>
    </span>,
  ];
  return (
    <ul
      className={cn("grid grid-cols-2 items-center justify-items-center gap-x-4 gap-y-7 sm:flex sm:justify-center", className)}
      aria-label="Certifications"
    >
      {items.map((item, index) => (
        <li key={index} className="flex h-14 items-center justify-center sm:contents">
          {index > 0 ? <span aria-hidden className="mx-6 hidden h-12 w-px bg-line sm:block xl:mx-10" /> : null}
          <span className="flex items-center">{item}</span>
        </li>
      ))}
    </ul>
  );
}
