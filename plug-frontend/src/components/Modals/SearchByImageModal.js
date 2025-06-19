import React, { useState, useRef } from "react";
import { X, Image, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
const LoginModal = ({
  isOpen,
  onClose,
  onLogin,
  setProduct,
  setaiProducts,
}) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchByImageRef = useRef(null);
  const [isOn, setIsOn] = useState(false);
  const { user, updateUser } = useAuth();

  const imageSearchClick = () => {
    if (!user) {
      onClose();
      onLogin();
    } else if (
      user?.subscription === "free" &&
      (user?.subscriptionDetails?.searchByImageCount || 0) >= 2
    ) {
      setError("Please upgrade your plan!");
    } else {
      searchByImageRef &&
        searchByImageRef.current &&
        searchByImageRef.current.click();
    }
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const formData = new FormData();
      if (!isOn) {
        formData.append("image", file);
        formData.append("email", user?.email);
        const response = await axios.post("/api/ai/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        if (response.data) {
          setaiProducts(response.data);
          setProduct([]);
          onClose();
        }
      } else {
        formData.append("image", file);
        formData.append("email", user?.email);
        const response = await axios.post("/api/user/searchbyimage", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        if (response?.data?.subscriptionDetails) {
          updateUser({
            subscriptionDetails: response.data.subscriptionDetails,
          });
        }
        console.log(response?.data?.products);
        setProduct(response?.data?.products);
        setaiProducts([]);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      console.error("Error:", err);
    } finally {
      setLoading(false);
      searchByImageRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative flex w-full max-w-6xl overflow-hidden bg-gray-900 shadow-2xl rounded-2xl"
        >
          <div className="w-full p-8">
            <div className="flex items-start justify-between mb-8 w-full">
              <div className="w-full">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center w-max h-12 mb-4 w-full"
                >
                  <img
                    src="/logo.png"
                    className="h-[30px] sm:h-[50px]font-bold bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-transparent bg-clip-text"
                  />
                </motion.div>
                <div className="w-full flex justify-between">
                  {user?.subscription === "free" && (
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-2 text-red-500 rounded-lg hidden"
                    >
                      <AlertCircle className="inline-block  w-4 h-4 mr-1" />{" "}
                      Five free image searches are included; subscribe for
                      unlimited use!
                    </motion.p>
                  )}
                  {user?.subscription === "free" && (
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold text-gray-400 hidden"
                    >
                      Search left :{" "}
                      <span className="bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-transparent bg-clip-text">
                        {5 -
                          (user?.subscriptionDetails?.searchByImageCount || 0)}
                      </span>
                    </motion.p>
                  )}
                </div>
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="p-2 text-gray-400 transition-colors rounded-full hover:bg-gray-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
            <div className="w-full flex justify-center">
              {error && (
                <p className="mt-2 text-red-500 rounded-lg">
                  <AlertCircle className="inline-block  w-4 h-4 mr-1" /> {error}
                </p>
              )}
            </div>

            <motion.form
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              onSubmit={(e) => e.preventDefault()}
              className="space-y-6"
            ></motion.form>
            <p className="mx-auto my-4 text-3xl text-gray-500 w-max text-center">
              {" "}
              Unlock the Best Deals with Mia, Your AI Shopping Expert!
            </p>
            <div
              className={`w-4/5 md:w-[500px] mx-auto h-max flex items-center bg-gray-800 rounded-full  cursor-pointer transition relative`}
              onClick={() => setIsOn(!isOn)}
            >
              <div
                className={`w-1/2 h-full absolute text-lg font-semibold bg-gradient-to-r from-[#9f17c975] to-[#2ab6e4] rounded-full shadow-md transform transition ${
                  !isOn ? " translate-x-0 " : " translate-x-full left-0"
                }`}
              ></div>

              <span
                className={`${
                  isOn ? "text-gray-400" : "text-gray-200"
                } w-1/2 z-10 text-center py-1`}
              >
                Local
              </span>
              <span
                className={`${
                  !isOn ? "text-gray-400" : "text-gray-200"
                } w-1/2 z-10 text-center py-1`}
              >
                International
              </span>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 text-sm text-center text-gray-400 flex flex-col items-center gap-5"
            >
              <input
                type="file"
                alt="search by image input"
                className="hidden"
                ref={searchByImageRef}
                accept="image/*"
                multiple={false}
                onChange={(e) => handleImageChange(e)}
              />
              Choose Image from this device.
              {loading ? (
                <div className="flex items-center justify-center h-auto text-[#0b121f] rounded-full ">
                  <SkeletonTheme
                    baseColor="transparent"
                    highlightColor="rgba(39, 42, 49, 0.655)"
                  >
                    <div className="flex flex-col items-center justify-center w-[800px] mx-auto rounded-full ">
                      <p className="min-w-20 relative p-2 rounded-full overflow-hidden  ">
                        <span className="relative z-10 text-gray-500">
                          "Hang tight, Mia’s on the hunt for the best discounts
                          on your products!"
                        </span>
                        <span className="absolute top-0 left-0 w-full h-full">
                          <Skeleton height={35} />
                        </span>
                      </p>
                    </div>
                  </SkeletonTheme>
                </div>
              ) : (
                <button
                  onClick={(e) => imageSearchClick()}
                  className="text-[#2ab6e4] hover:text-[#a017c9] transition-colors"
                >
                  <Image size={50} className="mb-8" />
                </button>
              )}
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LoginModal;
