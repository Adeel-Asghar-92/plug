import React, { useEffect } from "react";

import FAQ from "../components/Pricing/faq";
import FinalCTA from "../components/Pricing/final-cta";
import Hero from "../components/Pricing/hero";
import PricingTable from "../components/Pricing/pricing-table";
import TokenAddOn from "../components/Pricing/token-add-on";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

function PricingPage() {
  const [searchParams] = useSearchParams();
  const error = searchParams?.get("error");
  useEffect(() => {
    if (error) {
      toast(error, { id: 1 });
    }
  }, [error]);
  return (
    <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <Hero />
      <PricingTable />
      <TokenAddOn />
      <FAQ />
      <FinalCTA />
    </div>
  );
}

export default PricingPage;
