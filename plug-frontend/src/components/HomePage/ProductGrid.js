import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Heart, Check, Save, Shuffle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { shuffle } from 'lodash';
import { Link } from 'react-router-dom';

const SaveDialog = ({ show, message }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed z-50 flex items-center px-6 py-4 space-x-3 text-white bg-gray-800 rounded-lg shadow-lg top-4 right-4"
    >
      <div className="p-1 bg-green-500 rounded-full">
        <Check className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="font-medium">{message}</p>
      </div>
    </motion.div>
  );
};

const ProductGrid = ({ onProductClick, selectedCategory, selectedSubCategory, searchTerm, priceRange, imageProducts, aiProducts,HomePage }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [savedProducts, setSavedProducts] = useState({});
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [isSavingMultiple, setIsSavingMultiple] = useState(false);
  const isPremiumUser = ['premium', 'standard', 'basic'].includes(user?.subscription);
  const [animationKey, setAnimationKey] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [allProducts, setAllProducts] = useState([]); // New state for all products
  const productsPerPage = 100; // Products per page


  const getPaginatedProducts = useCallback(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    return products.slice(startIndex, endIndex);
  }, [currentPage, products]);

  useEffect(() => {
    setTotalPages(Math.ceil(products.length / productsPerPage));
  }, [products]);


  useEffect(() => {
    if (!isPremiumUser) {
      setSelectedProducts(new Set());
    }
  }, [isPremiumUser]);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch saved products when component mounts or user changes
  useEffect(() => {
    const fetchSavedProducts = async () => {
      if (user) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_BASEURL}/api/user/saved-products`,
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          const savedMap = {};
          response.data.products.forEach(p => {
            savedMap[p.productId] = true;
          });
          setSavedProducts(savedMap);
        } catch (error) {
          console.error('Error fetching saved products:', error);
        }
      }
    };
    fetchSavedProducts();
  }, [user]);

  const fetchSavedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: 5000 // Increased limit to get more products at once
      };

      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }

      if (selectedSubCategory !== 'All') {
        params.subcategory = selectedSubCategory;
      }

      if (searchTerm?.trim()) {
        params.search = searchTerm.trim();
      }

      if (priceRange?.min) {
        params.minPrice = priceRange.min * 2;
      }
      if (priceRange?.max) {
        params.maxPrice = priceRange.max * 2;
      }
      if((!imageProducts || imageProducts?.length === 0) && (!aiProducts || aiProducts?.length === 0) && !HomePage){
      const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/products`, { params, withCredentials: true });
      // Shuffle the products array before setting it
      const shuffledProducts = shuffle(response.data.products);
      setAllProducts(response.data.products); // Store all products
      setProducts(shuffledProducts);
    }else{
      console.log('sudip')
      if(aiProducts.length > 0) {
        // const shuffledProducts = shuffle(aiProducts);
        setAllProducts(aiProducts); 
        setProducts(aiProducts);
      }else{
        const shuffledProducts = shuffle(imageProducts);
        setAllProducts(imageProducts); 
        setProducts(shuffledProducts);
      }
    }
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSubCategory, searchTerm, priceRange, imageProducts]);

  // Add a function to re-shuffle products
  const handleReshuffle = useCallback(() => {
    setLoading(true);
    const shuffledProducts = shuffle([...allProducts]);
    setProducts(shuffledProducts);
    setAnimationKey(prev => prev + 1);
    // Brief timeout to ensure loading state is visible
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }, [allProducts]);

  
  // Helper function to generate pagination range
  const getPaginationRange = useCallback(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  // Animation variants for the product cards
  const cardVariants = {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  };
  useEffect(() => {
    fetchSavedProducts();
  }, [fetchSavedProducts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="mb-4 text-lg text-red-500">{error}</p>
          <button
            onClick={fetchSavedProducts}
            className="px-4 py-2 text-white bg-[#2ab6e4] rounded-lg hover:bg-opacity-90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0 ) {
    return (
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-lg text-gray-400">No products found</p>
        </div>
      </div>
    );
  }


  const toggleProductSelection = (e, productId) => {
    e.stopPropagation();
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSaveMultiple = async () => {
    if (!user) {
      navigate('/');
      return;
    }

    if (selectedProducts.size === 0) return;

    setIsSavingMultiple(true);
    try {
      const productsToSave = Array.from(selectedProducts)
        .filter(productId => !savedProducts[productId]);

      if (productsToSave.length === 0) {
        setSaveMessage('All selected products are already saved!');
        setShowSaveDialog(true);
        setTimeout(() => setShowSaveDialog(false), 3000);
        setSelectedProducts(new Set());
        return;
      }

      if(imageProducts.length > 0) {
        const products = imageProducts.filter(product => productsToSave.includes(product.productId));
        await axios.post('/api/user/saved-products/bulk', {
          products: products,
          productIds: productsToSave,
          email: user.email
        });
        
      }else{

        await axios.post('/api/user/saved-products/bulk', {
          productIds: productsToSave,
          email: user.email
        });
      }

      const newSavedProducts = { ...savedProducts };
      productsToSave.forEach(id => {
        newSavedProducts[id] = true;
      });
      setSavedProducts(newSavedProducts);

      setSaveMessage(`Successfully saved ${productsToSave.length} new items!`);
      setShowSaveDialog(true);
      setTimeout(() => setShowSaveDialog(false), 3000);

      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error saving multiple products:', error);
      setSaveMessage('Failed to save products. Please try again.');
      setShowSaveDialog(true);
      setTimeout(() => setShowSaveDialog(false), 3000);
    } finally {
      setIsSavingMultiple(false);
    }
  };
  
  // Add this handler for heart icon clicks
  const handleHeartClick = (e, productId) => {
    e.stopPropagation(); // Prevent card click
    if (!user) {
      navigate('/login');
      return;
    }
    toggleProductSelection(e, productId);
  };
  

  const renderPagination = () => {
    if (!totalPages || totalPages <= 1) return null;

    const paginationRange = getPaginationRange();


    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`hidden sm:block px-4 py-2 text-sm rounded-lg ${currentPage === 1
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
        >
          Previous
        </button>

       <div className="flex items-center gap-1.5 sm:gap-2 max-w-[calc(100vw-200px)] overflow-x-auto">
          {paginationRange.map((pageNumber, index) => (
            pageNumber === '...' ? (
              <span key={index} className="px-2 text-gray-400">...</span>
            ) : (
              <button
                key={index}
                onClick={() => setCurrentPage(Number(pageNumber))}
                className={`min-w-[32px] h-8 sm:min-w-[40px] sm:h-10 text-sm rounded-lg flex items-center justify-center transition-colors ${
                  currentPage === pageNumber
                    ? 'bg-[#2ab6e4] text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {pageNumber}
              </button>
            )
          ))}
        </div>

        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 text-sm rounded-lg ${
            currentPage === totalPages
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          Next
        </button>
      </div>
    );
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('/uploads/')) {
      return url;
    }
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    return url;
  };

  return (
    <div className="w-full px-2">
      <div className="flex justify-end gap-4 px-2 mb-4">
        <button
          onClick={handleReshuffle}
          className="flex items-center px-4 py-2 space-x-2 text-sm font-medium text-white transition-colors bg-gray-800 rounded-lg hover:bg-gray-700"
        >
          <Shuffle className="w-4 h-4" />
          <span>Shuffle</span>
        </button>
      </div>
      <AnimatePresence>
        {showSaveDialog && <SaveDialog show={showSaveDialog} message={saveMessage} />}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
        <AnimatePresence mode="wait">
        {getPaginatedProducts().map((product, index) => (
            <motion.div
            layout
            key={index}
            variants={cardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            custom={index}
            className={` relative overflow-hidden bg-gray-800 h-max rounded-xl transition-colors cursor-pointer group hover:ring-2 hover:ring-[#2ab6e4]
                ${selectedProducts.has(product.productId) ? 'ring-2 ring-[#2ab6e4]' : ''}`}
            onClick={() => {if(aiProducts?.length === 0) onProductClick(product);}}
          >
            { aiProducts?.length > 0 ?
              <div className={` w-full h-full relative bg-black`}>
                <Link to={product?.link} target='_blank'>
                
              <div className='w-full bg-white rounded-xl overflow-hidden '>
                <img src={`https://logo.clearbit.com/${product?.link?.split('//')[1].split('/')[0]}`} className='rounded-full h-14 absolute top-0 left-0 translate-x--1/2 -translate-y--1/2 aspect-square border-2 border-black'/>
              <div className='pt-4 pb-2 flex items-center justify-center h-full w-full flex-col'>
                <span className='text-lg font-semibold bg-gradient-to-r from-[#9f17c975] to-[#2ab6e4] bg-clip-text  text-transparent'>I'm Mia</span>
                {/* <span className='text-center text-xs'> Your AI shopping assistance</span> */}
                <span className='text-center text-xs'>I found simillar product on</span>
                {/* <span>{product?.link?.split('//')[1].split('/')[0].split('.').length > 2 ? product?.link?.split('//')[1].split('/')[0].split('.')[1] : product?.link?.split('//')[1].split('/')[0].split('.')[1]}</span> */}
                <span className='text-center'>{product?.source}{" "}<span className={`text-[#34B60E] text-lg ${!product?.price  && 'hidden'}`}>{product?.price && product?.price}</span></span>
                <span className='text-center text-xs'>{product?.title?.split(" ").slice(0, 7).join(" ")}</span>
              </div>
            </div>
            <div className='w-full mt-1 aspect-square overflow-hidden flex items-center justify-center bg-white relative'>
              {isPremiumUser && (
                <div 
                  onClick={(e) => handleHeartClick(e, product.productId)}
                  className={`absolute p-2 transition-all duration-300 rounded-full outline-none cursor-pointer top-3 right-3 hidden ${!HomePage?"bg-gray-900/80":""} backdrop-blur-sm`}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${selectedProducts.has(product.productId)
                        ? 'text-[#2ab6e4] fill-[#2ab6e4]'
                        : 'text-white'
                      }`}
                  />
                </div>
              )}
              <img src={product?.thumbnail} className=''/>

            </div>
              <button className='w-full text-center px-2 py-3 mt-1 font-semibold bg-black border-2 rounded-xl text-blue-500 truncate'>
                <Link to={product?.link} target='_blank'>
                Visit{" "}{product.source}
                {/* {product?.price && `${product?.price?.split('*')[0]}`} */}
                {/* <span className={`text-white text-lg ${!product?.price  && 'hidden'}`}>{product?.price}</span> On {product?.source} */}
                </Link>
              </button>
                </Link>
              </div>
              :
                <>
                <div className="relative aspect-square">
              <img
                src={getImageUrl(product.imageUrl)}
                alt={product.title}
                className="object-cover w-full h-full"
              />
              {isPremiumUser && (
                <div 
                  onClick={(e) => handleHeartClick(e, product.productId)}
                  className={`absolute p-2 transition-all duration-300 rounded-full outline-none cursor-pointer top-3 right-3 ${aiProducts?.length===0?"bg-gray-900/80 backdrop-blur-sm":""}`}
                >
                  <Heart
                    className={`w-5 h-5 transition-colors ${selectedProducts.has(product.productId)
                        ? 'text-[#2ab6e4] fill-[#2ab6e4]'
                        : 'text-white'
                      }`}
                  />
                </div>
              )}
            </div>
              <div className="p-4">
                <h4 className="mb-2 font-semibold text-white line-clamp-2">
                  {product.title}
                </h4>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[#2ab6e4] font-bold">
                  ${((product.price * 1.3).toFixed(2))}
                  </p>
                  <p className="text-sm text-blue-500">
                    Dropship this Product
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs text-gray-300 bg-gray-700 rounded-full">
                    {product.category}
                  </span>
                  <span className="px-2 py-1 text-xs text-gray-300 bg-gray-700 rounded-full">
                    {product.subcategory}
                  </span>
                </div>
              </div>
                </>
              }
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {isPremiumUser && selectedProducts.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed z-50 -translate-x-1/2 bottom-8 left-1/2"
          >
            <button
              onClick={handleSaveMultiple}
              disabled={isSavingMultiple}
              className="flex items-center px-6 py-3 space-x-2 text-white rounded-full shadow-lg bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:opacity-90"
            >
              <Save className="w-5 h-5" />
              <span>Save {selectedProducts.size} items</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {imageProducts && imageProducts.length > 0 ? 
      <div className="flex items-center justify-center gap-2 py-8">
     <div className="flex items-center gap-1.5 sm:gap-2 max-w-[calc(100vw-200px)] overflow-x-auto"><button
      className={`min-w-full  h-8 sm:min-w-[40px] sm:h-10 text-sm rounded-lg flex items-center justify-center transition-colors bg-[#2ab6e4] text-white`}>
      1
      </button></div></div>
      :
      renderPagination()}
    </div>
  );
};

export default ProductGrid;