import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import RecommendationCard from '../components/HomePage/RecommendationCard';
import { useFavorites } from '../contexts/FavoritesContext';

const FavoritesList = () => {
  const { favorites,error } = useFavorites();
 // const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Animation variants
  const favoritesVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const favoriteItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

//   // Fetch favorite products when favorites change
//   useEffect(() => {
//     const fetchFavoriteProducts = async () => {
//       if (favorites.length === 0) {
//         setFavoriteProducts([]);
//         setLoading(false);
//         return;
//       }

//       try {
//         setLoading(true);
//         const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/products`, {
//           params: {
//             ids: favorites.join(','), // Send comma-separated list of favorite IDs
//             limit: 100, // Adjust as needed
//           },
//           withCredentials: true,
//         });

//         setFavoriteProducts(response.data.products);
//       } catch (error) {
//         console.error('Error fetching favorite products:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFavoriteProducts();
//   }, [favorites]);

  return (
    <div className="flex w-full flex-col bg-[#333333] min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#333333] w-full border-b border-[#444444]">
        <div className="max-w-screen mx-auto px-4 py-4 w-full">
          <Link to="/" className="flex items-center gap-2 text-white mb-4 hover:text-gray-300 transition-colors">
            <ArrowLeft className='text-white' />
            <span>Back to Home</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">Favorites</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen mx-auto px-4 py-4 w-full flex-grow">
      {error && <div className="error text-white/70">{error}</div>}
        {loading &&!error && favorites.length === 0 ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Products count and loading indicator */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-white/70">
                {loading &&!error && favorites.length > 0 ? (
                  <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white/70 rounded-full animate-spin mr-2"></span>
                ) : null}
                Showing {favorites.length} favorite products
              </p>
            </div>

            {/* Favorites Grid */}
            {favorites.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 min-h-[50vh]"
                variants={favoritesVariants}
                initial="hidden"
                animate="visible"
              >
                {favorites.map((product, index) => (
                  <motion.div
                    key={product._id}
                    variants={favoriteItemVariants}
                    whileHover={{
                      scale: 1.03,
                      transition: {  duration: 0.2 }
                    }}
                  >
                    <RecommendationCard product={product} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                <p className="text-xl mb-4">No favorite products yet</p>
                <p className="text-gray-400">Start adding products to your favorites from the categories</p>
                <Link
                  to="/"
                  className="mt-4 px-4 py-2 bg-[#4D4D4D] rounded-full text-white hover:bg-[#5D5D5D] transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FavoritesList;