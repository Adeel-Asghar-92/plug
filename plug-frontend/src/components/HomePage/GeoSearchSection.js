import React, { useEffect, useState } from "react";

import { Send } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const GeoSearchSection = ({ setSearchMode, searchMode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState({
    label: "All Categories",
    value: "All Categories",
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

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
        setSelectedCategory({
          label: "All Categories",
          value: "All Categories",
        });
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
        setSelectedCategory({
          label: "All Categories",
          value: "All Categories",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = () => {
    if (!user) {
      toast.error("Please login to use");
      return;
    }

    if (!searchQuery.trim() && !city) {
      toast.error("Please enter a query and city.");
      return;
    }

    navigate("/geoSearch", {
      state: {
        prompt: searchQuery,
        city,
        category: selectedCategory.value,
      },
    });
  };

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center py-12 px-6 text-white min-h-[60vh] bg-gradient-to-b"
      style={{
        backgroundImage: "linear-gradient(to bottom, #000000, #00180A)",
      }}
      initial="hidden"
      animate="visible"
      variants={{
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
      }}
    >
      <div className="text-center mb-8 z-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Tell Zara What You Are Selling
        </h2>
        <p className="text-md md:text-lg text-[#c83bb5e1] font-semibold">
          She Will Locate Who is Browsing to Buy
        </p>
      </div>

      <motion.div
        className="w-full z-20 max-w-4xl bg-[#2A2A2A] rounded-2xl p-1 md:p-1 shadow-lg border border-gray-800"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.8 }}
      >
        <div className="flex flex-col gap-1 md:flex-row md:items-stretch">
          {/* Category Dropdown */}
          <select
            className="md:w-[100px] w-full p-3 py-6 rounded-lg text-black text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={selectedCategory.value}
            onChange={(e) => {
              setSelectedCategory({
                label: e.target.value,
                value: e.target.value,
              });
            }}
          >
            <option value="All Categories">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>

          {/* City Input */}
          <input
            type="text"
            placeholder="Enter City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="md:w-[140px] w-full p-3 py-6 rounded-lg  text-black text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />

          {/* Search Query + Button */}
          <div className="w-full grow flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter products to find where buyers search online"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-grow p-3 py-6 rounded-lg  text-black text-sm border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <motion.button
              onClick={handleSearch}
              className="p-3 bg-purple-700 hover:bg-purple-900 rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="text-white w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Toggle Buttons */}
      <motion.div
        className="flex justify-center mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <div className="flex items-center bg-[#2A2A2A] rounded-full p-1 shadow-md">
          <button
            className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              searchMode === "geoSearch"
                ? "bg-purple-800 text-white shadow-inner"
                : "text-gray-300 hover:text-white"
            }`}
            onClick={() => setSearchMode("geoSearch")}
          >
            Geo Search
          </button>
          <button
            className={`px-4 md:px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              searchMode === "propertyValue"
                ? "bg-purple-800 text-white shadow-inner"
                : "text-gray-300 hover:text-white"
            }`}
            onClick={() => setSearchMode("propertyValue")}
          >
            Property Value
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GeoSearchSection;
