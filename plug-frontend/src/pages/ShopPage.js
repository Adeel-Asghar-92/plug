import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X, Camera } from "lucide-react";
import LoginModal from "../components/Modals/LoginModal";
import SignupModal from "../components/Modals/SignupModal";
import SearchByImageModal from "../components/Modals/SearchByImageModal";
import SubscriptionModal from "../components/Modals/SubscriptionModal";
import ContactModal from "../components/Modals/ContactModal";
import ProductGrid from "../components/HomePage/ProductGrid";
import UserDropdown from "../components/HomePage/UserDropdown";
import PriceFilter from "../components/HomePage/PriceFilter";
import logo from "../assets/img/logo.png";
import CategoriesNav from "../components/HomePage/CategoriesNav";
import Footer from "../components/HomePage/Footer";
import useCategories from "../hooks/useCategories";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const { user, logout, updateSubscription } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [imageProducts, setImageProducts] = useState([]);
  const [aiProducts, setaiProducts] = useState([]);

  // Modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isSearchByImageModalOpen, setIsSearchByImageModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleProductClick = (product) => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      navigate(`/product/${product.productId}`, { state: { product } });
    }
  };

  const handleImageSearchClick = (product) => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else if (
      user?.subscription === "free" &&
      (user?.subscriptionDetails?.searchByImageCount || 0) >= 2
    ) {
      setIsSubscriptionModalOpen(true);
    } else {
      setIsSearchByImageModalOpen(true);
    }
  };

  const handlePriceChange = (range) => {
    setPriceRange(range);
  };

  const handleSubscribe = async (planName) => {
    try {
      await updateSubscription(planName);
      setIsSubscriptionModalOpen(false);
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSubCategory("All");
  };

  // Add debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setDebouncedSearchTerm(searchTerm);
    }
  };

  const {
    loading: categoriesLoading,
    getMainCategories,
    getSubCategories,
  } = useCategories();

  const mainCategories = getMainCategories();

  return (
    <div className="flex flex-col min-h-screen overflow-hidden bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container px-4 mx-auto">
          <div className="flex items-center justify-between h-16">
            {/* Logo - same for both mobile and desktop */}
            <Link to="/" className="flex items-center cursor-pointer">
              {/* <img src={logo} alt="Logo" className="h-6 mr-2 sm:h-8 sm:mr-3 opacity-0" /> */}
              {/* <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-transparent bg-clip-text">
                VALUEVAULT
              </span> */}

              <img
                src="/logo.png"
                className="h-[30px] sm:h-[50px] font-bold bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-transparent bg-clip-text"
              /> 
            </Link>

            {/* Desktop Navigation */}
            <div className="items-center hidden space-x-4 md:flex">
              {user ? (
                <UserDropdown user={user} logout={logout} navigate={navigate} />
              ) : (
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="px-4 sm:px-6 py-2 text-sm sm:text-base text-gray-300 border border-[#4731c7] rounded-full hover:text-white"
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => setIsSignupModalOpen(true)}
                    className="px-4 sm:px-6 py-2 text-sm sm:text-base rounded-full bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white hover:opacity-90"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Navigation */}
            <div className="flex items-center md:hidden">
              {user ? (
                <UserDropdown user={user} logout={logout} navigate={navigate} />
              ) : (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-300 hover:text-white"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* <div className="px-4 py-8 bg-[#210433]"> 
        <div className="container mx-auto text-center">
          <h2 className=" mb-2 text-xl sm:text-2xl font-bold text-[#f51cea]"> 
          Upload your image, and Valuevault <span className="text-[#2ab6e4]">Ai</span> takes care of the rest!
          </h2>
          <h1 className=" mb-2 text-xl sm:text-2xl font-semibold text-white"> 
          Meet Valuevault, the first world's <span className="text-[#2ab6e4]">Ai</span> shopping assistant that scans sites like Amazon, Alibaba, and Temu to rank the best deals for dropshipping and personal shopping.
          </h1>
        </div>
      </div> */}

      {/* Mobile Menu - Only show for non-logged in users */}
      {!user && isMobileMenuOpen && (
        <div className="bg-gray-800 border-b border-gray-700 md:hidden">
          <div className="px-4 py-3 space-y-3">
            <button
              onClick={() => {
                setIsLoginModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full px-6 py-2 text-gray-300 border border-[#2ab6e4] rounded-full hover:text-white"
            >
              Log in
            </button>
            <button
              onClick={() => {
                setIsSignupModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full px-6 py-2 rounded-full bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white hover:opacity-90"
            >
              Sign up
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="w-full bg-[#13111C] border-y border-gray-700/50 ">
        <div className="py-4 sm:py-6">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col gap-4 sm:flex-row items-center">
              {/* Search Input */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearch}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] placeholder-gray-400"
                />
                <div className="absolute -translate-y-1/2 right-3 sm:right-4 top-1/2 flex justify-center gap-4">
                  <button
                    className="  sm:right-4 top-1/2 "
                    onClick={() => setDebouncedSearchTerm(searchTerm)}
                  >
                    <Search className="w-4 h-4 text-gray-400 transition-colors sm:w-5 sm:h-5 hover:text-gray-600" />
                  </button>
                  <button
                    className="  sm:right-4 top-1/2"
                    title="Search By Uploading Image"
                    onClick={() => handleImageSearchClick()}
                  >
                    <Camera className="w-4 h-4 text-gray-400 transition-colors sm:w-5 sm:h-5 hover:text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Price Filter */}
              <div className="flex-shrink-0">
                <PriceFilter onPriceChange={handlePriceChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-">
        {/* Categories Navigation */}
        <div className="w-full border-b border-gray-700/50 bg-[#13111C]">
          <CategoriesNav
            mainCategories={mainCategories}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            onCategorySelect={handleCategorySelect}
            onSubCategorySelect={setSelectedSubCategory}
            getSubCategories={getSubCategories}
            loading={categoriesLoading}
          />
        </div>

        {/* Product Grid */}
        <div className="bg-gray-900">
          <ProductGrid
            onProductClick={handleProductClick}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            searchTerm={debouncedSearchTerm}
            priceRange={priceRange}
            imageProducts={imageProducts}
            aiProducts={aiProducts}
          />
        </div>
      </main>
      {/* Footer - Added proper background and border to prevent gaps */}
      <footer className="mt-auto bg-gray-800 border-t border-gray-700">
        <Footer openContactModal={() => setIsContactModalOpen(true)} />
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      <SearchByImageModal
        isOpen={isSearchByImageModalOpen}
        onClose={() => setIsSearchByImageModalOpen(false)}
        onLogin={() => setIsLoginModalOpen(true)}
        setProduct={(items) => setImageProducts(items)}
        setaiProducts={(items) => setaiProducts(items)}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onSubscribe={handleSubscribe}
      />
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  );
};

export default HomePage;
