import { createElement } from "react";
import {
  Activity,
  BedDouble,
  Bone,
  Boxes,
  Brain,
  Ear,
  Expand,
  Eye,
  HeartPulse,
  Microscope,
  Scissors,
  ShieldPlus,
  Smile,
  Stethoscope,
  Syringe,
  Venus,
  type LucideIcon,
} from "lucide-react";

// Most specific first: discipline words win over the generic "surgery".
const RULES: [RegExp, LucideIcon][] = [
  [/cardio|vascular|heart/, HeartPulse],
  [/\bent\b|\bear\b|nasal|nose|throat|laryng/, Ear],
  [/neuro|brain|spinal|kerrison/, Brain],
  [/gyn|uter|vagin|obstet/, Venus],
  [/ophthal|eye/, Eye],
  [/ortho|bone/, Bone],
  [/dental|dent|tooth|extraction|elevator/, Smile],
  [/retract/, Expand],
  [/infusion|syringe|inject|dispos|cannula|lipo/, Syringe],
  [/hospital|ward|bed|furniture/, BedDouble],
  [/protect|ppe|glove|mask|gown/, ShieldPlus],
  [/monitor|ecg|vital/, Activity],
  [/lab|diagnos|microscop/, Microscope],
  [/surg|instrument|scissor|forcep|clamp|scalpel|needle/, Scissors],
  [/clinic|exam|general/, Stethoscope],
];

/** Picks a line icon from category/product words, so items without photos still read clearly. */
export function iconFor(...hints: (string | null | undefined)[]): LucideIcon {
  const text = hints.filter(Boolean).join(" ").toLowerCase();
  return RULES.find(([pattern]) => pattern.test(text))?.[1] ?? Boxes;
}

/** Renders the icon chosen by iconFor(). */
export function CategoryIcon({
  hints,
  ...props
}: { hints: (string | null | undefined)[] } & React.ComponentProps<LucideIcon>) {
  return createElement(iconFor(...hints), props);
}
