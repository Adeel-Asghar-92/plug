import { AlertTriangle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const categoryColors = {
  Yachts: "#00B7FF",
  Cars: "#FF9500",
  "Real Estate": "#00FF99",
  Jets: "#FFD700",
  Watches: "#8A2BE2",
  "All Categories": "#FF6B6B",
  default: "#FF6B6B",
};

function GeoSearchResults({
  searchedCategory,
  searchData,
  isGeneratingData,
  handleMarkerClick,
  selectedListItem,
  error,
}) {
  const categoryName = searchedCategory?.value || "luxury items";
  const categoryColor =
    categoryColors[searchedCategory?.value] || categoryColors.default;

  const loadingMessages = [
    "Google",
    "Bing",
    "Yahoo",
    "DuckDuckGo",
    "Yandex",
    "Baidu",
  ]
    .map(
      (engine) =>
        `Scanning ${categoryName} mentions at your location on ${engine}`
    )
    .concat([
      "Searching for mentions near your location online",
      "Checking for references in your area on the web",
      "Exploring related posts around your location digitally",
      "Looking up mentions in your vicinity online",
      "Browsing for citations near your area on the internet",
      "Investigating references at your location on a search engine",
      "Scouting for mentions in your region online",
      "Seeking related content near your location on the web",
      "Scanning for mentions in your area via a search platform",
      "Searching for references close to your location online",
      "Checking online for mentions in your vicinity",
      "Exploring related mentions near your area on a search site",
      "Looking for citations at your location on the internet",
      "Browsing mentions in your region via a search tool",
      "Investigating references near your location online",
      "Scouting related posts in your area on the web",
      "Seeking mentions at your location through a search engine",
      "Scanning for citations in your vicinity online",
      "Checking for references around your location on a search platform",
      "Exploring mentions in your area via an online search tool",
    ]);

  if (isGeneratingData) {
    return (
      <div className="w-full bg-[#1E1E1E] rounded-lg p-4 overflow-y-auto text-center py-8">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#00FF99]" />
        <AnimatePresence mode="wait">
          {loadingMessages.map((msg, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: index * 2 }}
              className="mt-2 text-gray-400"
            >
              {msg}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`w-full bg-[#1E1E1E] rounded-lg p-4 overflow-y-auto max-h-[800px]`}
      >
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-1/3 bg-[#1E1E1E] rounded-lg p-4 overflow-y-auto max-h-[100vh]">
      {searchData.length > 0 ? (
        searchData.map((circle) => {
          const isSelected = selectedListItem === circle.id;
          return (
            <div
              key={circle.id}
              className={`mb-4 p-3 rounded-lg cursor-pointer ${
                isSelected
                  ? "bg-[#333333] border border-[#00FF99]"
                  : "hover:bg-[#2A2A2A]"
              }`}
              onClick={() => handleMarkerClick(circle)}
            >
              <div className="flex items-center mb-1">
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: categoryColor }}
                />
                <h3 className="text-md font-bold text-white truncate">
                  {circle.keyword}
                </h3>
              </div>
              <p className="text-sm text-gray-400 truncate mb-1">
                {circle.area}
              </p>
              <div className="text-xs text-gray-300 space-y-1">
                <p>Mentioned in {circle.searches} searches</p>
                <p>
                  {new Date().toLocaleDateString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs bg-[#333333] px-2 py-1 rounded-full truncate">
                  {circle.zipcode}
                </span>
                {circle.subcategory && (
                  <span className="text-xs bg-[#333333] px-2 py-1 rounded-full truncate">
                    {circle.subcategory}
                  </span>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-gray-400 py-8">
          Click Search to view analytics
        </div>
      )}
    </div>
  );
}

export default GeoSearchResults;
