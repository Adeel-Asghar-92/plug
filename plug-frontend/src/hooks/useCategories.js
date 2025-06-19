import { useState, useEffect } from 'react';
import axios from 'axios';

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/admin/categories`, {
        params: { email: process.env.REACT_APP_ADMIN_EMAIL }
      });
      setCategories(response.data.categories || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const getMainCategories = () => {
    return ['All', ...categories.map(cat => cat.name)];
  };

  const getSubCategories = (categoryName) => {
    if (categoryName === 'All') return ['All'];
    const category = categories.find(cat => cat.name === categoryName);
    return category ? ['All', ...category.subcategories.map(sub => sub.name)] : ['All'];
  };

  const getSecondSubCategories = (categoryName, subCategoryName) => {
    if (categoryName === 'All' || subCategoryName === 'All') return ['All'];
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return ['All'];
    const subcategory = category.subcategories.find(sub => sub.name === subCategoryName);
    return subcategory ? ['All', ...(subcategory.secondSubcategories?.map(second => second.name) || [])] : ['All'];
  };

  return {
    categories,
    loading,
    error,
    getMainCategories,
    getSubCategories,
    getSecondSubCategories, // Added
    refreshCategories: fetchCategories
  };
};

export default useCategories;