import { describe, expect, it } from "vitest";
import { Bone, Brain, Ear, Expand, HeartPulse, Scissors, Smile, Venus } from "lucide-react";
import { iconFor } from "@/components/shared/category-icon";

describe("iconFor", () => {
  it.each([
    [["general-surgery", "Mayo Dissecting Scissors"], Scissors],
    [["cardiovascular-surgery", "DeBakey Atraumatic Forceps"], HeartPulse],
    [["ent-surgery", "Hartmann Ear Forceps"], Ear],
    [["neurosurgery", "Kerrison Rongeur"], Brain],
    [["gynaecology", "Sims Vaginal Speculum"], Venus],
    [["orthopaedic-surgery", "Liston Bone Cutting Forceps"], Bone],
    [["dental-surgery", "Coupland Dental Elevator"], Smile],
    [["retractors", "Langenbeck Retractor"], Expand],
  ])("%j", (hints, expected) => {
    expect(iconFor(...hints)).toBe(expected);
  });

  it("does not treat words containing 'ent' as ENT", () => {
    expect(iconFor("general-surgery", "Surgical instruments set")).toBe(Scissors);
  });
});
