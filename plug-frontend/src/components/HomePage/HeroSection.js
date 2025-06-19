import { AnimatePresence, motion, useAnimation } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

import { ChevronDown } from "lucide-react";
import GeoSearchSection from "./GeoSearchSection";
import { Link } from "react-router-dom";
import PropertyValueSection from "./PropertyValueSection";
import axios from "axios";
import bg from "../../assets/img/back.png";

const HeroSection = ({ searchMode, setSearchMode, minusToken }) => {
  const sliderRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const controls = useAnimation();
  const [isVisible, setIsVisible] = useState(false);
  const [showMobileCategoryMenu, setShowMobileCategoryMenu] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/products-count`,
          {
            withCredentials: true,
          }
        );
        if (response.data && response.data.products) {
          const categoryCountMap = response.data.products.reduce(
            (acc, product) => {
              const categoryName = product.category || "Uncategorized";
              acc[categoryName] = (acc[categoryName] || 0) + 1;
              return acc;
            },
            {}
          );
          setCategoryCounts(categoryCountMap);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/admin/categories`,
          {
            params: { email: process.env.REACT_APP_ADMIN_EMAIL },
          }
        );
        const updatedCategories = [...response.data.categories];
        setCategories(updatedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        const fallbackCategories = [
          { _id: "0", name: "All Categories", subcategories: [] },
          {
            _id: "1",
            name: "Cars",
            subcategories: [
              { _id: "1-1", name: "Luxury" },
              { _id: "1-2", name: "Sports" },
            ],
          },
          {
            _id: "2",
            name: "Yachts",
            subcategories: [
              { _id: "2-1", name: "Motor" },
              { _id: "2-2", name: "Sail" },
            ],
          },
          {
            _id: "3",
            name: "Real Estate",
            subcategories: [
              { _id: "3-1", name: "Residential" },
              { _id: "3-2", name: "Commercial" },
            ],
          },
        ];
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setIsVisible(true);
    controls.start("visible");
  }, [controls]);

  return (
    <div className="relative bg-[#1A1A1A] text-white w-full">
      {/* Background animated elements */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.05 }}
        transition={{ delay: 2, duration: 2 }}
      >
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
            }}
            animate={{
              y: [0, Math.random() * -100 - 50],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
          />
        ))}
      </motion.div>
      <>
        <img
          src={bg}
          alt="bg"
          className="absolute top-0 right-0 hidden md:block w-auto h-full object-cover z-10"
        />
        {searchMode === "geoSearch" ? (
          <GeoSearchSection
            minusToken={minusToken}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
          />
        ) : (
          <PropertyValueSection
            searchMode={searchMode}
            setSearchMode={setSearchMode}
          />
        )}
      </>

      {/* Responsive Category List - Mobile Dropdown */}
      <div className="lg:hidden w-full mb-6 sm:mb-8 px-2 sm:px-4 md:px-6">
        <button
          className="w-full flex justify-between items-center bg-[#2A2A2A] text-[#CCCCCC] px-2 sm:px-4 py-1.5 sm:py-2 rounded-full"
          onClick={() => setShowMobileCategoryMenu(!showMobileCategoryMenu)}
        >
          <span className="text-xs sm:text-sm md:text-base">Categories</span>
          <ChevronDown
            className={`transition-transform ${
              showMobileCategoryMenu ? "rotate-180" : ""
            } w-4 h-4 sm:w-5 sm:h-5`}
          />
        </button>
        <AnimatePresence>
          {showMobileCategoryMenu && (
            <motion.div
              className="mt-1 sm:mt-2 bg-[#2A2A2A] rounded-lg shadow-lg"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {categories.map((category) => (
                <Link
                  key={category._id}
                  to={`/category?name=${encodeURIComponent(category.name)}`}
                  className="block px-2 sm:px-4 py-1.5 sm:py-2 text-[#CCCCCC] hover:bg-[#3A3A3A] hover:text-gray-300 text-xs sm:text-sm"
                  onClick={() => setShowMobileCategoryMenu(false)}
                >
                  <div className="flex justify-between items-center">
                    <span>{category.name}</span>
                    <span className="text-[10px] sm:text-xs text-gray-400">
                      {categoryCounts[category.name]?.toLocaleString() || "0"}
                    </span>
                  </div>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="hidden xl:block absolute left-[10px] top-[10%] transform -translate-y-1/2 z-20 w-[70px]"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <div className="flex flex-col space-y-2">
          {categories.map((category) => (
            <div key={category.id}>
              <Link
                to={`/category?name=${encodeURIComponent(category.name)}`}
                className="flex items-center justify-center border border-white bg-transparent text-white hover:bg-gray-700 font-medium px-3 py-1 rounded-full shadow-lg transition-all duration-200 w-[90px]"
              >
                <div className="flex flex-col items-start">
                  <span className="text-[10px]">{category.name}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
