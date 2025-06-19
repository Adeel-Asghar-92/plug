import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Paperclip, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SearchForm = ({ onProductAdded, open = null, openSet = () => { }, fetchSavedProducts = () => { }}) => {
  const [showSingleUrlDropdown, setShowSingleUrlDropdown] = useState(false);
  const [showWholeSiteDropdown, setShowWholeSiteDropdown] = useState(false);
  const [singleUrlCategory, setSingleUrlCategory] = useState('');
  const [singleUrlSubcategory, setSingleUrlSubcategory] = useState('');
  const [singleUrlSecondSubcategory, setSingleUrlSecondSubcategory] = useState('');
  const [wholeSiteCategory, setWholeSiteCategory] = useState('');
  const [wholeSiteSubcategory, setWholeSiteSubcategory] = useState('');
  const [singleUrl, setSingleUrl] = useState('');
  const [wholeSite, setWholeSite] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [secondSubcategories, setSecondSubcategories] = useState([]);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const [showSecondSubcategoryDropdown, setShowSecondSubcategoryDropdown] = useState(false);

  const {user} = useAuth();
  const navigate = useNavigate();
  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/admin/categories`,
          {
            params: { email: process.env.REACT_APP_ADMIN_EMAIL }
          }
        );
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (open === null) return

    setIsOpen(open === true ? true : false)
  }, [open]);

  // Update subcategories when category changes
  useEffect(() => {
    if (singleUrlCategory) {
      const selectedCategory = categories.find(cat => cat.name === singleUrlCategory);
      setSubcategories(selectedCategory?.subcategories || []);
      setSingleUrlSubcategory(''); // Reset subcategory when category changes
      setSingleUrlSecondSubcategory(''); // Reset second subcategory when category changes
      setSecondSubcategories([]); // Reset second subcategories
    }
  }, [singleUrlCategory, categories]);

  // Update second subcategories when subcategory changes
  useEffect(() => {
    if (singleUrlSubcategory) {
      const selectedCategory = categories.find(cat => cat.name === singleUrlCategory);
      const selectedSubcategory = selectedCategory?.subcategories.find(
        sub => sub.name === singleUrlSubcategory
      );
      setSecondSubcategories(selectedSubcategory?.secondSubcategories || []);
      setSingleUrlSecondSubcategory(''); // Reset second subcategory when subcategory changes
    }
  }, [singleUrlSubcategory, singleUrlCategory, categories]);

  const handleSearch = async () => {
    const activeCategory = singleUrlCategory;
    const activeSubcategory = singleUrlSubcategory;
    const activeSecondSubcategory = singleUrlSecondSubcategory;
    const activeUrl = singleUrl;

    if (!activeCategory || !activeUrl) {
      setError('Please select a category and enter a URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASEURL}/api/scrape-product`, {
        url: activeUrl,
        category: activeCategory,
        subcategory: activeSubcategory || undefined,
        secondSubcategory: activeSecondSubcategory || undefined,
        email: user?.email || undefined
      });

      if (onProductAdded) {
        onProductAdded(response.data.product);
      }
      fetchSavedProducts()
      setIsOpen(false);
      openSet(false)
      toast.success('Product added successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product');
      if(err?.response?.data?.reason === "token") {
        navigate("/pricing?error=Upgrade Plan or Buy Tokens");
      } else {
        toast.error(err.response?.data?.message || 'Failed to add product');
      }
    } finally {
      setLoading(false);
    }
  };

  const backgroundVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  };

  const modalVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: 10, opacity: 0 }
  };

  const buttonVariants = {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Background overlay */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            variants={backgroundVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />

          {/* Main Container */}
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700"
              variants={modalVariants}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-2xl font-bold text-white">
                  <span className="bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] bg-clip-text text-transparent">
                    Add Product
                  </span>
                </h3>
                <button
                  onClick={() => { setIsOpen(false); openSet(false) }}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="space-y-6">
                  {error && (
                    <motion.div
                      className="p-3 bg-red-600/20 border border-red-600 rounded-lg text-red-300 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Input Rows */}
                  <motion.div className="space-y-4" variants={itemVariants}>
                    {/* Single URL Row */}
                    <div className="flex flex-col gap-4 w-full">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-1">
                          Product URL
                        </label>
                        <input
                          type="text"
                          placeholder="https://example.com/product"
                          value={singleUrl}
                          onChange={(e) => setSingleUrl(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none focus:ring-2 focus:ring-[#2ab6e4]/50 transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Category Dropdown */}
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-1">
                            Category
                          </label>
                          <div className="relative">
                            <button
                              className="w-full flex justify-between items-center text-white px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg hover:border-[#2ab6e4] transition-colors text-sm"
                              onClick={() => {
                                setShowSingleUrlDropdown(!showSingleUrlDropdown);
                                setShowWholeSiteDropdown(false);
                                setShowSubcategoryDropdown(false);
                                setShowSecondSubcategoryDropdown(false);
                              }}
                            >
                              <span>{singleUrlCategory || 'Select Category'}</span>
                              <ChevronDown
                                className={`transition-transform ${showSingleUrlDropdown ? 'rotate-180' : ''}`}
                                size={16}
                              />
                            </button>
                            <AnimatePresence>
                              {showSingleUrlDropdown && (
                                <motion.div
                                  className="absolute z-10 mt-1 w-full bg-gray-800 rounded-lg shadow-lg border border-gray-600 overflow-hidden"
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                >
                                  {categories.map((category) => (
                                    <div
                                      key={category._id}
                                      className={`px-4 py-3 cursor-pointer hover:bg-gray-700 text-sm ${singleUrlCategory === category.name
                                        ? 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white font-medium'
                                        : 'text-gray-300'
                                        }`}
                                      onClick={() => {
                                        setSingleUrlCategory(category.name);
                                        setShowSingleUrlDropdown(false);
                                      }}
                                    >
                                      {category.name}
                                    </div>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Subcategory Dropdown */}
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-1">
                            Subcategory (Optional)
                          </label>
                          <div className="relative">
                            <button
                              className={`w-full flex justify-between items-center px-4 py-3 bg-gray-700 border rounded-lg transition-colors text-sm ${!singleUrlCategory
                                ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                                : 'border-gray-600 hover:border-[#2ab6e4] text-white'
                                }`}
                              onClick={() => {
                                if (singleUrlCategory) {
                                  setShowSubcategoryDropdown(!showSubcategoryDropdown);
                                  setShowSingleUrlDropdown(false);
                                  setShowWholeSiteDropdown(false);
                                  setShowSecondSubcategoryDropdown(false);
                                }
                              }}
                              disabled={!singleUrlCategory}
                            >
                              <span>{singleUrlSubcategory || 'Select Subcategory'}</span>
                              <ChevronDown
                                className={`transition-transform ${showSubcategoryDropdown ? 'rotate-180' : ''}`}
                                size={16}
                              />
                            </button>
                            <AnimatePresence>
                              {showSubcategoryDropdown && singleUrlCategory && (
                                <motion.div
                                  className="absolute z-10 mt-1 w-full bg-gray-800 rounded-lg shadow-lg border border-gray-600 overflow-hidden"
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                >
                                  {subcategories.length > 0 ? (
                                    subcategories.map((subcategory) => (
                                      <div
                                        key={subcategory._id}
                                        className={`px-4 py-3 cursor-pointer hover:bg-gray-700 text-sm ${singleUrlSubcategory === subcategory.name
                                          ? 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white font-medium'
                                          : 'text-gray-300'
                                          }`}
                                        onClick={() => {
                                          setSingleUrlSubcategory(subcategory.name);
                                          setShowSubcategoryDropdown(false);
                                        }}
                                      >
                                        {subcategory.name}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-gray-400 text-sm">
                                      No subcategories available
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Second Subcategory Dropdown */}
                        <div>
                          <label className="block text-gray-300 text-sm font-medium mb-1">
                            Second Subcategory (Optional)
                          </label>
                          <div className="relative">
                            <button
                              className={`w-full flex justify-between items-center px-4 py-3 bg-gray-700 border rounded-lg transition-colors text-sm ${!singleUrlSubcategory
                                ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                                : 'border-gray-600 hover:border-[#2ab6e4] text-white'
                                }`}
                              onClick={() => {
                                if (singleUrlSubcategory) {
                                  setShowSecondSubcategoryDropdown(!showSecondSubcategoryDropdown);
                                  setShowSingleUrlDropdown(false);
                                  setShowWholeSiteDropdown(false);
                                  setShowSubcategoryDropdown(false);
                                }
                              }}
                              disabled={!singleUrlSubcategory}
                            >
                              <span>{singleUrlSecondSubcategory || 'Select Second Subcategory'}</span>
                              <ChevronDown
                                className={`transition-transform ${showSecondSubcategoryDropdown ? 'rotate-180' : ''}`}
                                size={16}
                              />
                            </button>
                            <AnimatePresence>
                              {showSecondSubcategoryDropdown && singleUrlSubcategory && (
                                <motion.div
                                  className="absolute z-10 mt-1 w-full bg-gray-800 rounded-lg shadow-lg border border-gray-600 overflow-hidden"
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                >
                                  {secondSubcategories.length > 0 ? (
                                    secondSubcategories.map((secondSubcategory) => (
                                      <div
                                        key={secondSubcategory._id}
                                        className={`px-4 py-3 cursor-pointer hover:bg-gray-700 text-sm ${singleUrlSecondSubcategory === secondSubcategory.name
                                          ? 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white font-medium'
                                          : 'text-gray-300'
                                          }`}
                                        onClick={() => {
                                          setSingleUrlSecondSubcategory(secondSubcategory.name);
                                          setShowSecondSubcategoryDropdown(false);
                                        }}
                                      >
                                        {secondSubcategory.name}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="px-4 py-3 text-gray-400 text-sm">
                                      No second subcategories available
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Table */}
                  <motion.div className="space-y-4" variants={itemVariants}>
                    <label className="block text-gray-300 text-sm font-medium">
                      Expected Results
                    </label>
                    <div className="w-full overflow-x-auto rounded-lg border border-gray-600">
                      <table className="w-full bg-gray-800 text-white text-sm">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Type</th>
                            <th className="px-4 py-3 text-left font-medium">Name</th>
                            <th className="px-4 py-3 text-left font-medium">Price</th>
                            <th className="px-4 py-3 text-left font-medium">Category</th>
                            <th className="px-4 py-3 text-left font-medium">Subcategory</th>
                            <th className="px-4 py-3 text-left font-medium">Second Subcategory</th>
                            <th className="px-4 py-3 text-left font-medium">URL</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3 border-t border-gray-700">
                              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3 border-t border-gray-700">
                              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3 border-t border-gray-700">
                              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3 border-t border-gray-700">
                              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3 border-t border-gray-700">
                              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3 border-t border-gray-700">
                              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                            <td className="px-4 py-3 border-t border-gray-700">
                              <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </motion.div>

                  {/* Search Button */}
                  <motion.div className="flex justify-end" variants={itemVariants}>
                    <motion.button
                      onClick={handleSearch}
                      disabled={loading || !singleUrl || !singleUrlCategory}
                      className={`px-6 py-3 rounded-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] ${loading || !singleUrl || !singleUrlCategory
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:shadow-lg hover:shadow-[#2ab6e4]/20'
                        }`}
                      variants={buttonVariants}
                      whileHover={!(loading || !singleUrl || !singleUrlCategory) ? "hover" : {}}
                      whileTap={!(loading || !singleUrl || !singleUrlCategory) ? "tap" : {}}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                          Adding Product...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Add Product
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchForm;
