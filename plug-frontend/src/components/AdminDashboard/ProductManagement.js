import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Save, Camera, Download, Check } from 'lucide-react';
import axios from 'axios';
const ProductManagement = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [priceRange, setPriceRange] = useState({ start: 1, end: 1000 });

  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [savingProducts, setSavingProducts] = useState(false);

  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedSubCategories, setSelectedSubCategories] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchResults, setIsSearchResults] = useState(false);

  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedCategoryForSave, setSelectedCategoryForSave] = useState('');
  const [selectedSubCategoryForSave, setSelectedSubCategoryForSave] = useState('');
  const [searchbyimage, setsearchbyimage] = useState(false);
  const searchbyimageRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/admin/categories`, {
          params: { email: process.env.REACT_APP_ADMIN_EMAIL }
        });
        setCategories(response.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

const toggleSubCategory = (subCategory) => {
    setSelectedSubCategories(prev => {
      // If clicking the currently selected category, unselect it
      if (prev.has(subCategory)) {
        return new Set();
      }
      // Otherwise, clear previous selection and select only the new category
      return new Set([subCategory]);
    });
    setCurrentPage(1);
  };


  // Add product selection toggle
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  //handle image search click
  const handleImageSearchClick = () => {
  if(searchbyimageRef && searchbyimageRef.current){
      searchbyimageRef.current.click();setsearchbyimage(true);
    }
  };

  //handle image change
  const handleImageChange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', file); 
        formData.append('email', process.env.REACT_APP_ADMIN_EMAIL);
        const response = await axios.post('/api/user/searchbyimage', formData, {
          headers: {
            'Content-Type': 'multipart/form-data', 
          },
        });
        setProducts(response?.data?.products);
        // onClose();
      } catch (err) {
        // setError(err.response?.data?.message || 'Something went wrong');
        console.error('Error:', err);
      } finally {
        setLoading(false);
        searchbyimageRef.current.value = '';
      }
    };


  const handleEditClick = async (product) => {
    alert(`fetching product info for ${product.title}`);
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_BASEURL}/api/user/getproductinfo`,
            { detailUrl: product.detail_url || product.detailUrl, productId:product.productId || product.num_iid, email: process.env.REACT_APP_ADMIN_EMAIL },
            { withCredentials: true }
          );
  
          if (response.data) {
            if(!(response.data.colors.length>0 || response.data.sizes.length>0  || response.data.images.length>0 )){alert('No colors, sizes or images found');return;}
            setProducts(prev => prev.map(p => (p?.productId === response.data.productId || p?.num_iid === response.data.productId)? { ...p, colors: response.data.colors, sizes: response.data.sizes, images: response.data.images } : p));
          }
        } catch (error) {
          alert(error.response?.data?.error || 'Something went wrong');
        }
  
  }
  

  // Categories sidebar render
  const renderCategoriesSidebar = () => (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category._id}
          className="p-4 bg-gray-800 rounded-xl"
        >
          <button
            onClick={() => toggleCategory(category.name)}
            className="flex items-center justify-between w-full mb-2"
          >
            <h3 className="text-lg font-semibold text-[#FF8C00]">{category.name}</h3>
            {expandedCategories[category.name] ? (
              <ChevronUp className="w-5 h-5 text-[#FF8C00]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#FF8C00]" />
            )}
          </button>
          {expandedCategories[category.name] && (
            <ul className="space-y-2">
              {category.subcategories.map((subcategory) => (
                <li
                  key={subcategory._id}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    id={subcategory.name}
                    checked={selectedSubCategories.has(subcategory.name)}
                    onChange={() => toggleSubCategory(subcategory.name)}
                    className="w-4 h-4 rounded text-[#2ab6e4] focus:ring-[#2ab6e4] bg-gray-700 border-gray-600"
                  />
                  <label
                    htmlFor={subcategory.name}
                    className={`cursor-pointer text-sm ${selectedSubCategories.has(subcategory.name)
                      ? 'text-[#2ab6e4]'
                      : 'text-gray-300 hover:text-white'
                      }`}
                  >
                    {subcategory.name}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );

  const fetchProducts = useCallback(async () => {
    if (selectedSubCategories.size === 0) return;

    setLoading(true);
    // Set search results flag to false when fetching by category
    setIsSearchResults(false);

    try {
      // Fetch by categories only
      const promises = Array.from(selectedSubCategories).map(subCategory =>
        fetch(`https://www.lovbuy.com/aliexpressapi/searchproduct.php?key=29a9df07476d9153a64cb7cdd8982968&start_price=${priceRange.start}&end_price=${priceRange.end}&key_word=${encodeURIComponent(subCategory)}&page=${currentPage}`)
          .then(res => res.json())
      );

      const results = await Promise.all(promises);
      const allProducts = results.flatMap(result => result.items?.item || []);
      if (results[0]?.items) {
        setTotalPages(parseInt(results[0].items.page_size) || 0);
      }
      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSubCategories, currentPage, priceRange]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setIsSearchResults(true);

    try {
      const response = await fetch(
        `https://www.lovbuy.com/aliexpressapi/searchproduct.php?key=29a9df07476d9153a64cb7cdd8982968&start_price=${priceRange.start}&end_price=${priceRange.end}&key_word=${encodeURIComponent(searchTerm)}&page=${currentPage}`
      );
      const data = await response.json();
      const searchResults = data.items?.item || [];
      setProducts(searchResults);
      setTotalPages(parseInt(data.items?.page_size) || 0);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add this effect after your other useEffects
  useEffect(() => {
    if (isSearchResults && searchTerm) {
      handleSearch();
    }
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedSubCategories.size > 0) {
      fetchProducts();
    } else {
      setProducts([]);
    }
  }, [selectedSubCategories, currentPage, priceRange, fetchProducts]);


  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Add first page
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1 text-white bg-gray-800 rounded hover:bg-gray-700"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="dots1" className="px-2 text-gray-400">...</span>);
      }
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded ${currentPage === i
            ? 'bg-[#2ab6e4] text-white'
            : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
        >
          {i}
        </button>
      );
    }

    // Add last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="px-2 text-gray-400">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-1 text-white bg-gray-800 rounded hover:bg-gray-700"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  const CategorySelectionDialog = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md p-6 bg-gray-800 rounded-xl">
        <h3 className="mb-4 text-xl font-bold text-white">
          Select Category for {selectedProducts.size} Products
        </h3>

        {/* Category dropdown */}
        <div className="mb-4">
          <label className="block mb-2 text-sm text-gray-400">Category</label>
          <select
            value={selectedCategoryForSave}
            onChange={(e) => {
              setSelectedCategoryForSave(e.target.value);
              setSelectedSubCategoryForSave(''); // Reset subcategory when category changes
            }}
            className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4]"
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory dropdown - only show if category is selected */}
        {selectedCategoryForSave && (
          <div className="mb-6">
            <label className="block mb-2 text-sm text-gray-400">Subcategory</label>
            <select
              value={selectedSubCategoryForSave}
              onChange={(e) => setSelectedSubCategoryForSave(e.target.value)}
              className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4]"
            >
              <option value="">Select a subcategory</option>
              {categories
                .find(cat => cat.name === selectedCategoryForSave)
                ?.subcategories.map(sub => (
                  <option key={sub._id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowCategoryDialog(false)}
            className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!selectedCategoryForSave || !selectedSubCategoryForSave) {
                alert('Please select both category and subcategory');
                return;
              }
              handleFinalSave();
            }}
            className="px-4 py-2 text-white rounded bg-[#2ab6e4] hover:bg-[#229ed4]"
          >
            Save Products
          </button>
        </div>
      </div>
    </div>
  );
  // Modify the handleSaveClick function
  const handleSaveClick = () => {
    if (selectedProducts.size === 0) return;

    // Check if the products are from search results or category selection
    if (isSearchResults || searchbyimage) {
      // If from search, show category selection dialog
      setShowCategoryDialog(true);
    } else if (selectedSubCategories.size > 0) {
      // If from category selection, get the selected category and subcategory
      const selectedSubCategory = Array.from(selectedSubCategories)[0];
      const mainCategory = categories.find(category =>
        category.subcategories.some(sub => sub.name === selectedSubCategory)
      )?.name;

      if (!mainCategory) {
        alert('Please select a valid category');
        return;
      }

      // Call handleFinalSave directly with the selected category info
      handleFinalSave({
        category: mainCategory,
        subcategory: selectedSubCategory
      });
    } else {
      alert('Please select a category before saving products');
    }
  };
  // Modify handleFinalSave to accept category info
  const handleFinalSave = async (categoryInfo = null) => {
    setSavingProducts(true);
    try {
        const productsToSave = products
        .filter(product => selectedProducts.has(product.num_iid||product.productId))
        .map(product => {

          // Use the category info based on the source
          const mainCategory = categoryInfo ? categoryInfo.category : selectedCategoryForSave;
          const subcategory = categoryInfo ? categoryInfo.subcategory : selectedSubCategoryForSave;

          //check if the product is from Image search results
          if(product.num_iid){
          return {
            productId: product.num_iid,
            title: product.title,
            price: product.price.toFixed(2),
            imageUrl: product.pic_url,
            seller: product.seller_nick,
            shopId: product.shop_id,
            detailUrl: product.detail_url,
            images: product?.images,
            colors: product?.colors,
            sizes: product?.sizes,
            category: mainCategory,
            subcategory: subcategory
          };}
          else{
            return {
              ...product,
              category: mainCategory,
              subcategory: subcategory
            };
          }
        });

      const response = await axios.post(`${process.env.REACT_APP_API_BASEURL}/api/admin/save-products`, {
        products: productsToSave,
        email: process.env.REACT_APP_ADMIN_EMAIL
      });

      if (response.status === 200) {
        setSelectedProducts(new Set());
        setShowCategoryDialog(false);
        setSelectedCategoryForSave('');
        setSelectedSubCategoryForSave('');
        setsearchbyimage(false);
        alert('Products saved successfully!');
      }
    } catch (error) {
      console.error('Error saving products:', error);
      alert(`Failed to save products: ${error.response?.data?.message || error.message}`);
    } finally {
      setSavingProducts(false);
    }
  };


  return (
    <div className="container mx-auto">
      {/* Search Bar */}
      <div className="p-3 mb-2 bg-gray-800 rounded-xl">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <div className='relative w-full h-max'>
          <input
                type="file"
                alt="search by image input"
                className="hidden"
                ref={searchbyimageRef}
                accept="image/*" 
                multiple={false} 
                onChange={(e) => handleImageChange(e)}
              />
          <input
            type="text"
            placeholder="Search products by keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 text-white bg-gray-700 rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
            />
            <Camera className="absolute w-5 h-5 text-gray-400 right-3 top-1/4 cursor-pointer" onClick={() => handleImageSearchClick()} />
            </div>
          <Search className="absolute w-5 h-5 text-gray-400 left-3" />
          <button
            type="submit"
            className="px-6 py-2 ml-4 text-white rounded-lg bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>
      {/* Save Products Button */}
      {selectedProducts.size > 0 && (
        <div className="fixed z-50 bottom-6 right-6">
          <button
            onClick={handleSaveClick}
            disabled={savingProducts}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#a017c9] to-[#2ab6e4] text-white rounded-lg shadow-lg hover:opacity-90 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>
              {savingProducts ? 'Saving...' : `Save ${selectedProducts.size} Products`}
            </span>
          </button>
        </div>
      )}
      {showCategoryDialog && <CategorySelectionDialog />}


      {/* Price Filter */}
      <div className="p-4 mb-6 bg-gray-800 rounded-xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <h2 className="text-xl font-bold text-white">Price Filter</h2>
          <div className="flex items-center space-x-4">
            <input
              type="number"
              placeholder="Min Price"
              value={priceRange.start}
              onChange={(e) => setPriceRange(prev => ({ ...prev, start: parseInt(e.target.value) || 1 }))}
              className="w-24 px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
              min="1"
            />
            <span className="text-gray-400">to</span>
            <input
              type="number"
              placeholder="Max Price"
              value={priceRange.end}
              onChange={(e) => setPriceRange(prev => ({ ...prev, end: parseInt(e.target.value) || 1000 }))}
              className="w-24 px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
              min="1"
            />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        {/* Categories Sidebar */}
        <div className="space-y-2">
          {renderCategoriesSidebar()}
        </div>

        {/* Products Grid */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {(selectedSubCategories.size > 0 || products.length > 0) ? (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => {
                        const allProductIds = new Set(products.map(p => p.num_iid || p.productId));
                        setSelectedProducts(prev =>
                          prev.size === allProductIds.size ? new Set() : allProductIds
                        );
                      }}
                      className="px-4 py-2 text-white bg-gray-800 rounded hover:bg-gray-700"
                    >
                      {selectedProducts.size === products.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
                    {products.map((product) => (
                      <div
                        key={product.num_iid}
                        className={`relative overflow-hidden bg-gray-800 rounded-xl transition-all ${selectedProducts.has(product.num_iid)
                          ? 'ring-2 ring-[#2ab6e4]'
                          : 'hover:ring-2 hover:ring-gray-600'
                          }`}
                      >
                        {/* Selection Checkbox */}
                        <div className="absolute z-10 top-2 right-2">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.num_iid || product.productId)}
                            onChange={() => toggleProductSelection(product.num_iid || product.productId)}
                            className="w-5 h-5 rounded text-[#2ab6e4] focus:ring-[#2ab6e4] bg-gray-700 border-gray-600"
                          />
                        </div>

                        <img
                          src={`${product.pic_url?`https:${product.pic_url}`:product.imageUrl}`}
                          alt={product.title}
                          className="object-cover w-full h-48"
                        />
                        <div className="p-4">
                          <h4 className="mb-2 font-semibold text-white line-clamp-2">
                            {product.title}
                          </h4>
                          <div className="flex items-center justify-between">
                            <p className="text-[#2ab6e4] font-bold">
                              ${product.price}
                            </p>
                            {/* <p className="text-sm text-gray-400">
                              {product.seller_nick}
                            </p> */}
                          </div>
                          <div className="mt-4 flex gap-1">
                            <a
                              href={product.detail_url} // Use the product's detail URL or any other link
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 text-white bg-[#2ab6e4] rounded hover:bg-[#1a94c4] text-nowrap"
                            >
                              View Details
                            </a>
                            {/* <span 
                              className=' text-white'
                            > */}
                             {selectedProducts.has(product.num_iid || product.productId) && ((product.colors?.length > 0  || product.sizes?.length > 0 || product.images?.length > 0 )? <span className="p-2 text-white aspect-square bg-green-600 rounded hover:bg-green-700" >
                              <Check />
                              </span>: <span className="p-2 text-white aspect-square bg-gray-700 rounded hover:bg-gray-600" onClick={() => handleEditClick(product)}>
                                <Download />
                                </span>
                              )}
                            
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2 py-4">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-white bg-gray-800 rounded disabled:opacity-50 hover:bg-gray-700"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      {renderPageNumbers()}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-white bg-gray-800 rounded disabled:opacity-50 hover:bg-gray-700"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Search className="w-12 h-12 mb-4" />
                  <p>Search or select categories to view products</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;