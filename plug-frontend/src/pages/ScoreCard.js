import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Star from "../assets/img/Star.png";
import axios from "axios";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const ScoreCard = () => {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const similarItems = [
    { id: 1, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 2, image: "https://via.placeholder.com/150", isUnderValue: true },
    { id: 3, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 4, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 5, image: "https://via.placeholder.com/150", isUnderValue: true },
    { id: 6, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 7, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 8, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 9, image: "https://via.placeholder.com/150", isUnderValue: true },
    { id: 10, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 11, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 12, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 13, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 14, image: "https://via.placeholder.com/150", isUnderValue: false },
    { id: 15, image: "https://via.placeholder.com/150", isUnderValue: true },
    { id: 16, image: "https://via.placeholder.com/150", isUnderValue: false },
  ];

  const handleBackClick = () => {
    navigate(-1); // Goes back to the previous page in history
  };

  const { user } = useAuth();

  const location = useLocation();
  const props = location.state;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append("email", user?.email);
        if (props.image) {
          formData.append("image", props.image); // Append the image file to the form data
        }
        formData.append("prompt", props.prompt); // Append the prompt to the form data
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASEURL}/api/ai/find-price`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          }
        );
        setData(response?.data?.result);
        console.log("Data fetched successfully:", response.data);
      } catch (error) {
        // Handle error (e.g., show a toast notification)
        
        if (error?.response?.data?.reason === "token") {
          navigate("/pricing?error=Upgrade Plan or Buy Tokens");
        } else {
          toast.error(error?.response?.data?.error || "An error occurred");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };
    if (props) {
      fetchData();
    } else {
      navigate("/"); // Redirect to home if no data is found
    }
  }, []);

  const loadingMessages = [
    "Analyzing market conditions...",
    "Calculating true asset value...",
    "Running comparative valuation models...",
    "Cross-referencing historical data...",
    "Estimating real-time market worth...",
    "Researching global pricing trends...",
    "Synthesizing valuation intelligence...",
    "Verifying proprietary algorithms...",
    "Refining your custom estimate...",
    "Building accurate projections…",
    "Aligning with current market sentiment...",
    "Extracting relevant sales comparables...",
    "Auditing historical pricing data...",
    "Reviewing recent asset performance...",
    "Reconciling valuation assumptions...",
    "Calculating fair market positioning...",
    "Initiating portfolio sensitivity analysis...",
    "Assessing real-time demand indicators...",
    "Deriving net worth trajectory...",
    "Building precision-based valuation model...",
  ].map((text) => `${text}`);

  if (isLoading) {
    return (
      <div className="flex flex-col p-10 min-h-screen bg-[#001933] text-white">
        <AnimatePresence mode="wait">
          {loadingMessages.map((msg, index) => (
            <motion.p
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: index * 2 }}
              className="mt-2 text-gray-400"
            >
              {msg}
              <br />
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-[#001933] min-h-screen flex flex-col items-center px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="w-full py-4">
        <button
          onClick={handleBackClick}
          className="text-white text-sm hover:text-gray-300 transition-colors duration-200"
        >
          ← BACK
        </button>
      </div>

      {/* Color bar */}
      <div className="w-full ">
        <div className="grid grid-cols-5 gap-2 text-white text-xs sm:text-sm mb-6 bg-[#333333] py-2">
          <div className="flex flex-col items-center">
            <span className="text-center">OVER VALUE</span>
            <div className="bg-red-600 h-6 w-full mt-1"></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-center">VERY HIGH</span>
            <div className="bg-orange-500 h-6 w-full mt-1"></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-center">MARKET RATE</span>
            <div className="bg-blue-200 h-6 w-full mt-1"></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-center">EXCEPTIONAL DEAL</span>
            <div className="bg-gray-500 h-6 w-full mt-1"></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-center">UNDER VALUE</span>
            <div className="bg-green-500 h-6 w-full mt-1"></div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col py-4">
        {/* Description section */}
        <div
          className="rounded-lg text-white shadow-lg p-4 sm:p-6 mb-6"
          dangerouslySetInnerHTML={{ __html: data?.content }}
        />

        {/* Grid of similar items */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {similarItems.map((item) => (
            <div key={item.id} className="relative">
              <img
                src={item.image}
                alt={`House ${item.id}`}
                className="w-full h-40 sm:h-48 object-cover rounded-lg"
              />
              {item.isUnderValue && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  UNDER VALUE
                </div>
              )}
              <p className="text-white text-xs sm:text-sm mt-2">
                2014 - 4 Beds 2 Baths
              </p>
            </div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default ScoreCard;
