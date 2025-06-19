import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft, AlertCircle, ImageOff } from "lucide-react";
import axios from "axios";
import { Link } from "react-router-dom";
import ContactModal from "../components/Modals/ContactModal";
import { useAuth } from "../contexts/AuthContext";

import { useNavigate } from 'react-router-dom';
import BuyerContactModal from './../components/Modals/BuyerContactModal'; // Adjust the path as needed
const CustomBuilderPage = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const navigate = useNavigate();
  const [isBuyerContactModalOpen, setIsBuyerContactModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASEURL}/api/admin/custom-builder/images`,
          { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
        );
        setImages(response.data.images || []);
        setError(null);
      } catch (err) {
        setError("Failed to fetch images");
        console.error("Error fetching images:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  // Reset image load error when changing images
  useEffect(() => {
    setImageLoadError(false);
    
    // Preload the current image to check if it loads correctly
    if (images[currentImageIndex] && images[currentImageIndex].Image) {
      const img = new Image();
      img.onerror = () => setImageLoadError(true);
      img.src = images[currentImageIndex].Image;
    }
  }, [currentImageIndex, images]);

  const handlePrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  // Validate image URL
  const isValidImageUrl = (url) => {
    if (!url) return false;
    
    // More comprehensive validation
    const hasValidExtension = url.match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)$/i) !== null;
    const hasValidProtocol = url.startsWith('http') || url.startsWith('https') || url.startsWith('data:image');
    const hasNoBlackListedTerms = !url.includes('undefined') && !url.includes('null');
    
    return hasValidExtension || (hasValidProtocol && hasNoBlackListedTerms);
  };

  const getCurrentImageUrl = () => {
    if (!images[currentImageIndex] || !images[currentImageIndex].Image) {
      return null;
    }
    return images[currentImageIndex].Image;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="p-4 bg-red-900/60 rounded-lg text-white max-w-md text-center">
          <p className="text-xl mb-2">Error</p>
          <p>{error}</p>
          <Link to="/" className="mt-4 inline-block px-4 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
        <div className="p-6 bg-gray-800 rounded-lg text-center max-w-md">
          <p className="text-xl text-white mb-3">No custom designs available yet</p>
          <p className="text-gray-400 mb-4">Check back soon for new additions</p>
          <Link to="/" className="inline-block px-4 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Main Fullscreen Image Area */}
      <div className="absolute inset-0">
        {/* Show this when image can't be loaded */}
        {(imageLoadError || !isValidImageUrl(getCurrentImageUrl())) ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-white">
            <ImageOff className="w-16 h-16 mb-4 text-gray-400" />
            <p className="text-xl">Image could not be displayed</p>
            <p className="text-gray-400 mt-2">The image may be corrupted or in an unsupported format</p>
          </div>
        ) : (
          <div 
            className="absolute inset-0 bg-center bg-no-repeat" 
            style={{
              backgroundImage: `url("${getCurrentImageUrl()}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              imageRendering: 'auto',
              backgroundColor: '#000',
            }}
          />
        )}
      </div>
      
      {/* Black overlay to ensure controls are visible */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

     {/* Back and Inquiry Buttons - Floating in top left over image */}
<div className="absolute top-6 left-6 z-50 flex items-center space-x-4">
  <Link
    to="/"
    className="flex items-center px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg text-white hover:bg-black/70 transition-colors"
  >
    <ArrowLeft className="w-5 h-5 mr-2" />
    <span>Back</span>
  </Link>
  
  <button
    onClick={() => setIsBuyerContactModalOpen(true)}
    className="px-4 py-2 bg-[#2ab6e4]/80 backdrop-blur-sm rounded-lg text-white hover:bg-[#2ab6e4] transition-colors"
  >
    Inquiry
  </button>
</div>
      

      {/* Warning message if needed */}
      {imageLoadError && (
        <div className="absolute top-6 right-6 z-50 flex items-center px-4 py-2 bg-red-500/70 backdrop-blur-sm rounded-lg text-white">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error loading image</span>
        </div>
      )}

      {/* Large Navigation Buttons on the sides */}
      {/* Left Navigation Button */}
      {currentImageIndex > 0 && (
        <button 
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-4 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Right Navigation Button */}
      {currentImageIndex < images.length - 1 && (
        <button 
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-4 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Small Image Counter in bottom corner */}
      

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
      {/* Buyer Contact Modal */}
<BuyerContactModal
  isOpen={isBuyerContactModalOpen}
  onClose={() => setIsBuyerContactModalOpen(false)}
  mode="builder-inquiry"
/>
    </div>
  );
};

export default CustomBuilderPage; 