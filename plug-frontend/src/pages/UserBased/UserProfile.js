import { AnimatePresence, motion } from "framer-motion";

import { Link, useNavigate, useParams } from "react-router-dom";
import React, { useCallback, useEffect, useRef, useState } from "react";

import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { numberToKMG } from "../../utils/commons";
import FollowerModal from "./FollowerModal";
import RecommendationCard from "../../components/HomePage/RecommendationCard";

const UserProfile = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [savedProducts, setSavedProducts] = useState([]);
  const [loader, setLoader] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [errorPlan, setErrorPlan] = useState(null);

  const [stats, setStats] = useState({ favourites: [], followers: [] });
  const [followers, setFollowers] = useState([]);
  const [favorities, setFavourites] = useState([]);
  const [isFollowerModalOpen, setIsFollowerModalOpen] = useState(false);
  const { userId } = useParams();
  const [userProfile, setUserProfile] = useState({});
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setLoader(true);
      const [productsResponse, userResponse] = await Promise.all([
        axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/user/saved-products`,
          { params: { id: userId } }
        ),
        axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/user/getUserDetail`,
          { params: { id: userId } }
        ),

      ]);
      debugger
      setUserProfile(userResponse.data.data);
      setStats(productsResponse.data.stats);
      const filtered = productsResponse.data.products.filter(
        (p) => !p.category?.toLowerCase().includes("accessor")
      );
      setSavedProducts(filtered);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setErrorPlan("Unable to load dashboard data.");
    } finally {
      setLoader(false);
      setLoadingPlan(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user && !loading) {
      navigate("/login");
      return;
    }
    fetchDashboardData();
  }, [user, navigate, fetchDashboardData, loading]);

  
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

  if (loader || loadingPlan) {
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

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container px-4 py-4 mx-auto sm:py-6 md:py-8">
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between sm:mb-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            User Profile
          </h1>
          <Link
            to="/"
            className="inline-flex items-center justify-center w-full px-4 py-2 text-sm text-gray-300 transition-colors border rounded-lg sm:w-auto border-[#2ab6e4] hover:text-white sm:text-base"
          > Go Home</Link>
        </div>
                {/* Profile Section - Top and Center */}
        <div className="flex flex-col items-center justify-center mb-8 sm:mb-12">
          <motion.div
            className="flex flex-col items-center space-y-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Profile Image */}
            <div className="relative">
              <motion.div
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[#2ab6e4] shadow-lg"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {userProfile?.photourl ? (
                  <img
                    src={userProfile.photourl || "/placeholder.svg"}
                    alt={userProfile.fullName || "Profile"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        userProfile.fullName || "userProfile",
                      )}&background=2ab6e4&color=fff&size=200`
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2ab6e4] to-[#1a8fb3] flex items-center justify-center">
                    <span className="text-white text-2xl sm:text-3xl md:text-4xl font-bold">
                      {userProfile?.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </motion.div>
              {/* Online indicator */}
              {/* <div className="absolute bottom-2 right-2 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-gray-900"></div> */}
            </div>

            {/* User Name */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                {userProfile?.fullName || "User Name"}
              </h2>
              {/* <p className="text-gray-400 text-sm sm:text-base">@{user?.email?.split("@")[0] || "username"}</p> */}
            </motion.div>
          </motion.div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-start mb-8 gap-5">
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

        <>
          <div className="p-4 rounded-xl sm:p-6">
           
            {savedProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-2">
                {savedProducts.map((product, index) => (
                  <motion.div
                    key={product._id || index}
                    className="h-full"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    whileHover={{
                      scale: 1.03,
                      transition: { duration: 0.2 },
                    }}
                  >
                    <RecommendationCard
                      product={product}
                      setProducts={setSavedProducts}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-lg">
                No products found matching your search.
              </div>
            )}
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
          </div>
        </>
        <FollowerModal
          data={followers}
          isOpen={isFollowerModalOpen}
          onClose={() => setIsFollowerModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default UserProfile;
