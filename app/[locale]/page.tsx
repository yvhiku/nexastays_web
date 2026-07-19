"use client";

import React from "react";
import { NavBar } from "@/components/navbar/NavBar";
import { Footer } from "@/components/footer/Footer";
import { HeroSection } from "./home/sections/hero/Hero";
import { SearchSection } from "./home/sections/search/Search";
import { WhyNexaSection } from "./home/sections/why/WhyNexa";
import { StatsSection } from "./home/sections/stats/Stats";
import { DestinationsSection } from "./home/sections/destinations/Destinations";
import { HowItWorksSection } from "./home/sections/how-it-works/HowItWorks";
import { HostCtaSection } from "./home/sections/host-cta/HostCta";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";

export default function HomePage() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <SearchSection />
        <RecentlyViewedSection />
        <WhyNexaSection />
        <StatsSection />
        <DestinationsSection />
        <HowItWorksSection />
        <HostCtaSection />
      </main>
      <Footer />
    </>
  );
}
