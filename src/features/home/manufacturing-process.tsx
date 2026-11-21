import { ArrowRight } from "lucide-react";
import {
  mdiAnvil,
  mdiCircularSaw,
  mdiClipboardCheckOutline,
  mdiCog,
  mdiFireCircle,
  mdiHammerWrench,
  mdiLaserPointer,
  mdiPackageVariantClosedCheck,
  mdiRobotIndustrial,
  mdiShimmer,
  mdiTruckDelivery,
} from "@mdi/js";
import { cn } from "@/lib/utils";
import { getSiteContent } from "@/content/get-content";

/** Industrial pictograms from Material Design Icons (Apache-2.0, pictogrammers.com). */
const ICONS: Record<string, string> = {
  cut: mdiCircularSaw,
  forge: mdiAnvil,
  mill: mdiRobotIndustrial,
  fit: mdiHammerWrench,
  heat: mdiFireCircle,
  polish: mdiShimmer,
  laser: mdiLaserPointer,
  qc: mdiClipboardCheckOutline,
  pack: mdiPackageVariantClosedCheck,
  ship: mdiTruckDelivery,
};

function StepIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="currentColor" d={path} />
    </svg>
  );
}

const PER_ROW = 5;

/** "Our manufacturing process": ten steps in hexagons, two rows of five with arrows. */
export async function ManufacturingProcess({ tone = "white" }: { tone?: "white" | "steel" }) {
  const { manufacturing: MANUFACTURING_PROCESS } = await getSiteContent();
  const { steps } = MANUFACTURING_PROCESS;
  return (
    <section className={cn("py-24 lg:py-32", tone === "steel" ? "bg-steel" : "bg-white")}>
      <div className="container-page">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-[length:clamp(2.25rem,1.6rem+2vw,3.25rem)] leading-[1.08]">{MANUFACTURING_PROCESS.title}</h2>
          <div aria-hidden className="mt-6 flex justify-center gap-2">
            <span className="h-1 w-14 rounded-full bg-navy-800" />
            <span className="h-1 w-14 rounded-full bg-cyan-500" />
          </div>
          <p className="mx-auto mt-8 max-w-[52rem] text-lg leading-relaxed text-navy-800/85">{MANUFACTURING_PROCESS.intro}</p>
        </div>

        <ol className="mx-auto mt-16 grid max-w-[76rem] grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-0 lg:gap-y-14">
          {steps.map((step, index) => {
            const path = ICONS[step.icon] ?? mdiCog;
            const endOfRow = (index + 1) % PER_ROW === 0;
            return (
              <li key={step.title} className="group relative flex justify-center">
                <Hexagon>
                  <span className="text-xs font-bold text-cyan-700">{String(index + 1).padStart(2, "0")}</span>
                  <StepIcon path={path} className="mt-1 size-[4.5rem] text-navy-800 transition-colors group-hover:text-cyan-700" />
                  <span className="mt-2.5 max-w-[8rem] text-center text-[0.9375rem] leading-tight font-semibold text-navy-800">
                    {step.title}
                  </span>
                </Hexagon>
                {!endOfRow && index < steps.length - 1 ? (
                  <ArrowRight
                    className="absolute top-1/2 -right-3 hidden size-5 -translate-y-1/2 text-navy-800/50 lg:block"
                    aria-hidden
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function Hexagon({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid aspect-[100/112] w-[10rem] place-items-center sm:w-[11.5rem]">
      <svg viewBox="0 0 100 112" className="absolute inset-0 size-full" aria-hidden>
        <polygon
          points="50,3 96,29 96,83 50,109 4,83 4,29"
          className="fill-white stroke-navy-800 transition-[fill,stroke] duration-200 group-hover:fill-cyan-50 group-hover:stroke-cyan-500"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      <div className="relative flex flex-col items-center px-3">{children}</div>
    </div>
  );
}
