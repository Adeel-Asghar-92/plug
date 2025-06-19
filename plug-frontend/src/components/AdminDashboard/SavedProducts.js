import { useCallback, useEffect, useState } from 'react';

import CategoriesNav from '../HomePage/CategoriesNav';
import EditForm from '../EditForm';
import Pagination from '../Pagination';
import ProductCard from '../ProductCard';
import { Search } from 'lucide-react';
import axios from 'axios';
import useCategories from '../../hooks/useCategories';

const SavedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubCategory, setSelectedSubCategory] = useState('All');
  const [selectedSecondSubCategory, setSelectedSecondSubCategory] = useState('All');
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [editingProduct, setEditingProduct] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    title: '',
    price: '',
    imageUrl: '',
    videoUrl: '',
    seller: '',
    imageFile: null,
    withVendor: [],
  });
  const [uploadType, setUploadType] = useState('url');
  const [uploading, setUploading] = useState(false);

  const { getMainCategories, getSubCategories, getSecondSubCategories, loading: categoriesLoading } = useCategories();
  const mainCategories = getMainCategories();

  const fetchSavedProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/products`, {
        params: {
          page: currentPage,
          search: searchTerm,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          subcategory: selectedSubCategory !== 'All' ? selectedSubCategory : undefined,
          secondSubcategory: selectedSecondSubCategory !== 'All' ? selectedSecondSubCategory : undefined,
        },
        withCredentials: true,
      });
      console.log(response.data.products)
      setProducts(response.data.products);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching saved products:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedSubCategory, selectedSecondSubCategory]);

  useEffect(() => {
    fetchSavedProducts();
  }, [fetchSavedProducts]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSelectedSubCategory('All');
    setSelectedSecondSubCategory('All');
    setCurrentPage(1);
  };

  const handleSubCategorySelect = (subcategory) => {
    setSelectedSubCategory(subcategory);
    setSelectedSecondSubCategory('All');
    setCurrentPage(1);
  };

  const handleSecondSubCategorySelect = (secondSubcategory) => {
    setSelectedSecondSubCategory(secondSubcategory);
    setCurrentPage(1);
  };

  const handleDelete = async (e, productId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this product?')) return;

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/products/${productId}`,
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      if (response.status === 200) fetchSavedProducts();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedProducts.size} selected products?`)) return;

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/products/bulk-delete`,
        { productIds: Array.from(selectedProducts) },
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      if (response.status === 200) {
        setSelectedProducts(new Set());
        fetchSavedProducts();
      }
    } catch (error) {
      console.error('Error deleting products:', error);
      alert('Failed to delete products');
    }
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setUpdateForm({
      title: product.title,
      price: product.price,
      imageUrl: product.imageUrl,
      videoUrl: product.videoUrl || null,
      withVendor: product.withVendor || [],
    });
  };

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden bg-gray-900">
      <CategoriesNav
        mainCategories={mainCategories}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        selectedSecondSubCategory={selectedSecondSubCategory}
        onCategorySelect={handleCategorySelect}
        onSubCategorySelect={handleSubCategorySelect}
        onSecondSubCategorySelect={handleSecondSubCategorySelect}
        getSubCategories={getSubCategories}
        getSecondSubCategories={getSecondSubCategories}
        loading={categoriesLoading}
      />
      <div className="container px-4 pt-6 mx-auto">
        <div className="p-4 mb-6 bg-gray-800 rounded-xl">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search saved products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 pl-10 text-white bg-gray-700 rounded-lg focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
            />
            <Search className="absolute w-5 h-5 text-gray-400 left-3" />
          </div>
        </div>
        {selectedProducts.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 mb-4 text-white bg-red-600 rounded hover:bg-red-700"
          >
            Delete Selected ({selectedProducts.size})
          </button>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                selectedProducts={selectedProducts}
                toggleProductSelection={toggleProductSelection}
                handleEditClick={handleEditClick}
                handleDelete={handleDelete}
                fetchSavedProducts={fetchSavedProducts}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Search className="w-12 h-12 mb-4" />
            <p>No products found</p>
          </div>
        )}
        {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} setCurrentPage={setCurrentPage} />}
        {editingProduct && (
          <EditForm
            editingProduct={editingProduct}
            setEditingProduct={setEditingProduct}
            updateForm={updateForm}
            setUpdateForm={setUpdateForm}
            uploadType={uploadType}
            setUploadType={setUploadType}
            setUploading={setUploading} // Pass setUploading
            uploading={uploading}
            fetchSavedProducts={fetchSavedProducts}
          />
        )}
      </div>
    </div>
  );
};

export default SavedProducts;