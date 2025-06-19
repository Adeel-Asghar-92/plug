import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Country } from "country-state-city";
import GeoSearchMap from "../components/GeoSearch/GeoSearchMap";
import GeoSearchResults from "../components/GeoSearch/GeoSeachResults";
import Select from "react-select";
import { Send } from "lucide-react";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

// Styles for the dropdown
const customStyles = {
  control: (styles) => ({
    ...styles,
    backgroundColor: "#2A2A2A",
    borderColor: "#00FF99",
    color: "white",
  }),
  singleValue: (styles) => ({
    ...styles,
    color: "white",
  }),
  menu: (styles) => ({
    ...styles,
    backgroundColor: "#2A2A2A",
  }),
  option: (styles, { isFocused }) => ({
    ...styles,
    backgroundColor: isFocused ? "#333333" : "#2A2A2A",
    color: "white",
  }),
  input: (styles) => ({
    ...styles,
    color: "white",
  }),
};
const GeoSearch = ({ searchMode, setSearchMode, minusToken }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);
  const [isGeneratingData, setIsGeneratingData] = useState(false);

  const location = useLocation();
  const props = location.state;

  // States for Search
  const [searchData, setSearchData] = useState([]);

  // States for Inputs
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState({
    label: "All Categories",
    value: "All Categories",
  });
  const [selectedCity, setSelectedCity] = useState(null);
  const [query, setQuery] = useState("");

  // States for dropdowns
  const [countryOptions, setCountryOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Maps State
  const [mapCenter, setMapCenter] = useState({ lat: 22.54992, lng: 0 });
  const [mapZoom, setMapZoom] = useState(3);
  const [mapMarkers, setMapMarkers] = useState([]);
  // Search State
  const [selectedListItem, setSelectedListItem] = useState(null);

  //Error State
  const [error, setError] = useState(null);

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

  useEffect(() => {
    setCountryOptions(
      Country.getAllCountries()?.map((c) => ({
        label: c.name,
        value: c.isoCode,
      }))
    );
  }, []);

  useEffect(() => {
    if (searchData?.length > 0) {
      const firstLocation = searchData[0]?.positions[0];
      if (firstLocation) {
        if (selectedCity) {
          setMapCenter(firstLocation);
          setMapZoom(9);
        }
      }
      setMapMarkers(searchData);
    }
  }, [searchData]);

  const handleSearch = async () => {
    if (!user) {
      toast.error("Please log in to access this feature.");
      return;
    }
    if (!selectedCountry) {
      toast.error("Please select a country.");
      return;
    }
    setMapZoom(3);
    setMapMarkers([]);
    setSelectedListItem(null);
    const reqData = {
      category: selectedCategory?.value || "All Categories",
      country: selectedCountry?.label,
      email: user.email,
      ...(selectedCity && { city: selectedCity }),
      ...(query && { product: query }),
    };

    try {
      setIsGeneratingData(true);
      setError(null);
      const req = await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/ai/geo-search`,
        reqData
      );
      const data = req.data;
      if (data?.data?.error) {
        setError(data?.data?.error);
        return;
      } else {
        setSearchData(data?.data?.results);
        if (data?.useToken) {
          minusToken();
        }
      }
    } catch (error) {
      if (error?.response?.data?.reason === "token") {
        navigate("/pricing?error=Upgrade Plan or Buy Tokens");
      } else {
        toast.error(error?.response?.data?.error || "An error occurred");
      }
    } finally {
      setIsGeneratingData(false);
    }
  };
  const loadFirstData = async (city, product, category) => {
    if (!user) {
      toast.error("Please log in to access this feature.");
      return;
    }
    setMapZoom(3);
    setMapMarkers([]);
    setSelectedListItem(null);
    const reqData = {
      category: category,
      city: city,
      product: product,
      email: user.email,
      ...(product && { product: product }),
    };

    try {
      setIsGeneratingData(true);
      setError(null);
      const req = await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/ai/geo-search`,
        reqData
      );
      const data = req.data;
      if (data?.data?.error) {
        setError(data?.data?.error);
        return;
      } else {
        setSearchData(data?.data?.results);
        if (data?.useToken) {
          minusToken();
        }
      }
    } catch (error) {
      if (error?.response?.data?.reason === "token") {
        navigate("/pricing?error=Upgrade Plan or Buy Tokens");
      } else {
        toast.error(error?.response?.data?.error || "An error occurred");
      }
    } finally {
      setIsGeneratingData(false);
    }
  };

  useEffect(() => {
    if (props && user) {
      const { prompt, city, category } = props;

      setQuery(prompt);
      setSelectedCity(city);
      setSelectedCategory({
        label:  category,
        value: category,
      });
      loadFirstData(city, prompt, category);
    }
  }, []);
  return (
    <motion.div className="flex flex-col items-center mt-20 px-4 bg-[#1A1A1A] text-white min-h-screen overflow-hidden">
      <div className="w-full mx-auto text-center z-10 px-4">
        {/* Top Filter Section */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col gap-4 bg-gradient-to-r from-[#2A2A2A] to-[#4D4D4D] rounded-[20px] w-full mx-auto shadow-lg border border-[#00FF99]/20 p-4 backdrop-blur-sm">
            <div className="flex flex-wrap gap-4 w-full justify-between">
              {/* Category Dropdown */}
              <Select
                options={[
                  { label: "All Categories", value: "All Categories" },
                  ...categories.map((category) => ({
                    label: category.name,
                    value: category.name,
                  })),
                ]}
                placeholder="Select Category"
                value={selectedCategory}
                onChange={(c) => {
                  setSelectedCategory(c);
                  setQuery("");
                }}
                styles={customStyles}
                className="w-full sm:w-48 max-w-[300px]"
                menuPlacement="auto"
                isSearchable
              />

              {/* Country Dropdown */}
              <Select
                options={countryOptions}
                placeholder="Search Country..."
                value={selectedCountry}
                onChange={(value) => {
                  setSelectedCountry(value);
                  setSelectedCity("");
                }}
                styles={customStyles}
                className="w-full sm:w-48 max-w-[300px]"
                menuPlacement="auto"
                isSearchable
                filterOption={(option, input) => {
                  const isoCode = option.value?.toLowerCase(); // or option.data.isoCode if that's how it's structured
                  const label = option.label?.toLowerCase();
                  const search = input.toLowerCase();

                  // Prioritize matches that start with or include ISO code
                  if (isoCode && isoCode.includes(search)) return true;
                  if (label && label.includes(search)) return true;

                  return false;
                }}
              />

              <input
                type="text"
                placeholder="City or Zip"
                className={`bg-[#2A2A2A] max-w-[400px] min-w-[200px] text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00FF99] truncate shadow-md transition-all flex-1
                  ${!selectedCountry && "opacity-50"}
                `}
                onChange={(e) => setSelectedCity(e.target.value)}
                value={selectedCity}
                disabled={!selectedCountry}
              />

              {/* Product Search Input */}
              <input
                type="text"
                placeholder={`${"Enter Product Name"}`}
                className={`bg-[#2A2A2A] text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00FF99] truncate shadow-md transition-all flex-1 min-w-[200px] 
                  
                `}
                onChange={(e) => setQuery(e.target.value)}
                value={query}
              />

              {/* Search Button */}
              <button
                className={`bg-[#00FF99] text-black px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors flex items-center justify-center text-sm shadow-md hover:shadow-lg w-full sm:w-auto
                  ${isGeneratingData && "opacity-50 cursor-not-allowed"}
                  `}
                onClick={handleSearch}
                disabled={isGeneratingData}
              >
                Search
                <Send className="ml-2" size={16} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Result Section */}
        <motion.div
          className="w-full mb-8 flex flex-col lg:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GeoSearchResults
            handleMarkerClick={(e) => {
              setSelectedListItem(e?.id);
              setMapCenter(e.positions[0]);
              setMapZoom(13);
            }}
            isGeneratingData={isGeneratingData}
            searchData={searchData}
            selectedListItem={selectedListItem}
            searchedCategory={selectedCategory}
            error={error}
          />
          {!isGeneratingData && !error && (
            <GeoSearchMap
              center={mapCenter}
              zoom={mapZoom}
              locations={mapMarkers}
              isMenuOpen={isMenuOpen}
              selectedListItem={selectedListItem}
              setCenter={setMapCenter}
              setZoom={setMapZoom}
              setSelectedMarker={setSelectedListItem}
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GeoSearch;
