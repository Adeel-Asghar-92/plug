import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Paperclip, Camera, Save, Check, Search, ChevronDown } from "lucide-react";
import LoginModal from "../components/Modals/LoginModal";
import SignupModal from "../components/Modals/SignupModal";
import SubscriptionModal from "../components/Modals/SubscriptionModal";
import ContactModal from "../components/Modals/ContactModal";
import ProductGrid from "../components/HomePage/ProductGrid";
import UserDropdown from "../components/HomePage/UserDropdown";
import Footer from "../components/HomePage/Footer";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { useSearchParams } from "react-router-dom";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
// Import the Google Generative AI SDK
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// import required modules
import { Pagination, Autoplay } from "swiper/modules";
import { toast } from "react-hot-toast";

const HomePage = () => {
  const navigate = useNavigate();
  const {
    user,
    logout,
    updateSubscription,
    updateUser,
    loading: navigationLoading,
  } = useAuth();

  // State for UI controls
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSecondSubCategory, setSelectedSecondSubCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [imageProducts, setImageProducts] = useState([]);
  const [aiProducts, setaiProducts] = useState([]);
  const [isOn, setIsOn] = useState(false);
  const [carousels, setCarousels] = useState([]);
  
  // Modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isProductGridOpen, setIsProductGridOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // State for image search
  const [file, setFile] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categories, setCategories] = useState([]);
  const resultsRef = useRef(null);

  const [error, setError] = useState(null);
  const searchByImageRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [Specific, setSpecific] = useState(false);

  const [searchParams] = useSearchParams();
  const referCode = searchParams.get("signupref");

  // Compress image function
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      try {
        // File size check - if extremely large, reject early
        if (file.size > 10 * 1024 * 1024) { // 10MB
          toast.error("Image is too large (max 10MB)");
          reject(new Error("Image is too large"));
          return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
          try {
            const img = new Image();
            img.onload = () => {
              try {
                // Create canvas
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions while maintaining aspect ratio
                const MAX_WIDTH = 800; // Reduced for better compression
                const MAX_HEIGHT = 800; // Reduced for better compression
                
                if (width > height) {
                  if (width > MAX_WIDTH) {
                    height = Math.round(height * MAX_WIDTH / width);
                    width = MAX_WIDTH;
                  }
                } else {
                  if (height > MAX_HEIGHT) {
                    width = Math.round(width * MAX_HEIGHT / height);
                    height = MAX_HEIGHT;
                  }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // Draw image on canvas with new dimensions
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert canvas to blob with lower quality for better compression
                canvas.toBlob((blob) => {
                  try {
                    if (!blob) {
                      reject(new Error('Canvas to Blob conversion failed'));
                      return;
                    }
                    
                    // Create a new file from the blob
                    const compressedFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now()
                    });
                    
                    console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB, Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                    resolve(compressedFile);
                  } catch (err) {
                    console.error("Error in blob conversion:", err);
                    // If compression fails, resolve with the original file as fallback
                    resolve(file);
                  }
                }, 'image/jpeg', 0.6); // Lower quality (0.6) for better compression
              } catch (err) {
                console.error("Error in canvas operations:", err);
                // If compression fails, resolve with the original file as fallback
                resolve(file);
              }
            };
            
            img.onerror = (err) => {
              console.error("Error loading image:", err);
              // If image loading fails, resolve with the original file
              resolve(file);
            };
            
            img.src = event.target.result;
          } catch (err) {
            console.error("Error in image creation:", err);
            // If compression fails, resolve with the original file as fallback
            resolve(file);
          }
        };
        
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
          // If compression fails, resolve with the original file as fallback
          resolve(file);
        };
      } catch (err) {
        console.error("Unexpected error in compression:", err);
        // If any unexpected error occurs, resolve with the original file
        resolve(file);
      }
    });
  };

  useEffect(() => {
    if (referCode && !user && !navigationLoading) {
      setIsSignupModalOpen(true);
    }
  }, [navigationLoading, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible((prevIsVisible) => (prevIsVisible ? false : false));
    }, 1000);
    return () => clearInterval(interval);
  }, [isVisible]);

  useEffect(() => {
    const fetchCarousels = async () => {
      try {
        const res = await axios.get("/api/admin/carousels");
        setCarousels(res.data.carousels);
      } catch (err) {
      } finally {
      }
    };
    fetchCarousels();
  }, []);

  // Fetch categories for saving products
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/admin/categories`, {
          params: { email: process.env.REACT_APP_ADMIN_EMAIL }
        });
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleSubscribe = async (planName) => {
    try {
      await updateSubscription(planName);
      setIsSubscriptionModalOpen(false);
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  // Handle image file selection
  const handleImageChange = async (e) => {
    // Clear any previous errors
    setError(null);
    
    const selectedFile = e.target.files && e.target.files[0];
    if (!selectedFile) return;

    // Check if user is logged in
    if (!user) {
      toast.error("Please login to use image search");
      setIsLoginModalOpen(true);
      return;
    }

    // Check if user has enough balance
    if (user.balance <= 0) {
      toast.error("Insufficient balance. Please subscribe to continue.");
      setIsSubscriptionModalOpen(true);
      return;
    }

    setLoading(true);
    setSelectedProducts(new Set());

    try {
      // Always compress image first to manage file size
      let imageToUpload;
      
      try {
        if (selectedFile.size > 1024 * 1024) {
          toast.info("Processing image...");
          imageToUpload = await compressImage(selectedFile);
        } else {
          imageToUpload = selectedFile;
        }
      } catch (compressionError) {
        console.error("Image compression failed:", compressionError);
        // If compression fails, use original file but log the error
        imageToUpload = selectedFile;
      }
      
      // Only set the file after compression to show the compressed version in the UI
      setFile(imageToUpload);

      const formData = new FormData();
      formData.append("image", imageToUpload);
      formData.append("email", user.email);

      const response = await axios.post("/api/ai/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data) {
        setImageProducts(response.data || []);
        
        // Update user balance based on subscription type
        const balanceToDeduct = user.subscriptionType === "premium" ? 10 : 20;
        const updatedUser = {
          ...user,
          balance: user.balance - balanceToDeduct,
        };
        updateUser(updatedUser);
        
        // Scroll to results
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    } catch (error) {
      console.error("Error searching by image:", error);
      
      // More specific error messages based on response status
      let errorMessage = "An error occurred during image search";
      
      if (error.response) {
        if (error.response.status === 413) {
          errorMessage = "Image is too large. Please use a smaller image (max 5MB).";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Clear file input and state
      setFile(null);
      if (searchByImageRef.current) searchByImageRef.current.value = "";
    } finally {
      setLoading(false);
    }
  };

  // Toggle product selection
  const toggleProductSelection = (position) => {
    setSelectedProducts(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(position)) {
        newSelection.delete(position);
      } else {
        newSelection.add(position);
      }
      return newSelection;
    });
  };

  // Handle product click
  const handleProductClick = (product) => {
    toggleProductSelection(product.position);
  };

  // Handle save button click
  const handleSaveClick = () => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product to save');
      return;
    }
    
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    
    setShowCategoryDialog(true);
  };

  // Handle final save after category selection
  const handleFinalSave = async () => {
    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setIsSaving(true);

    try {
      // Format products for saving
      const productsToSave = Array.from(selectedProducts).map(position => {
        const product = imageProducts.find(p => p.position === position);
        // Create a unique ID with timestamp to prevent collisions
        console.log('2nd sub category', selectedSecondSubCategory)
        const timestamp = new Date().getTime().toString();
        return {
          productId: product.position.toString() + '_' + timestamp,
          title: product.title,
          price: product.extracted_price ? product.extracted_price.toString() : product.price?.replace(/[^0-9.]/g, ''),
          imageUrl: product.image?.link || product.thumbnail,
          seller: product.source || "Unknown",
          shopId: product.source_id || product.source || "unknown",
          detailUrl: product.link,
          category: selectedCategory,
          subcategory: selectedSubCategory || '',
          secondSubcategory: selectedSecondSubCategory || ''
        };
      });

      // Save products using the format provided
      const response = await axios.post(`${process.env.REACT_APP_API_BASEURL}/api/admin/save-products`, {
        products: productsToSave,
        email: user.email
      });

      console.log(response)

      if (response.status === 200) {
        toast.success("Products saved successfully");
        setSelectedProducts(new Set());
        setShowCategoryDialog(false);
        setSelectedCategory('');
        setSelectedSubCategory('');
        setSelectedSecondSubCategory('');
      } else {
        toast.error(response.data.message || "Failed to save products");
      }
    } catch (error) {
      console.error("Error saving products:", error);
      toast.error(error.response?.data?.message || "An error occurred while saving products");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearch = async () => {
    try {
      if (!file && !searchTerm) return;
      const formData = new FormData();
      if (file) formData.append("image", file);
      formData.append("searchTerm", searchTerm);
      const response = await axios.post("/api/ai/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (response.data) {
        setImageProducts(response.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen overflow-hidden relative">
        <main className="flex-grow container mx-auto py-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Precision AI Valuation
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              "I'm Patrick, a precision AI revolutionizing the trade of the world's most sought-after assets.
              Powered by advanced algorithms and LLMS, I balance the market by eliminating overpricing and underpricing."
            </p>
          </div>
          
          {/* Image Upload Section */}
          <div className="mt-8 mb-12 bg-gradient-to-r from-[#333333] to-[#222222] p-6 rounded-xl shadow-xl border border-gray-700">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-xl">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Search by Image</h3>
                  <p className="text-gray-400">Upload an image to find similar products</p>
                </div>

                <div 
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#2ab6e4] transition-all cursor-pointer bg-[#2A2A2A]"
                  onClick={() => {
                    if (searchByImageRef.current) {
                      searchByImageRef.current.value = "";
                      searchByImageRef.current.click();
                    }
                  }}
                >
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    ref={searchByImageRef}
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="max-h-48 max-w-full mb-4 rounded-lg shadow-md" 
                      />
                      <p className="text-[#2ab6e4] font-medium">{file.name}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          if (searchByImageRef.current) searchByImageRef.current.value = "";
                        }}
                        className="mt-3 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all text-sm"
                      >
                        Remove Image
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <Camera className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-300 mb-2">Drag & drop an image here or click to browse</p>
                      <p className="text-gray-500 text-sm">Supported formats: JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleImageChange}
                    disabled={!file || loading}
                    className={`px-6 py-3 rounded-lg flex items-center justify-center transition-all ${
                      !file || loading
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white hover:shadow-lg hover:shadow-[#2ab6e4]/20'
                    } w-full max-w-xs`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 mr-2" />
                        Search by Image
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {imageProducts.length > 0 && (
            <div ref={resultsRef} className="mt-12 mb-16">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Image Search Results</h2>
                
                {selectedProducts.size > 0 && (
                  <button
                    onClick={() => setShowCategoryDialog(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white rounded-lg flex items-center hover:shadow-lg hover:shadow-[#2ab6e4]/20 transition-all"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Save {selectedProducts.size} {selectedProducts.size === 1 ? 'Product' : 'Products'}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {imageProducts.length > 0 && imageProducts.map((product, index) => (
                  <div 
                    key={product.position} 
                    className={`bg-[#2A2A2A] rounded-xl overflow-hidden relative shadow-xl transform hover:translate-y-[-5px] transition-all duration-300 border ${
                      selectedProducts.has(product.position) 
                        ? 'border-[#2ab6e4] ring-2 ring-[#2ab6e4]/30' 
                        : 'border-gray-800 hover:border-[#2ab6e4]/30'
                    }`}
                    onClick={() => handleProductClick(product)}
                  >
                    {/* Checkbox for product selection */}
                    <div className="absolute top-3 right-3 z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md transition-all duration-200 ${
                          selectedProducts.has(product.position)
                            ? 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] scale-110'
                            : 'bg-gray-700/80 border border-gray-600'
                        }`}
                      >
                        {selectedProducts.has(product.position) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    <div className="cursor-pointer">
                      <div className="relative overflow-hidden">
                        <img
                          src={product.image?.link || product.thumbnail}
                          alt={product.title}
                          className="w-full h-56 object-cover"
                        />
                        {selectedProducts.has(product.position) && (
                          <div className="absolute inset-0 bg-[#2ab6e4]/10"></div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-medium text-lg truncate">
                          {product.title}
                        </h3>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-[#2ab6e4] font-bold">
                            {product.price || `$${product.extracted_price?.toFixed(2)}`}
                          </p>
                          <div className="flex items-center text-gray-400 text-sm">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1.5"></span>
                            {product.source || "Unknown"}
                          </div>
                        </div>
                        {product.stock_information && (
                          <div className="mt-1 text-xs text-green-400">
                            {product.stock_information}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Empty state */}
              {imageProducts.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">No products found</h3>
                  <p className="text-gray-400">Try uploading a different image</p>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-16 mt-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-t-transparent border-[#a017c9] rounded-full animate-spin"></div>
                <div className="w-16 h-16 border-4 border-t-transparent border-[#2ab6e4] rounded-full animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ animationDirection: 'reverse' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-medium">
                  <span className="sr-only">Loading...</span>
                </div>
              </div>
              <div className="ml-6 max-w-md">
                <p className="text-xl font-medium text-white mb-2">Searching for products...</p>
                <p className="text-gray-400">
                  "Patrick is analyzing your image and finding the best matching products for you!"
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto bg-gray-800 border-t border-gray-700">
          <Footer openContactModal={() => setIsContactModalOpen(true)} />
        </footer>
      </div>

      {/* Fixed Save Button */}
      {selectedProducts.size > 0 && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowCategoryDialog(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white rounded-lg flex items-center hover:opacity-90 transform hover:scale-105 transition-all shadow-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            Save ({selectedProducts.size})
          </button>
        </div>
      )}

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginModalOpen(false);
          setIsSignupModalOpen(true);
        }}
      />
      <SignupModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupModalOpen(false);
          setIsLoginModalOpen(true);
        }}
        referCode={referCode}
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

      {/* Category Selection Dialog */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-[#333333] to-[#222222] rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-700 transform transition-all animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Save to Category</h3>
              <button 
                onClick={() => setShowCategoryDialog(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              {/* Category Selection */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Select Category</label>
                <div className="relative">
                  <select 
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedSubCategory('');
                      setSelectedSecondSubCategory('');
                    }}
                    className="w-full p-3 bg-[#333333] text-white rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none border border-gray-700 appearance-none transition-all"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                </div>
              </div>
              
              {/* Subcategory Selection */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Select Subcategory (Optional)</label>
                <div className="relative">
                  <select 
                    value={selectedSubCategory}
                    onChange={(e) => {
                      setSelectedSubCategory(e.target.value);
                      setSelectedSecondSubCategory('');
                    }}
                    className={`w-full p-3 bg-[#333333] text-white rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none border border-gray-700 appearance-none transition-all ${!selectedCategory ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={!selectedCategory}
                  >
                    <option value="">Select a subcategory</option>
                    {selectedCategory && categories
                      .find(cat => cat.name === selectedCategory)?.subcategories
                      .map(subcat => (
                        <option key={subcat._id} value={subcat.name}>{subcat.name}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                </div>
              </div>

              {/* Second Subcategory Selection */}
              <div>
                <label className="block text-gray-300 mb-2 text-sm font-medium">Select Second Subcategory (Optional)</label>
                <div className="relative">
                  <select 
                    value={selectedSecondSubCategory}
                    onChange={(e) => setSelectedSecondSubCategory(e.target.value)}
                    className={`w-full p-3 bg-[#333333] text-white rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none border border-gray-700 appearance-none transition-all ${!selectedSubCategory ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={!selectedSubCategory}
                  >
                    <option value="">Select a second subcategory</option>
                    {selectedSubCategory && categories
                      .find(cat => cat.name === selectedCategory)?.subcategories
                      .find(sub => sub.name === selectedSubCategory)?.secondSubcategories
                      .map(secondSubcat => (
                        <option key={secondSubcat._id} value={secondSubcat.name}>{secondSubcat.name}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowCategoryDialog(false)}
                className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleFinalSave}
                disabled={isSaving || !selectedCategory}
                className={`px-5 py-2.5 text-white rounded-lg flex items-center transition-all focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] ${
                  isSaving || !selectedCategory
                    ? 'bg-gray-600 cursor-not-allowed opacity-70'
                    : 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:shadow-lg hover:shadow-[#2ab6e4]/20'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Products
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomePage;