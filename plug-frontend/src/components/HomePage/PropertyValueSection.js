import React, { useState } from "react";
import { Send, Upload } from "lucide-react";

import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const PropertyValueSection = ({ setSearchMode, searchMode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [image, setImage] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        delayChildren: 0.3,
        duration: 0.8,
      },
    },
  };

  const searchBarVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15, delay: 0.8 },
    },
  };

  const handleSearch = () => {
    if (!user) {
      toast.error("Please login to use");
      return;
    }
    if (searchQuery?.trim()?.length === 0 && !image) {
      toast.error("Please enter a search query or upload an image.");
      return;
    }
    navigate("/aiResult", { state: { prompt: searchQuery, image } });
  };

  const onImageChange = (event) => {
    setImage(event.target.files[0]);
  };

  return (
    <>
      <motion.div
        className="relative flex flex-col items-center justify-center py-3 px-4 sm:px-6 md:px-8 lg:px-12  text-white min-h-[60vh] md:min-h-[40vh] overflow-hidden bg-gradient-to-b"
        style={{
          backgroundImage: "linear-gradient(to bottom, #000000, #00180A)",
        }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto text-center z-10">
          {/* Decorative stars */}
          <div className="absolute top-16 left-8 md:top-24 md:left-16 lg:left-32 xl:left-48 opacity-70">
            <StarAnimation />
          </div>

          {/* Description text */}
          <motion.div
            className="mb-4 mt-6 md:mt-10 lg:mt-12 relative w-full px-4 md:px-8 lg:px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-2xl lg:text-3xl font-bold text-white bg-clip-text text-transparent">
              Tell Zara What You Are Selling
            </h2>
            <p className="text-sm md:text-lg text-[#c83bb5e1] font-bold leading-relaxed max-w-3xl mx-auto">
              She Will Find the Value of Your Products
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            className="w-full max-w-sm z-[22] sm:max-w-lg md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-5xl relative mb-6 md:mb-8 bg-[#2A2A2A] hover:bg-[#333333] transition-colors duration-300 rounded-2xl p-3 md:p-4 flex items-center justify-between gap-2 mx-auto shadow-lg shadow-black/20 border border-gray-800"
            variants={searchBarVariants}
          >
            <motion.label
              htmlFor="imageUpload"
              className="cursor-pointer flex items-center gap-2 p-2 rounded-lg hover:bg-[#3A3A3A] transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="w-4 h-4 md:w-5 md:h-5 text-gray-700" />
              {image && (
                <img
                  src={URL.createObjectURL(image)}
                  alt="Property Value"
                  className="w-10 h-10 rounded-md"
                />
              )}
            </motion.label>

            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="hidden"
            />

            <motion.input
              type="text"
              placeholder="Boeing 737-800"
              className="w-full bg-transparent border-none outline-none text-white text-sm md:text-base placeholder-gray-500 text-left px-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
              whileFocus={{
                scale: 1.01,
                transition: { type: "spring", stiffness: 300, damping: 15 },
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />

            <motion.button
              className="p-2 bg-gray-700 hover:bg-gray-950 rounded-lg transition-colors"
              onClick={handleSearch}
              whileHover={{
                scale: 1.1,
                transition: { type: "spring", stiffness: 400, damping: 10 },
              }}
              whileTap={{ scale: 0.9 }}
              aria-label="Search"
            >
              <Send className="text-white w-4 h-4 md:w-5 md:h-5" />
            </motion.button>
          </motion.div>

          {/* Mode toggle */}
          <motion.div
            className="flex justify-center mb-8 md:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="flex items-center bg-[#2A2A2A] rounded-full p-1 shadow-md">
              <button
                className={`px-4 md:px-6 py-2 rounded-full transition-all duration-300 text-xs md:text-sm font-medium ${
                  searchMode === "geoSearch"
                    ? "bg-[#190033] text-white shadow-inner"
                    : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setSearchMode("geoSearch")}
              >
                Geo Search
              </button>
              <button
                className={`px-4 md:px-6 py-2 rounded-full transition-all duration-300 text-xs md:text-sm font-medium ${
                  searchMode === "propertyValue"
                    ? "bg-[#190033] text-white shadow-inner"
                    : "text-gray-300 hover:text-white"
                }`}
                onClick={() => setSearchMode("propertyValue")}
              >
                Property Value
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

// Star animation component
const StarAnimation = () => {
  return (
    <div className="relative w-24 h-24">
      <motion.div
        className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full"
        animate={{
          scale: [1, 2, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-6 left-8 w-3 h-3 bg-white rounded-full"
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute top-12 left-4 w-2 h-2 bg-white rounded-full"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />
    </div>
  );
};

export default PropertyValueSection;
