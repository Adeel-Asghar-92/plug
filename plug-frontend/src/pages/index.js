import React, { useState } from "react";

import HeroSection from "../components/HomePage/HeroSection";
import Recommendation from "../components/HomePage/Recommendation";

export default function HomePage() {
  const [searchMode, setSearchMode] = useState("geoSearch");

  const [userToken, setUserToken] = useState(0);

  const minusToken = () => {
    if (userToken < 500) return;
    setUserToken(userToken - 500);
  };

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col min-h-screen text-[#CCCCCC] relative bg-[#000000] overflow-x-hidden">
      {/* Hero Section */}
      <HeroSection
        minusToken={minusToken}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
      />


      {/* Recommendation Section */}
      <Recommendation
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
    </div>
  );
}
