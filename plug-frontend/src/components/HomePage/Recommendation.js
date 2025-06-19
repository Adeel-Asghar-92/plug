import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";
import RecommendationCard from "./RecommendationCard";
import axios from "axios";
import { debounce } from "lodash";
import { motion } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";

const Recommendation = ({ searchQuery, setSearchQuery }) => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [loader, setLoader] = useState(true);
  const [error, setError] = useState(null);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [seed, setSeed] = useState(null);
  const containerRef = useRef(null);
    const { user, loading } = useAuth();
  
  // Debounce logic
  const debouncedSetSearchQuery = useMemo(() => {
    return debounce((value) => setDebouncedSearchQuery(value), 300);
  }, []);

  useEffect(() => {
    debouncedSetSearchQuery(searchQuery);
  }, [searchQuery, debouncedSetSearchQuery]);

  // Responsive item count
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1536) setItemsPerView(6);
      else if (width >= 1280) setItemsPerView(5);
      else if (width >= 1024) setItemsPerView(4);
      else if (width >= 768) setItemsPerView(3);
      else if (width >= 640) setItemsPerView(2);
      else setItemsPerView(1);
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchProducts = async () => {
      setLoader(true);
      setError(null);
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/products`,
          {
            params: {
              page: currentPage,
              ...(seed && { seed }),
              email: user?.email || "",
            },
            withCredentials: true,
          }
        );

        const filtered = data.products.filter(
          (p) => !p.category?.toLowerCase().includes("accessor")
        );

        setProducts(filtered);
        setTotalPages(data.totalPages);
        setSeed(data.seed || null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoader(false);
      }
    };
      if (!loading) {
        fetchProducts();
      }
  }, [currentPage, loading]);

  // Filtered products memo
  const filteredProducts = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return query === ""
      ? products
      : products.filter((p) => p.title.toLowerCase().includes(query));
  }, [products, debouncedSearchQuery]);

  // Handlers
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handlePageChange = useCallback(
    (page) => {
      if (page !== currentPage) {
        setCurrentPage(page);
        containerRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [currentPage]
  );

  const getVisiblePages = () => {
    const visiblePages = 5;
    let start = Math.max(1, currentPage - Math.floor(visiblePages / 2));
    let end = Math.min(totalPages, start + visiblePages - 1);
    if (end - start + 1 < visiblePages) {
      start = Math.max(1, end - visiblePages + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  console.log("filteredProducts===>>>", filteredProducts);
  
  return (
    <div className="w-[100vw] mx-auto px-0 mt-2 pt-1" ref={containerRef}>
      {error && (
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
        </div>
      )}

      {loader ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Search Bar */}
          <div className="flex justify-end my-8 z-[1000] fixed top-[-14px] left-[50%] translate-x-[-50%]">
            <div className="relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-white" />
              </div>
              <input
                type="text"
                placeholder="Search products"
                className="block rounded-2xl w-full pl-10 pr-10 py-2 border bg-black text-white border-gray-300 leading-5 placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={searchQuery}
                onChange={handleSearch}
                aria-label="Search products"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearchQuery("");
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label="Clear search"
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          {debouncedSearchQuery && (
            <div className="text-center mb-4">
              <p className="text-gray-600">
                Showing {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "result" : "results"} for "
                {debouncedSearchQuery}"
              </p>
            </div>
          )}

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-2">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id || index}
                  className="h-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                >
                  <RecommendationCard product={product} setProducts={setProducts}/>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 text-lg">
              No products found matching your search.
            </div>
          )}

          {/* Pagination */}
          {debouncedSearchQuery === "" && (
            <div className="flex flex-wrap justify-center items-center mt-8 gap-2">
              <PaginationButton
                icon={<ChevronFirst />}
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              />
              <PaginationButton
                icon={<ChevronLeft />}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              />

              {currentPage > 3 && totalPages > 5 && (
                <>
                  <PageNumberButton page={1} onClick={handlePageChange} />
                  <span className="px-1">...</span>
                </>
              )}

              {getVisiblePages().map((page) => (
                <PageNumberButton
                  key={page}
                  page={page}
                  isActive={page === currentPage}
                  onClick={handlePageChange}
                />
              ))}

              {currentPage < totalPages - 2 && totalPages > 5 && (
                <>
                  <span className="px-1">...</span>
                  <PageNumberButton
                    page={totalPages}
                    onClick={handlePageChange}
                  />
                </>
              )}

              <PaginationButton
                icon={<ChevronRight />}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
              <PaginationButton
                icon={<ChevronLast />}
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Reusable pagination button
const PaginationButton = ({ icon, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-lg transition-all duration-200 ${
      disabled
        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
        : "bg-blue-600 text-white hover:bg-blue-700"
    }`}
  >
    {icon}
  </button>
);

// Reusable page number button
const PageNumberButton = ({ page, isActive, onClick }) => (
  <button
    onClick={() => onClick(page)}
    className={`px-3 py-1 rounded-md font-medium transition-all duration-200 ${
      isActive
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
    aria-label={`Page ${page}`}
  >
    {page}
  </button>
);

export default Recommendation;
