import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Filter, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import RecommendationCard from '../components/HomePage/RecommendationCard';

const Category = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const categoryName = queryParams.get('name');

    const [products, setProducts] = useState({ items: [], totalPages: 1, totalProducts: 0, currentPage: 1 });
    const [subcategories, setSubcategories] = useState([]);
    const [secondSubcategories, setSecondSubcategories] = useState([{ name: 'All', _id: 'all' }]);
    const [loading, setLoading] = useState(true);
    const [activeSubcategory, setActiveSubcategory] = useState('All');
    const [activeSecondSubcategory, setActiveSecondSubcategory] = useState('All');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const [limit] = useState(100);

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const sliderRef = useRef(null);
    const secondSliderRef = useRef(null);
    const isMounted = useRef(false);

    // Function to shuffle array
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    // Fetch products with all filters
    const fetchProducts = useCallback(async (page = 1) => {
        try {
            setLoading(true);

            const params = {
                page,
                limit,
                category: categoryName,
            };

            if (activeSubcategory !== 'All') {
                params.subcategory = activeSubcategory;
            }

            if (activeSecondSubcategory !== 'All') {
                params.secondSubcategory = activeSecondSubcategory;
            }

            if (searchTerm.trim()) {
                params.search = searchTerm.trim();
            }

            if (minPrice) {
                params.minPrice = minPrice;
            }

            if (maxPrice) {
                params.maxPrice = maxPrice;
            }

            const productsResponse = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/products`, {
                params,
                withCredentials: true,
            });

            // Shuffle products after fetching
            const shuffledProducts = shuffleArray(productsResponse.data.products);

            // Update state only after shuffling is complete
            setProducts({
                items: shuffledProducts,
                totalPages: productsResponse.data.totalPages,
                totalProducts: productsResponse.data.totalProducts,
                currentPage: productsResponse.data.currentPage,
            });
            setTotalPages(productsResponse.data.totalPages);
            setTotalProducts(productsResponse.data.totalProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts({ items: [], totalPages: 1, totalProducts: 0, currentPage: 1 });
        } finally {
            setLoading(false);
        }
    }, [categoryName, activeSubcategory, activeSecondSubcategory, searchTerm, minPrice, maxPrice, limit]);

    // Fetch category details and subcategories
    useEffect(() => {
        const fetchCategoryDetails = async () => {
            if (!categoryName) {
                navigate('/');
                return;
            }

            try {
                setLoading(true);
                const categoriesResponse = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/admin/categories`, {
                    params: { email: process.env.REACT_APP_ADMIN_EMAIL }
                });

                const selectedCategory = categoriesResponse.data.categories.find(
                    category => category.name === categoryName
                );

                if (selectedCategory && selectedCategory.subcategories) {
                    setSubcategories([{ name: 'All', _id: 'all' }, ...selectedCategory.subcategories]);
                }
            } catch (error) {
                console.error('Error fetching category details:', error);
            } finally {
               // setLoading(false);
            }
        };

        fetchCategoryDetails();
        isMounted.current = true;
    }, [categoryName, navigate]);

    // Update secondSubcategories when activeSubcategory changes
    useEffect(() => {
        if (activeSubcategory === 'All') {
            setSecondSubcategories([{ name: 'All', _id: 'all' }]);
            setActiveSecondSubcategory('All');
        } else {
            const selectedSubcategory = subcategories.find(sub => sub.name === activeSubcategory);
            if (selectedSubcategory && selectedSubcategory.secondSubcategories) {
                setSecondSubcategories([{ name: 'All', _id: 'all' }, ...selectedSubcategory.secondSubcategories]);
            } else {
                setSecondSubcategories([{ name: 'All', _id: 'all' }]);
            }
            setActiveSecondSubcategory('All');
        }
    }, [activeSubcategory, subcategories]);

    // Fetch products when filters change
    useEffect(() => {
        if (isMounted.current) {
            fetchProducts(1);
        }
    }, [fetchProducts]);

    const handleSubcategoryClick = useCallback((subcategory) => {
        setActiveSubcategory(subcategory);
        setCurrentPage(1);
    }, []);

    const handleSecondSubcategoryClick = useCallback((secondSubcategory) => {
        setActiveSecondSubcategory(secondSubcategory);
        setCurrentPage(1);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchProducts(1);
    };

    const handleClearFilters = useCallback(() => {
        setSearchTerm('');
        setMinPrice('');
        setMaxPrice('');
        setActiveSubcategory('All');
        setActiveSecondSubcategory('All');
        setCurrentPage(1);
    }, []);

    const handlePageChange = useCallback((page) => {
        setCurrentPage(page);
        fetchProducts(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [fetchProducts]);

    const scrollLeft = (ref) => {
        if (ref.current) {
            ref.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollRight = (ref) => {
        if (ref.current) {
            ref.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    // Memoize filteredProducts to prevent unnecessary re-renders
    const filteredProducts = useMemo(() => products.items || [], [products.items]);

    const categoryVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const categoryItemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: 'spring',
                stiffness: 200,
                damping: 20
            }
        }
    };

    return (
        <div className="flex w-full flex-col bg-[#333333] min-h-screen">
            <div className="sticky top-0 z-50 bg-[#333333] w-full border-b border-[#444444]">
                <div className="max-w-screen mx-auto px-4 py-4 w-full">
                    <Link to="/" className="flex items-center gap-2 text-white mb-4 hover:text-gray-300 transition-colors">
                        <ArrowLeft className="text-white" />
                        <span>Back to Home</span>
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                        <h1 className="text-3xl font-bold text-white">{categoryName || 'Category'}</h1>

                        <div className="flex items-center mt-4 md:mt-0 gap-2">
                            <form onSubmit={handleSearch} className="relative">
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-[#4D4D4D] text-white rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-white/50 w-full md:w-[250px]"
                                />
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                            </form>

                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="bg-[#4D4D4D] text-white p-2 rounded-full hover:bg-[#5D5D5D] transition-colors"
                            >
                                <Filter className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Filters panel */}
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-[#4D4D4D] rounded-lg p-4 mb-4"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-white font-semibold">Filters</h3>
                                <button
                                    onClick={() => setShowFilters(false)}
                                    className="text-white/70 hover:text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/70 text-sm mb-1">Min Price</label>
                                    <input
                                        type="number"
                                        placeholder="Min price"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="bg-[#333333] text-white rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/70 text-sm mb-1">Max Price</label>
                                    <input
                                        type="number"
                                        placeholder="Max price"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="bg-[#333333] text-white rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-white/50"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-4 gap-2">
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 text-white/70 hover:text-white transition-colors"
                                >
                                    Clear All
                                </button>

                                <button
                                    onClick={() => fetchProducts(1)}
                                    className="px-4 py-2 bg-[#333333] text-white rounded hover:bg-[#444444] transition-colors"
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Subcategories Slider */}
                    <motion.div
                        className="relative w-full mb-4 flex items-center"
                        variants={categoryVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.button
                            onClick={() => scrollLeft(sliderRef)}
                            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-1 focus:outline-none"
                            aria-label="Scroll left"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="12" fill="#333333" />
                                <path d="M14 16L10 12L14 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>

                        <div className="w-full overflow-hidden">
                            <motion.div
                                ref={sliderRef}
                                className="flex justify-center overflow-x-auto scrollbar-hide py-2 no-scrollbar items-center h-[40px] scroll-smooth"
                            >
                                <div className="flex space-x-2 px-4">
                                    {subcategories.map((subcategory, index) => (
                                        <motion.button
                                            key={subcategory._id}
                                            className={`px-4 py-2 ${activeSubcategory === subcategory.name ? 'bg-[#4D4D4D]' : 'bg-[#1E1E1E]'} rounded-full text-white text-sm whitespace-nowrap flex-shrink-0 border border-[#333333] hover:bg-[#333333] transition-colors`}
                                            onClick={() => handleSubcategoryClick(subcategory.name)}
                                            variants={categoryItemVariants}
                                            whileHover={{
                                                scale: 1.1,
                                                boxShadow: "0px 0px 8px rgba(255, 255, 255, 0.3)"
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                            custom={index}
                                        >
                                            {subcategory.name}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>

                        <motion.button
                            onClick={() => scrollRight(sliderRef)}
                            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-1 focus:outline-none"
                            aria-label="Scroll right"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="12" fill="#333333" />
                                <path d="M10 8L14 12L10 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </motion.button>
                    </motion.div>

                    {/* Second Subcategories Slider */}
                    {secondSubcategories.length > 1 && (
                        <motion.div
                            className="relative w-full mb-4 flex items-center"
                            variants={categoryVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            <motion.button
                                onClick={() => scrollLeft(secondSliderRef)}
                                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-1 focus:outline-none"
                                aria-label="Scroll left"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="12" fill="#333333" />
                                    <path d="M14 16L10 12L14 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </motion.button>

                            <div className="w-full overflow-hidden">
                                <motion.div
                                    ref={secondSliderRef}
                                    className="flex justify-center overflow-x-auto scrollbar-hide py-2 no-scrollbar items-center h-[40px] scroll-smooth"
                                >
                                    <div className="flex space-x-2 px-4">
                                        {secondSubcategories.map((secondSubcategory, index) => (
                                            <motion.button
                                                key={secondSubcategory._id}
                                                className={`px-4 py-2 ${activeSecondSubcategory === secondSubcategory.name ? 'bg-[#4D4D4D]' : 'bg-[#1E1E1E]'} rounded-full text-white text-sm whitespace-nowrap flex-shrink-0 border border-[#333333] hover:bg-[#333333] transition-colors`}
                                                onClick={() => handleSecondSubcategoryClick(secondSubcategory.name)}
                                                variants={categoryItemVariants}
                                                whileHover={{
                                                    scale: 1.1,
                                                    boxShadow: "0px 0px 8px rgba(255, 255, 255, 0.3)"
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                                custom={index}
                                            >
                                                {secondSubcategory.name}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>

                            <motion.button
                                onClick={() => scrollRight(secondSliderRef)}
                                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 rounded-full p-1 focus:outline-none"
                                aria-label="Scroll right"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="12" fill="#333333" />
                                    <path d="M10 8L14 12L10 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </motion.button>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="max-w-screen mx-auto px-4 py-4 w-full flex-grow">
                {loading ? (
                    <div className="flex justify-center items-center min-h-[60vh]">
                        <div className="w-10 h-10 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {/* Products count */}
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-white/70">
                                Showing {filteredProducts.length} of {products.totalProducts || 0} products
                            </p>
                        </div>

                        {/* Products Grid or No Products Message */}
                        {filteredProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 min-h-[50vh]">
                                    {filteredProducts.map((product) => (
                                        <motion.div
                                            key={product._id}
                                            initial={{ opacity: 0, y: 50 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.5,
                                                ease: "easeOut"
                                            }}
                                            whileHover={{
                                                scale: 1.03,
                                                transition: { duration: 0.2 }
                                            }}
                                        >
                                            <RecommendationCard product={product} />
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center mt-8">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                                disabled={currentPage === 1}
                                                className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-[#1E1E1E] text-gray-500 cursor-not-allowed' : 'bg-[#4D4D4D] text-white hover:bg-[#5D5D5D]'}`}
                                            >
                                                Prev
                                            </button>

                                            {[...Array(totalPages)].map((_, i) => {
                                                if (
                                                    i === 0 ||
                                                    i === totalPages - 1 ||
                                                    (i >= currentPage - 2 && i <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => handlePageChange(i + 1)}
                                                            className={`w-8 h-8 flex items-center justify-center rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-[#4D4D4D] text-white hover:bg-[#5D5D5D]'}`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    );
                                                } else if (
                                                    (i === 1 && currentPage > 3) ||
                                                    (i === totalPages - 2 && currentPage < totalPages - 2)
                                                ) {
                                                    return <span key={i} className="text-white self-end pb-1">...</span>;
                                                }
                                                return null;
                                            })}

                                            <button
                                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                                disabled={currentPage === totalPages}
                                                className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-[#1E1E1E] text-gray-500 cursor-not-allowed' : 'bg-[#4D4D4D] text-white hover:bg-[#5D5D5D]'}`}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] text-white">
                                <p className="text-xl mb-4">No products found</p>
                                <p className="text-gray-400">Try adjusting your filters or selecting a different subcategory</p>
                                {(searchTerm || minPrice || maxPrice || activeSubcategory !== 'All' || activeSecondSubcategory !== 'All') && (
                                    <button
                                        onClick={handleClearFilters}
                                        className="mt-4 px-4 py-2 bg-[#4D4D4D] rounded-full text-white hover:bg-[#5D5D5D] transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Category;