import { ExternalLink, Heart } from "lucide-react";

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useNavigate } from "react-router-dom";
import { numberToKMG } from "../../utils/commons";
import ProfileImageGroup from "../ProfileImageGroup ";
import axios from "axios";

const RecommendationCard = ({ product, setProducts }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const navigate = useNavigate();
  const { user } = useAuth();

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("/uploads/")) return url;
    if (url.startsWith("//")) return `https:${url}`;
    return url;
  };

  const getSourceUrl = () => {
    if (product.withVendor?.[0]?.sourceUrl)
      return product.withVendor[0].sourceUrl;
    return product.detailUrl || "#";
  };

  const formatPrice = (price) => {
    const numPrice = parseFloat(price);
    return isNaN(numPrice)
      ? "0.00"
      : numPrice.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    toggleFavorite(product, user);
  };

  const VIDEO_ID = product?.videoUrl?.split("/embed/")[1];

  const handleFollowClick = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/user/following`,
        {
          productId: product._id,
          email: user.email,
        }
      );

      if (response.data) {
        console.log(response.data.message);
        debugger;
        setProducts((prevProducts) =>
          prevProducts.map((p) =>
            p._id === product._id
              ? { ...p, isFollowed: !product.isFollowed }
              : p
          )
        );
        // Optionally update UI based on response
        // e.g., update follow state or followers count
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };
  return (
    <div className="relative flex flex-col bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden h-full">
      {/* Image */}
      <div
        className="relative w-full pt-[100%] bg-gray-200 cursor-pointer"
        onClick={() => navigate(`/product-details/${product._id}`)}
      >
        {product?.videoUrl ? (
          <>
            <iframe
              title={product.title}
              id={product.title}
              src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&mute=1&controls=0&loop=1&modestbranding=1&rel=0&playlist=${VIDEO_ID}`}
              className="absolute top-0 left-0 w-full h-full scale-[1.8] origin-center overflow-hidden"
              allow="autoplay"
              allowFullScreen={false}
            />
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center cursor-pointer rounded-t-xl bg-transparent" />
          </>
        ) : (
          <img
            src={getImageUrl(product.imageUrl || product.images?.[0])}
            alt={product.title}
            className="absolute top-0 left-0 w-full h-full object-cover rounded-t-xl"
          />
        )}

        {/* Favorite Icon */}
        <></>
        <button
          className="absolute z-10 top-2 right-2 p-1 bg-gray-900 bg-opacity-60 rounded-full hover:bg-opacity-80"
          onClick={handleFavoriteClick}
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite(product._id)
                ? "text-red-600 fill-red-600"
                : "text-gray-300"
            }`}
            fill={isFavorite(product._id) ? "currentColor" : "none"}
          />
        </button>
        <div className="absolute top-14 right-2 z-10">
          <span className="px-2 py-0.5 rounded text-white">
            {product?.favourites?.length
              ? numberToKMG(product?.favourites?.length)
              : ""}
          </span>
        </div>
        {/* Price overlay */}
        <div className="absolute z-10 bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-[#2ab6e4] font-bold text-lg">
            ${formatPrice(product.price)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pt-4 z-10 flex justify-between items-start gap-4">
        <div className="flex-grow">
          <h4 className="text-white font-medium text-sm line-clamp-2 mb-1">
            {product.title}
          </h4>
          <p className="text-xs text-gray-400">{product.seller || "Unknown"}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleFollowClick}
            className="text-white text-xs px-4 py-2 rounded-2xl transition border border-white bg-transparent"
          >
            {product.isFollowed ? "Unfollow" : "Follow"}
          </button>
          <a
            href={getSourceUrl()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-blue-700 text-white text-xs px-4 py-2 rounded-2xl flex items-center gap-1 hover:bg-blue-600 transition"
          >
            Visit <ExternalLink className="w-3 h-3" />
          </a>
        </div>
       
      </div>
      <div className="flex justify-end  gap-2 px-4 pb-4">
        <ProfileImageGroup followersCount={product.followersCount} />
      </div>
    </div>
  );
};

export default RecommendationCard;
