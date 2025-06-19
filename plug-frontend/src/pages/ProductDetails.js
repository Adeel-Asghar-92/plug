import { AnimatePresence, motion } from "framer-motion"; // Combined imports
import { ArrowLeft, ExternalLink } from "lucide-react"; // Combined imports
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DirectContactModal from "../components/Modals/DirectContactModal";
import RecommendationCard from "../components/HomePage/RecommendationCard";
import TableRenderer from "../components/TableRenderer";
import axios from "axios";
import toast from "react-hot-toast";
import { storeViewedItems } from "../utils/localstorageUtils";
import { useAuth } from "../contexts/AuthContext";

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [data, setData] = useState(null);
    const { user } = useAuth();
  

  useEffect(() => {
    storeViewedItems(id);
  },[id])

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/product/productDetails/${id}`, {
          params: {
            email: user?.email
          }
        });
        setProduct(response.data);

        // Fetch related products
        const relatedResponse = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/products`,
          {
            params: {
              category: response.data.category,
              limit: 12, // Limit to 12 products
            },
            withCredentials: true,
          }
        );

        // Filter out the current product and limit to 12 products
        const filteredProducts = relatedResponse.data.products
          .filter((p) => p._id !== id)
          .slice(0, 12);

        setRelatedProducts(filteredProducts);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError("Failed to load product details."); // More user-friendly message
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingDetails(true);

      try {
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASEURL}/api/ai/find-product-price`,
          {
            id: product._id,
          },
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          }
        );
        setData(response?.data?.result);
      } catch (error) {
        toast.error(
          error?.response?.data?.error ||
            "An error occurred while fetching details."
        );
      } finally {
        setLoadingDetails(false);
      }
    };
    if (product) {
      fetchData();
    }
  }, [product]); // Dependency on product ensures this runs after product is set

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
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#333333]">
        <div className="w-12 h-12 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#333333] text-white">
        <p className="text-xl mb-4">{error || "Product not found."}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-[#4D4D4D] rounded text-white hover:bg-[#5D5D5D] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#333333]">
      <div className="mx-auto px-4 py-8 w-full">
        {" "}
        {/* Increased max-width for larger screens */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white mb-6 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="text-white" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-4">
            {/* Visit Link */}
            <div className="flex justify-end">
              {product?.detailUrl && (
                <a
                  href={product.detailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-center items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="flex items-center justify-center text-sm px-8 py-2 text-white gap-1 bg-blue-700 rounded-3xl hover:bg-blue-600 transition-colors">
                    Visit <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-5 mb-5 h-full">
          {" "}
          {/* Changed md:h-[70vh] to lg:h-[70vh] for consistency */}
          {/* Left Column - Product Image */}
          <div className="space-y-8 lg:w-[50vw] w-full h-full">
            {" "}
            {/* Adjusted md:w to lg:w */}
            <div className="relative h-full rounded-3xl overflow-hidden shadow-lg bg-gradient-to-br from-[#333] to-[#444] p-4">
              <div className="h-full bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-2xl overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover" // Ensures image covers the area
                />
              </div>
            </div>
          </div>
          {/* Right Column - Product Details and Description */}
          <div className="lg:w-[50vw] min-h-[60vh] h-full">
            {" "}
            {/* Adjusted md:w to lg:w */}
            <div className="bg-gradient-to-br min-h-[60vh] from-[#474747] to-[#353535] rounded-3xl p-2 shadow-2xl space-y-4 h-full flex flex-col">
              {" "}
              {/* Description - This section will have overflow-auto */}
              <div className="px-0 lg:px-4 xl:px-4 flex-grow flex flex-col justify-center">
                {" "}
                {/* Added flex-grow and custom-scrollbar */}
                {loadingDetails ? (
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
                ) : (
                  <TableRenderer data={data} />
                )}
              </div>
              {/* Inquiry CTA */}
              <div className="text-center mt-auto pt-4">
                {" "}
                {/* mt-auto to push button to bottom, pt-4 for spacing */}
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-medium py-2.5 px-8 rounded-full shadow-lg transition-all duration-300"
                >
                  Direct Contact
                </button>
              </div>
              <DirectContactModal
                isOpen={isContactModalOpen}
                onClose={() => setIsContactModalOpen(false)}
                product={product}
              />
            </div>
          </div>
        </div>
        {/* Related Products Section */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Similar Products
          </h2>

          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
              {" "}
              {/* Adjusted grid for better flow on various screens */}
              {relatedProducts.map((relatedProduct) => (
                <div key={relatedProduct._id}>
                  <RecommendationCard product={relatedProduct} setProducts={setRelatedProducts}/>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p>No similar products found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
