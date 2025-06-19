import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Copy,
  Edit2,
  ExternalLink,
  Paperclip,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";

import ChatHistory from "./ChatHistory";
import EditImage from "../../components/EditImage";
import SearchForm from "../../components/AdminDashboard/SearchForm";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { numberToKMG } from "../../utils/commons";
import ProfileImageGroup from "../../components/ProfileImageGroup ";
import FollowerModal from "./FollowerModal";

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState("");
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("savedProducts");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadType, setUploadType] = useState("url");
  const [uploading, setUploading] = useState(false);
  const [userPlan, setUserPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [errorPlan, setErrorPlan] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [product, setProduct] = useState({});

  const [updateForm, setUpdateForm] = useState({
    title: "",
    price: "",
    imageUrl: "",
    imageFile: null,
    withVendor: [],
  });
  const [stats, setStats] = useState({ favourites: [], followers: [] });
  const [followers, setFollowers] = useState([]);
  const [favorities, setFavourites] = useState([]);
  const [isFollowerModalOpen, setIsFollowerModalOpen] = useState(false);

  const categories = [
    "Yachts",
    "Home",
    "Cars",
    "Jet",
    "Watches",
    "Accessories",
  ];

  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [keyResponse, productsResponse, subscriptionResponse] =
        await Promise.all([
          axios.get(`${process.env.REACT_APP_API_BASEURL}/api/user/api-key`, {
            params: { email: user.email },
          }),
          axios.get(
            `${process.env.REACT_APP_API_BASEURL}/api/user/saved-products`,
            { params: { email: user.email } }
          ),
          axios.get(
            `${process.env.REACT_APP_API_BASEURL}/api/subscription/${user.email}`
          ),
        ]);
      setApiKey(keyResponse.data.apiKey);
      setStats(productsResponse.data.stats);
      setSavedProducts(productsResponse.data.products);
      setUserPlan(subscriptionResponse.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setErrorPlan("Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setLoadingPlan(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [user, navigate, fetchDashboardData]);

  const regenerateApiKey = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/user/api-key`,
        { email: user.email }
      );
      setApiKey(response.data.apiKey);
      toast.success("API key regenerated successfully.");
    } catch (error) {
      console.error("Error regenerating API key:", error);
      toast.error("Failed to regenerate API key.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
    toast.success("API key copied to clipboard!");
  };

  const removeSavedProduct = async (productId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_BASEURL}/api/user/saved-products/${productId}`,
        {
          data: { email: user.email },
        }
      );
      setSavedProducts((products) =>
        products.filter((p) => p.productId !== productId)
      );
      toast.success("Product removed successfully.");
    } catch (error) {
      console.error("Error removing saved product:", error);
      toast.error("Failed to remove product.");
    }
  };

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("/uploads/")) return url;
    if (url.startsWith("//")) return `https:${url}`;
    return url;
  };

  // EditForm Component
  const getFollowersByEmails = async () => {
    const emails = stats.followers;
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/user/getUsersDetail`,
        { emails }
      );
      debugger;
      setFollowers(response.data.data);
      setIsFollowerModalOpen(true);
    } catch (error) {
      console.error("Error fetching followers by emails:", error);
    }
  };
  const getFavouritesByEmails = async () => {
    const emails = stats.followers;
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/user/getUsersDetail`,
        { emails }
      );
      debugger;
      setFavourites(response.data.data);
      setIsFollowerModalOpen(true);
    } catch (error) {
      console.error("Error fetching followers by emails:", error);
    }
  };
  const EditForm = ({ product, onClose, onUpdate }) => {
    const { user } = useAuth();
    const [categories, setCategories] = useState([]);
    const [uploadType, setUploadType] = useState("url");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Initialize form state with the product data
    const [formData, setFormData] = useState({
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      imageFile: null,
      category: product.category,
      subcategory: product.subcategory || "",
      secondSubcategory: product.secondSubcategory || "",
      withVendor: product.withVendor || [],
      videoUrl: product.videoUrl || "",
    });

    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_BASEURL}/api/admin/categories`,
            {
              params: { email: process.env.REACT_APP_ADMIN_EMAIL, userEmail: user.email },
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

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
      if (e.target.files[0]) {
        setFormData((prev) => ({ ...prev, imageFile: e.target.files[0] }));
      }
    };

    const handleCategorySave = (category, subcategory, secondSubcategory) => {
      setFormData((prev) => ({
        ...prev,
        category,
        subcategory: subcategory || "",
        secondSubcategory: secondSubcategory || "",
      }));
      setIsCategoryModalOpen(false);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setUploading(true);
      setError("");
      setSuccess("");

      try {
        const submitData = new FormData();
        submitData.append("title", formData.title);
        submitData.append("price", formData.price);
        submitData.append("category", formData.category);
        submitData.append("subcategory", formData.subcategory || "");
        submitData.append(
          "secondSubcategory",
          formData.secondSubcategory || ""
        );
        submitData.append("email", user.email);
        if (formData?.videoUrl?.trim().length > 0) {
          submitData.append("videoUrl", formData.videoUrl);
        }

        if (uploadType === "url") {
          submitData.append("imageUrl", formData.imageUrl);
        } else if (formData.imageFile) {
          submitData.append("image", formData.imageFile);
        }

        const response = await axios.put(
          `${process.env.REACT_APP_API_BASEURL}/api/user/saved-products/${product.productId}`,
          submitData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          setSuccess("Product updated successfully!");
          onUpdate();
          toast.success("Product updated successfully!");
          setTimeout(onClose, 1500);
        }
      } catch (err) {
        console.error("Error updating product:", err);
        setError(err.response?.data?.message || "Failed to update product.");
        toast.error(err.response?.data?.message || "Failed to update product.");
      } finally {
        setUploading(false);
      }
    };

    const getImageUrl = (url) => {
      if (!url) return "";
      if (url.startsWith("http") || url.startsWith("/uploads/")) return url;
      if (url.startsWith("//")) return `https:${url}`;
      return url;
    };

    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.div
            className="relative w-full max-w-2xl bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-2xl font-bold text-white">Edit Product</h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {error && (
                <div className="p-3 mb-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 mb-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm">
                  {success}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    Title<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    Price<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-gray-200 text-sm font-medium mb-1 sm:mb-2">
                    Video URL
                  </label>
                  <input
                    type="text"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleChange}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 focus:border-[#2ab6e4] focus:ring-2 focus:ring-[#2ab6e4]/30 outline-none transition-all text-sm sm:text-base"
                    placeholder="Enter video URL"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-1">
                    Category<span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={`${formData.category}${
                        formData.subcategory ? ` > ${formData.subcategory}` : ""
                      }${
                        formData.secondSubcategory
                          ? ` > ${formData.secondSubcategory}`
                          : ""
                      }`}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none truncate"
                      readOnly
                      placeholder="No category selected"
                      title={`${formData.category}${
                        formData.subcategory ? ` > ${formData.subcategory}` : ""
                      }${
                        formData.secondSubcategory
                          ? ` > ${formData.secondSubcategory}`
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          category: "",
                          subcategory: "",
                          secondSubcategory: "",
                        }))
                      }
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="px-4 py-2 bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white rounded-lg hover:shadow-lg hover:shadow-[#2ab6e4]/20 transition-all"
                    >
                      Select
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-300 text-sm font-medium">
                    Update Image
                  </label>
                  <div className="flex gap-4 mb-2">
                    <button
                      type="button"
                      onClick={() => setUploadType("url")}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        uploadType === "url"
                          ? "bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white"
                          : "bg-gray-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      From URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadType("file")}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        uploadType === "file"
                          ? "bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white"
                          : "bg-gray-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      Upload File
                    </button>
                  </div>
                  {uploadType === "url" ? (
                    <div>
                      <input
                        type="url"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none"
                        placeholder="https://example.com/image.jpg"
                      />
                      {formData.imageUrl && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-400 mb-1">
                            Current Image:
                          </p>
                          <img
                            src={getImageUrl(formData.imageUrl)}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="file"
                        id="editImageFile"
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <label
                        htmlFor="editImageFile"
                        className="flex items-center justify-between w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 hover:border-[#2ab6e4] cursor-pointer"
                      >
                        <span className="flex items-center">
                          <Paperclip className="w-5 h-5 mr-2 text-gray-400" />
                          {formData.imageFile
                            ? formData.imageFile.name
                            : "Choose an image file"}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                          Browse
                        </span>
                      </label>
                      {formData.imageFile && (
                        <div className="mt-2">
                          <img
                            src={URL.createObjectURL(formData.imageFile)}
                            alt="Preview"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`px-5 py-2.5 rounded-lg flex items-center ${
                      uploading
                        ? "bg-gray-600 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:shadow-lg hover:shadow-[#2ab6e4]/20"
                    }`}
                  >
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Update Product
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
        <CategorySelectionModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleCategorySave}
          categories={categories}
        />
      </AnimatePresence>
    );
  };

  // CategorySelectionModal Component
  const CategorySelectionModal = ({ isOpen, onClose, onSave, categories }) => {
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const [selectedSecondSubCategory, setSelectedSecondSubCategory] =
      useState("");
    const [customSubCategory, setCustomSubCategory] = useState("");
    const [customSecondSubCategory, setCustomSecondSubCategory] = useState("");

    const handleAddSubcategory = async (categoryId) => {
      if (!customSubCategory) return;

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASEURL}/api/admin/categories/${categoryId}/subcategories`,
          { customSubCategory, email: user.email },
          { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
        );
        debugger;
        setCustomSubCategory(response.data.subcategory._id);
        return response.data;
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to add subcategory");
      }
    };

    const handleSave = async () => {
      let customSelectedSubCategory = "";
      let customSelectedSubCategoryId = "";
      let customSelectedSecondSubCategory = "";
      if (!selectedCategory) {
        toast.error("Please select a category");
        return;
      }
      if (selectedSubCategory === "-1" && !customSubCategory) {
        toast.error("Please enter a subcategory");
        return;
      }
      if (selectedSecondSubCategory === "-1" && !customSecondSubCategory) {
        toast.error("Please enter a second subcategory");
        return;
      }

      const category = categories.find((cat) => cat.name === selectedCategory);
      // const result = await handleAddSubcategory(category._id);
      const subCategoryExists = category.subcategories.some(
        (subcategory) => subcategory.name === selectedSubCategory
      );
      if (customSubCategory) {
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_BASEURL}/api/admin/categories/${category._id}/subcategories`,
            { subcategoryName: customSubCategory, email: user.email },
            { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
          );
          console.log(
            response.data.subcategories[response.data.subcategories.length - 1]
              ._id
          );
          customSelectedSubCategoryId =
            response.data.subcategories[response.data.subcategories.length - 1]
              ._id;
          customSelectedSubCategory =
            response.data.subcategories[response.data.subcategories.length - 1]
              .name;
        } catch (err) {
          toast.error(err.response?.data?.message || "Failed to add subcategory");
          return;
        }
      }

      if (customSecondSubCategory) {
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_BASEURL}/api/admin/categories/${category._id}/subcategories/${subCategoryExists ? subCategoryExists:  customSelectedSubCategoryId}/second-subcategories`,
            {
              secondSubcategoryName: customSecondSubCategory,
              email: user.email,
            },
            { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
          );
          debugger;
          customSelectedSecondSubCategory =
           selectedSubCategory === "-1" ? response.data.subcategories[
              response.data.subcategories.length - 1
            ].secondSubcategories[response.data.subcategories[
              response.data.subcategories.length - 1
            ].secondSubcategories.length - 1].name : response.data.subcategories.find((subcategory) => subcategory.name === selectedSubCategory).secondSubcategories[response.data.subcategories.find((subcategory) => subcategory.name === selectedSubCategory).secondSubcategories.length - 1].name;
        } catch (err) {
          toast.error(
            err.response?.data?.message ||
              "Failed to add second-level subcategory"
          );
          return;
        }
      }

      const subCategory =
        selectedSubCategory === "-1"
          ? customSelectedSubCategory
          : selectedSubCategory;
      const secondSubCategory =
        selectedSecondSubCategory === "-1"
          ? customSelectedSecondSubCategory
          : selectedSecondSubCategory;
      debugger;
      onSave(selectedCategory, subCategory, secondSubCategory);
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedSecondSubCategory("");
      onClose();
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gradient-to-b from-[#333333] to-[#222222] rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-700 transform transition-all animate-fadeIn">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Select Category
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Select Category<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubCategory("");
                        setSelectedSecondSubCategory("");
                      }}
                      className="w-full p-3 bg-[#333333] text-white rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none border border-gray-700 appearance-none transition-all"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>

                {/* Subcategory Selection */}
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Select Subcategory (Optional)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubCategory}
                      onChange={(e) => {
                        setSelectedSubCategory(e.target.value);
                        setSelectedSecondSubCategory("");
                      }}
                      className={`w-full p-3 bg-[#333333] text-white rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none border border-gray-700 appearance-none transition-all ${
                        !selectedCategory ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                      disabled={!selectedCategory}
                    >
                      <option value="">Select a subcategory</option>
                      {selectedCategory &&
                        categories
                          .find((cat) => cat.name === selectedCategory)
                          ?.subcategories.map((subcat) => (
                            <option key={subcat._id} value={subcat.name}>
                              {subcat.name}
                            </option>
                          ))}
                      <option value="-1">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>
                {selectedSubCategory === "-1" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Enter custom subcategory"
                      className="w-full p-3 bg-[#333333] text-white rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none border border-gray-700"
                      value={customSubCategory}
                      onChange={(e) => setCustomSubCategory(e.target.value)}
                    />
                  </div>
                )}
                {/* Second Subcategory Selection */}
                <div>
                  <label className="block text-gray-300 mb-2 text-sm font-medium">
                    Select Second Subcategory (Optional)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSecondSubCategory}
                      onChange={(e) =>
                        setSelectedSecondSubCategory(e.target.value)
                      }
                      className={`w-full p-3 bg-[#333333] text-white rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none border border-gray-700 appearance-none transition-all ${
                        !selectedSubCategory
                          ? "opacity-60 cursor-not-allowed"
                          : ""
                      }`}
                      disabled={!selectedSubCategory}
                    >
                      <option value="">Select a second subcategory</option>
                      {selectedSubCategory &&
                        categories
                          .find((cat) => cat.name === selectedCategory)
                          ?.subcategories.find(
                            (sub) => sub.name === selectedSubCategory
                          )
                          ?.secondSubcategories.map((secondSubcat) => (
                            <option
                              key={secondSubcat._id}
                              value={secondSubcat.name}
                            >
                              {secondSubcat.name}
                            </option>
                          ))}
                      <option value="-1">Other</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>
                {selectedSecondSubCategory === "-1" && (
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Enter custom second subcategory"
                      className="w-full p-3 bg-[#333333] text-white rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none border border-gray-700"
                      value={customSecondSubCategory}
                      onChange={(e) =>
                        setCustomSecondSubCategory(e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white rounded-lg flex items-center hover:shadow-lg hover:shadow-[#2ab6e4]/20 transition-all"
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  // AddProductModal Component
  const AddProductModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
      title: "",
      description: "",
      price: "",
      category: "",
      subcategory: "",
      secondSubcategory: "",
      location: "",
      detailUrl: "",
      videoUrl: "",
    });
    const [images, setImages] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_BASEURL}/api/admin/categories`,
            {
              params: { email: user.email },
            }
          );
          setCategories(response.data.categories || []);
        } catch (error) {
          console.error("Error fetching categories:", error);
          toast.error("Failed to load categories", {
            position: "center",
            duration: 3000,
          });
        }
      };

      if (isOpen) {
        fetchCategories();
      }
    }, [isOpen]);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
      if (e.target.files[0]) {
        setImages(e.target.files[0]);
      }
    };

    const handleCategorySave = (category, subcategory, secondSubcategory) => {
      setFormData((prev) => ({
        ...prev,
        category,
        subcategory: subcategory || "",
        secondSubcategory: secondSubcategory || "",
      }));
      setIsCategoryModalOpen(false);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setModalLoading(true);

      if (!formData.category) {
        toast.error("Please select a category", {
          position: "center",
          duration: 3000,
        });
        setModalLoading(false);
        return;
      }

      try {
        const submitData = new FormData();
        submitData.append("title", formData.title);
        submitData.append("description", formData.description);
        submitData.append("price", formData.price);
        submitData.append("category", formData.category);
        submitData.append("subcategory", formData.subcategory || "");
        submitData.append(
          "secondSubcategory",
          formData.secondSubcategory || ""
        );
        submitData.append("location", formData.location);
        submitData.append("detailUrl", formData.detailUrl);
        submitData.append("email", user.email);
        if (formData?.videoUrl?.trim().length > 0) {
          submitData.append("videoUrl", formData.videoUrl);
        }
        if (images) {
          submitData.append("image", images);
        }

        const response = await axios.post(
          `${process.env.REACT_APP_API_BASEURL}/api/user/saved-products`,
          submitData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          toast.success("Product added successfully!", {
            position: "center",
            duration: 2000,
          });
          setSavedProducts((prev) => [...prev, response.data.product]);
          setFormData({
            title: "",
            description: "",
            price: "",
            category: "",
            subcategory: "",
            secondSubcategory: "",
            location: "",
            detailUrl: "",
            videoUrl: "",
          });
          setImages(null);
          setTimeout(() => {
            onClose();
            fetchDashboardData();
          }, 2000);
        }
      } catch (err) {
        if (err?.response?.data?.reason === "token") {
          navigate("/pricing?error=Upgrade Plan or Buy Tokens");
        } else {
          toast.error(err?.response?.data?.error || "An error occurred");
        }
      } finally {
        setModalLoading(false);
      }
    };

    const modalVariants = {
      hidden: { scale: 0.95, opacity: 0, y: 20 },
      visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      },
      exit: { scale: 0.95, opacity: 0, y: 20, transition: { duration: 0.2 } },
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-16 sm:pt-0 px-4 sm:px-6 overflow-y-auto"
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                className="relative w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700/50 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
                variants={modalVariants}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-gray-700/50 sticky top-0 bg-gradient-to-br from-gray-800 to-gray-900 z-10">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-[#a017c9] to-[#2ab6e4]">
                    Add New Product
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700/50 transition-all"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
                <div className="p-4 sm:p-5 md:p-6 lg:p-8">
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-5"
                  >
                    <div>
                      <label className="block text-gray-200 text-sm font-medium mb-1 sm:mb-2">
                        Title<span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700/ pacj
                        50 text-white rounded-lg border bg-gray-700/50 focus:border-[#2ab6e4] focus:ring-2 focus:ring-[#2ab6e4]/30 outline-none transition-all text-sm sm:text-base"
                        required
                        placeholder="Enter product title"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-200 text-sm font-medium mb-1 sm:mb-2">
                        Description<span className="text-red-400">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 focus:border-[#2ab6e4] focus:ring-2 focus:ring-[#2ab6e4]/30 outline-none transition-all text-sm sm:text-base"
                        required
                        placeholder="Describe your product"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-200 text-sm font-medium mb-1 sm:mb-2">
                        Price<span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 focus:border-[#2ab6e4] focus:ring-2 focus:ring-[#2ab6e4]/30 outline-none transition-all text-sm sm:text-base"
                        required
                        min="0"
                        step="0.01"
                        placeholder="Enter price"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-200 text-sm font-medium mb-1 sm:mb-2">
                        Video URL
                      </label>
                      <input
                        type="text"
                        name="videoUrl"
                        value={formData.videoUrl}
                        onChange={handleChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 focus:border-[#2ab6e4] focus:ring-2 focus:ring-[#2ab6e4]/30 outline-none transition-all text-sm sm:text-base"
                        placeholder="Enter video URL"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-200 text-sm font-medium mb-1 sm:mb-2">
                        Category<span className="text-red-400">*</span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <input
                          type="text"
                          value={`${formData.category}${
                            formData.subcategory
                              ? ` > ${formData.subcategory}`
                              : ""
                          }${
                            formData.secondSubcategory
                              ? ` > ${formData.secondSubcategory}`
                              : ""
                          }`}
                          className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 focus:border-[#2ab6e4] outline-none truncate text-sm sm:text-base"
                          readOnly
                          placeholder="No category selected"
                          title={`${formData.category}${
                            formData.subcategory
                              ? ` > ${formData.subcategory}`
                              : ""
                          }${
                            formData.secondSubcategory
                              ? ` > ${formData.secondSubcategory}`
                              : ""
                          }`}
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                category: "",
                                subcategory: "",
                                secondSubcategory: "",
                              }))
                            }
                            className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 bg-gray-600/50 text-gray-200 rounded-lg hover:bg-gray-500/50 transition-all text-sm sm:text-base"
                          >
                            Clear
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="flex-1 sm:flex-none px-3 py-2 sm:px-4 sm:py-2 bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white rounded-lg hover:shadow-lg hover:shadow-[#2ab6e4]/20 transition-all text-sm sm:text-base"
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-200 text-sm font-medium mb-1 sm:mb-2">
                        URL
                      </label>
                      <input
                        type="text"
                        name="detailUrl"
                        value={formData.detailUrl}
                        onChange={handleChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 focus:border-[#2ab6e4] focus:ring-2 focus:ring-[#2ab6e4]/30 outline-none transition-all text-sm sm:text-base"
                        placeholder="Enter product URL"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-200 text-sm font-medium mb-1 sm:mb-2">
                        Location<span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 focus:border-[#2ab6e4] focus:ring-2 focus:ring-[#2ab6e4]/30 outline-none transition-all text-sm sm:text-base"
                        required
                        placeholder="Enter location"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400">
                        Source URL
                      </label>
                      <input
                        type="text"
                        value={formData.sourceUrl}
                        name="sourceUrl"
                        onChange={handleChange}
                        readOnly
                        className="w-full px-3 py-2 text-white bg-gray-600 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-200 text-sm font-medium mb-1 sm:mb-2">
                        Upload Image
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id="image"
                          onChange={handleFileChange}
                          className="hidden"
                          accept="image/*"
                        />
                        <label
                          htmlFor="image"
                          className="flex items-center justify-between w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 hover:border-[#2ab6e4] cursor-pointer transition-all text-sm sm:text-base"
                        >
                          <span className="flex items-center truncate">
                            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-400" />
                            {images ? images.name : "Choose an image"}
                          </span>
                          <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                            Browse
                          </span>
                        </label>
                      </div>
                      {images && (
                        <div className="mt-3">
                          <img
                            src={URL.createObjectURL(images)}
                            alt="Preview"
                            className="max-h-32 sm:max-h-40 w-auto rounded-lg shadow-md"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 sm:px-5 sm:py-2.5 bg-gray-700/50 text-gray-200 rounded-lg hover:bg-gray-600/50 transition-all text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={modalLoading}
                        className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg flex items-center gap-2 transition-all text-sm sm:text-base ${
                          modalLoading
                            ? "bg-gray-600/50 cursor-not-allowed"
                            : "bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:shadow-lg hover:shadow-[#2ab6e4]/20"
                        }`}
                      >
                        {modalLoading ? (
                          <>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                            Add Product
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
            <CategorySelectionModal
              isOpen={isCategoryModalOpen}
              onClose={() => setIsCategoryModalOpen(false)}
              onSave={handleCategorySave}
              categories={categories}
            />
          </>
        )}
      </AnimatePresence>
    );
  };

  // AddByUrlModal Component
  const AddByUrlModal = ({ isOpen, onClose }) => {
    const [url, setUrl] = useState("");
    const [modalLoading, setModalLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e) => {
      e.preventDefault();
      setModalLoading(true);
      setError("");
      setSuccess("");
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASEURL}/api/user/saved-products-by-url`,
          {
            url,
            email: user.email,
          }
        );

        if (response.data.success) {
          setSuccess("Product added successfully!");
          setSavedProducts((prev) => [...prev, response.data.product]);
          setUrl("");
          toast.success("Product added successfully!");
          setTimeout(() => {
            onClose();
            fetchDashboardData();
          }, 1500);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to add product from URL."
        );
        if (err.response?.data?.reason === "token") {
          navigate("/pricing?error=Upgrade Plan or Buy Tokens");
        } else {
          toast.error(
            err.response?.data?.message || "Failed to add product from URL."
          );
        }
      } finally {
        setModalLoading(false);
      }
    };

    const modalVariants = {
      hidden: { scale: 0.8, opacity: 0, y: 50 },
      visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      },
      exit: {
        scale: 0.8,
        opacity: 0,
        y: 50,
        transition: { type: "spring", stiffness: 300, damping: 25 },
      },
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/*
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                className="relative w-full max-w-md bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl shadow-xl border border-gray-700"
                variants={modalVariants}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <h3 className="text-2xl font-bold text-white">Add Product by URL</h3>
                  <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-5">
                  {error && (
                    <div className="p-3 mb-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-3 mb-4 bg-green-900/30 border border-green-700 rounded-lg text-green-400 text-sm">
                      {success}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm font-medium mb-1">Product URL<span className="text-red-500">*</span></label>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-[#2ab6e4] focus:outline-none"
                        placeholder="https://example.com/product"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={modalLoading}
                        className={`px-6 py-2 rounded-lg flex items-center ${modalLoading ? 'bg-gray-600' : 'bg-gradient-to-r from-[#a017c9] to-[#2ab6e4]'}`}
                      >
                        {modalLoading ? (
                          <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                        ) : 'Save and Publish'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </motion.div>
            */}
          </>
        )}
      </AnimatePresence>
    );
  };

  if (loading || loadingPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
      </div>
    );
  }

  if (errorPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-red-400">
        <p>{errorPlan}</p>
      </div>
    );
  }
  console.log("keyResponse.data.stats", stats);

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container px-4 py-4 mx-auto sm:py-6 md:py-8">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            User Dashboard
          </h1>
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-4 py-2 text-sm text-gray-300 transition-colors border rounded-lg sm:w-auto border-[#2ab6e4] hover:text-white sm:text-base"
          >
            Back to Home
          </Link>
        </div>
        <div className="flex justify-between">
          <div className="grid grid-cols-2 gap-2 mb-6 sm:flex sm:gap-4 sm:mb-8">
            <button
              onClick={() => setActiveTab("savedProducts")}
              className={`px-4 py-2 text-sm sm:px-6 sm:text-base rounded-lg transition-colors ${
                activeTab === "savedProducts"
                  ? "bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Saved Products
            </button>
            <button
              onClick={() => setActiveTab("apiKey")}
              className={`px-4 py-2 text-sm sm:px-6 sm:text-base rounded-lg transition-colors ${
                activeTab === "apiKey"
                  ? "bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              API Key
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 text-sm sm:px-6 sm:text-base rounded-lg transition-colors ${
                activeTab === "chat"
                  ? "bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Chat History
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6 sm:flex sm:gap-4 sm:mb-8">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 text-sm text-white transition-colors bg-gray-700 rounded-lg hover:bg-gray-600 sm:text-base"
            >
              Add Manually
            </button>
            <button
              onClick={() => setIsUrlModalOpen(true)}
              className="px-4 py-2 text-sm text-white transition-colors bg-gray-700 rounded-lg hover:bg-gray-600 sm:text-base"
            >
              Add by Link
            </button>
          </div>
        </div>

        {activeTab === "apiKey" && (
          <div className="p-4 bg-gray-800 rounded-xl sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl sm:mb-6">
              Your API Key
            </h2>
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:gap-4 sm:mb-6">
              <div className="flex-1 p-3 overflow-x-auto font-mono bg-gray-900 rounded-lg sm:p-4 whitespace-nowrap">
                <code className="text-sm text-[#2ab6e4] sm:text-base">
                  {apiKey}
                </code>
              </div>
              <div className="flex gap-2 sm:gap-4">
                <button
                  onClick={() => copyToClipboard(apiKey)}
                  className="flex-1 p-3 transition-colors bg-gray-700 rounded-lg sm:flex-none hover:bg-gray-600"
                  title="Copy API Key"
                >
                  <Copy className="w-5 h-5 mx-auto text-white" />
                </button>
                <button
                  onClick={regenerateApiKey}
                  className="flex-1 p-3 transition-colors bg-gray-700 rounded-lg sm:flex-none hover:bg-gray-600"
                  title="Regenerate API Key"
                >
                  <RefreshCw className="w-5 h-5 mx-auto text-white" />
                </button>
              </div>
            </div>
            {copySuccess && (
              <p className="text-sm text-green-500">Copied to clipboard!</p>
            )}
            <div className="mt-6 space-y-4 sm:mt-8">
              <h3 className="text-base font-medium text-white sm:text-lg">
                API Usage
              </h3>
              <div className="p-3 space-y-3 font-mono text-xs bg-gray-900 rounded-lg sm:p-4 sm:text-sm">
                <p className="text-gray-400">Base URL:</p>
                <code className="block overflow-x-auto text-[#2ab6e4] whitespace-nowrap">
                  {process.env.REACT_APP_API_BASEURL}
                </code>
                <p className="mt-4 text-gray-400">Endpoints:</p>
                <code className="block overflow-x-auto text-[#2ab6e4] whitespace-nowrap">
                  GET /saved-products - Get all saved products
                </code>
                <p className="text-xs text-gray-500 sm:text-sm">
                  Headers required:
                </p>
                <code className="block ml-4 overflow-x-auto text-green-500 whitespace-nowrap">
                  x-api-key: YOUR_API_KEY
                </code>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center mb-8 gap-5">
          <button className="flex items-center px-6 py-2 text-base text-white transition-colors border border-gray-400 rounded-lg">
            Likes {numberToKMG(stats?.favourites?.length || 0)}
          </button>
          <button
            className="flex items-center px-6 py-2 text-base text-white transition-colors border border-gray-400 rounded-lg"
            onClick={getFollowersByEmails}
          >
            Followers {numberToKMG(stats?.followers?.length || 0)}
          </button>
        </div>
        {activeTab === "chat" && <ChatHistory />}

        {activeTab === "savedProducts" && (
          <>
            <div className="p-4 bg-gray-800 rounded-xl sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                <h2 className="mb-4 sm:mb-0 text-lg font-semibold text-white sm:text-xl">
                  Saved Products
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
                {savedProducts.map((product) => (
                  <div
                    key={product.productId}
                    className="relative overflow-hidden bg-gray-800 rounded-xl hover:ring-2 hover:ring-[#2ab6e4] transition-all"
                  >
                    <div className="relative">
                      <img
                        src={getImageUrl(
                          product.images?.[0] || product.imageUrl
                        )}
                        alt={product.title}
                        className="object-cover w-full aspect-square"
                      />
                      <div className="absolute flex gap-2 top-2 right-2">
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setUpdateForm({
                              title: product.title,
                              price: product.price,
                              imageUrl: product.imageUrl,
                              withVendor: product.withVendor || [],
                            });
                          }}
                          className="p-2 transition-colors bg-blue-500 rounded-full hover:bg-blue-600"
                        >
                          <Edit2 className="w-5 h-5 text-white" />
                        </button>
                        <a
                          href={product.detailUrl}
                          className="p-2 transition-colors bg-blue-5
                        00 rounded-full hover:bg-blue-600"
                        >
                          <ExternalLink className="w-5 h-5 text-white" />
                        </a>
                        <button
                          onClick={() => removeSavedProduct(product.productId)}
                          className="p-2 transition-colors bg-red-500 rounded-full hover:bg-red-600"
                        >
                          <Trash2 className="w-5 h-5 text-white" />
                        </button>
                      </div>
                      <div className="absolute top-14 right-2">
                        <span className="px-2 py-0.5 rounded text-white">
                          {product?.favourites?.length
                            ? numberToKMG(product?.favourites?.length)
                            : ""}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="mb-2 font-semibold text-white line-clamp-2">
                        {product.title}
                      </h4>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <p className="text-[#2ab6e4] font-bold text-xl">
                            $
                            {product.price
                              ? parseFloat(product.price).toFixed(2)
                              : "0.00"}
                          </p>
                        </div>
                        <p className="text-sm text-gray-400">
                          {product.seller}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center text-sm">
                          <span className="text-gray-400">Category:</span>
                          <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-white">
                            {product.category}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="text-gray-400">Subcategory:</span>
                          <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-white">
                            {product.subcategory}
                          </span>
                        </div>
                        {product.secondSubcategory && (
                          <div className="flex items-center text-sm">
                            <span className="text-gray-400">
                              Sub Typecategory:
                            </span>
                            <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-white">
                              {product.secondSubcategory}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-sm mt-4">
                        <div className="flex gap-2">
                          {/* <span className="text-sm text-gray-400">
                            {numberToKMG(product.viewsCount * 5)} Views
                          </span>
                          <span className="text-sm text-gray-400">
                            {numberToKMG(product.followersCount)} Followers
                          </span> */}
                          <ProfileImageGroup
                            followersCount={product.followersCount}
                          />
                        </div>
                        <button
                          onClick={() => {
                            setIsOpen(true);
                            setProduct(product);
                          }}
                          className="px-4 py-2 text-white transition-all rounded bg-[#2ab6e4] hover:bg-[#2ab6e4]/80 disabled:opacity-50 hover:scale-105"
                        >
                          Create
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {savedProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 sm:py-12">
                  <p className="text-sm sm:text-base">No saved products yet</p>
                  <Link
                    to="/"
                    className="mt-3 text-sm sm:text-base sm:mt-4 text-[#2ab6e4] hover:underline"
                  >
                    Browse products
                  </Link>
                </div>
              )}
              <AddProductModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
              />
              <AddByUrlModal
                isOpen={isUrlModalOpen}
                onClose={() => setIsUrlModalOpen(false)}
              />
              <SearchForm
                open={isUrlModalOpen}
                openSet={() => setIsUrlModalOpen(false)}
                email={user.email}
                fetchSavedProducts={fetchDashboardData}
              />

              {editingProduct && (
                <EditForm
                  product={editingProduct}
                  onClose={() => setEditingProduct(null)}
                  onUpdate={fetchDashboardData}
                />
              )}
            </div>

            <EditImage
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              product={product}
              fetchSavedProducts={fetchDashboardData}
              updateBy={"user"}
              email={user.email}
            />
          </>
        )}
        <FollowerModal
          data={followers}
          isOpen={isFollowerModalOpen}
          onClose={() => setIsFollowerModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default UserDashboard;
