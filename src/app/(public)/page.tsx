import type { Metadata } from "next";
import { Hero } from "@/features/home/hero";
import { ManufacturingProcess } from "@/features/home/manufacturing-process";
import {
  CertifiedSection,
  HomeAbout,
  HomeFaq,
  HowItWorksRow,
  WhatWeMakeDisciplines,
} from "@/features/home/home-sections";

export const metadata: Metadata = {
  title: { absolute: "Optimed Surgical | Surgical Instruments Manufacturer, Sialkot" },
  description:
    "Optimed Surgical manufactures surgical, dental and medical instruments in Sialkot, Pakistan, since 2010. Bulk orders, private label and custom designs for hospitals and distributors worldwide.",
  alternates: { canonical: "/" },
};

// Homepage built to the approved final design.
export default function HomePage() {
  return (
    <>
      <Hero />
      <HomeAbout />
      <WhatWeMakeDisciplines />
      <ManufacturingProcess />
      <HowItWorksRow />
      <CertifiedSection />
      <HomeFaq />
    </>
  );
}
