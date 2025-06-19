import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, AlertCircle, Pen, Search } from 'lucide-react';
import axios from 'axios';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [newSubcategories, setNewSubcategories] = useState({});
  const [newSecondSubcategories, setNewSecondSubcategories] = useState({});
  const [cat, setCat] = useState('');
  const [searchTerms, setSearchTerms] = useState({});

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_BASEURL}/api/admin/categories`, {
        params: { email: process.env.REACT_APP_ADMIN_EMAIL }
      });
      setCategories(response.data.categories);
      console.log(response.data.categories)
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

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/categories`,
        { name: newCategory.trim() },
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      setNewCategory('');
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/categories/${categoryId}`,
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleAddSubcategory = async (categoryId) => {
    const subcategoryName = newSubcategories[categoryId]?.trim();
    if (!subcategoryName) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/categories/${categoryId}/subcategories`,
        { subcategoryName },
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      setNewSubcategories(prev => ({ ...prev, [categoryId]: '' }));
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add subcategory');
    }
  };

  const handleDeleteSubcategory = async (categoryId, subcategoryId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/categories/${categoryId}/subcategories/${subcategoryId}`,
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      setError(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      setError(err.response?.data?.message || 'Failed to delete subcategory');
    }
  };

  const handleAddSecondSubcategory = async (categoryId, subcategoryId) => {
    const secondSubcategoryName = newSecondSubcategories[`${categoryId}-${subcategoryId}`]?.trim();
    if (!secondSubcategoryName) return;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/categories/${categoryId}/subcategories/${subcategoryId}/second-subcategories`,
        { secondSubcategoryName },
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      setNewSecondSubcategories(prev => ({ ...prev, [`${categoryId}-${subcategoryId}`]: '' }));
      await fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add second-level subcategory');
    }
  };

  const handleDeleteSecondSubcategory = async (categoryId, subcategoryId, secondSubcategoryId) => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/categories/${categoryId}/subcategories/${subcategoryId}/second-subcategories/${secondSubcategoryId}`,
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      setError(null);
      await fetchCategories();
    } catch (err) {
      console.error('Error deleting second-level subcategory:', err);
      setError(err.response?.data?.message || 'Failed to delete second-level subcategory');
    }
  };

  const changeCat = async (e) => {
    if (e.key !== 'Enter') return; 
    const id = e.target.dataset.id;
    const newName = e.target.value; 
  
    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/changesubcategory`,
        { prev: id, neww: newName, email: process.env.REACT_APP_ADMIN_EMAIL },
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update category');
    } finally {
      setCat('');
    }
  };

  const changeSecondSubcat = async (e, categoryId, subcategoryId) => {
    if (e.key !== 'Enter') return;
    const id = e.target.dataset.id;
    const newName = e.target.value;

    try {
      await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/changesecondsubcategory`,
        { prev: id, neww: newName, categoryId, subcategoryId, email: process.env.REACT_APP_ADMIN_EMAIL },
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      await fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update second-level subcategory');
    } finally {
      setCat('');
    }
  };

  const handleSearchChange = (categoryId, term) => {
    setSearchTerms(prev => ({
      ...prev,
      [categoryId]: term
    }));
  };

  const filterSubcategories = (category) => {
    const searchTerm = searchTerms[category._id] || '';
    if (!searchTerm.trim()) return category.subcategories || [];
    
    return category.subcategories?.filter(subcategory =>
      subcategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcategory.secondSubcategories?.some(secondSub =>
        secondSub.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ) || [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[#2ab6e4]"></div>
      </div>
    );
  }

  return (
    <div className="container px-4 mx-auto">
      {error && (
        <div className="p-4 mb-4 text-red-500 bg-red-100 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Add New Category */}
      <div className="p-6 mb-6 bg-gray-800 rounded-xl">
        <h3 className="mb-4 text-xl font-bold text-white">Add New Category</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter category name"
            className="flex-1 px-4 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
          />
          <button
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}
            className="flex items-center justify-center px-6 py-2 text-white transition-all rounded bg-[#2ab6e4] hover:bg-[#2ab6e4]/80 disabled:opacity-50 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category._id} className="p-6 transition-all bg-gray-800 rounded-xl hover:shadow-lg hover:shadow-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">{category.name}</h3>
              <button
                onClick={() => handleDeleteCategory(category._id)}
                className="p-2 text-red-500 transition-all rounded hover:bg-gray-700 hover:scale-110"
                title="Delete Category"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar for Subcategories */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerms[category._id] || ''}
                onChange={(e) => handleSearchChange(category._id, e.target.value)}
                placeholder="Search subcategories..."
                className="w-full px-4 py-2 pl-10 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
              />
            </div>

            {/* Subcategories */}
            <div className="mt-4">
              {filterSubcategories(category).length > 0 ? (
                <div className="space-y-4">
                  {filterSubcategories(category).map((subcategory) => (
                    <div key={subcategory._id} className="ml-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="relative flex items-center gap-2 px-4 py-2 bg-gray-700 rounded-lg group hover:bg-gray-600">
                          {cat === subcategory.name ? (
                            <input
                              type="text"
                              placeholder="Press Enter to save"
                              onKeyDown={changeCat}
                              data-id={subcategory.name}
                              defaultValue={subcategory.name}
                              className="px-3 py-1 text-white bg-gray-600 rounded focus:ring-2 focus:ring-[#2ab6e4]"
                            />
                          ) : (
                            <span className="text-gray-200">{subcategory.name}</span>
                          )}
                          <div className="flex space-x-1">
                            <button
                              onClick={() => setCat(subcategory.name)}
                              className="p-1 text-gray-300 rounded hover:text-white hover:bg-gray-500"
                              title="Edit"
                            >
                              <Pen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(category._id, subcategory._id)}
                              className="p-1 text-gray-300 rounded hover:text-red-500 hover:bg-gray-500"
                              title="Delete"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Second-level Subcategories */}
                      <div className="ml-8">
                        {subcategory.secondSubcategories?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {subcategory.secondSubcategories.map((secondSub) => (
                              <div
                                key={secondSub._id}
                                className="relative flex items-center gap-2 px-3 py-1 bg-gray-600 rounded-lg group hover:bg-gray-500"
                              >
                                {cat === secondSub.name ? (
                                  <input
                                    type="text"
                                    placeholder="Press Enter to save"
                                    onKeyDown={(e) => changeSecondSubcat(e, category._id, subcategory._id)}
                                    data-id={secondSub.name}
                                    defaultValue={secondSub.name}
                                    className="px-2 py-1 text-white bg-gray-500 rounded focus:ring-2 focus:ring-[#2ab6e4]"
                                  />
                                ) : (
                                  <span className="text-gray-300">{secondSub.name}</span>
                                )}
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => setCat(secondSub.name)}
                                    className="p-1 text-gray-300 rounded hover:text-white hover:bg-gray-400"
                                    title="Edit"
                                  >
                                    <Pen className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSecondSubcategory(category._id, subcategory._id, secondSub._id)}
                                    className="p-1 text-gray-300 rounded hover:text-red-500 hover:bg-gray-400"
                                    title="Delete"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add New Second-level Subcategory */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newSecondSubcategories[`${category._id}-${subcategory._id}`] || ''}
                            onChange={(e) => setNewSecondSubcategories(prev => ({
                              ...prev,
                              [`${category._id}-${subcategory._id}`]: e.target.value
                            }))}
                            placeholder="Add new second-level subcategory"
                            className="flex-1 px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddSecondSubcategory(category._id, subcategory._id)}
                            disabled={!newSecondSubcategories[`${category._id}-${subcategory._id}`]?.trim()}
                            className="flex items-center justify-center px-4 py-2 text-white transition-all rounded bg-[#2ab6e4] hover:bg-[#2ab6e4]/80 disabled:opacity-50 hover:scale-105"
                            title="Add Second-level Subcategory"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No subcategories found</p>
              )}
              
              {/* Add New Subcategory */}
              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={newSubcategories[category._id] || ''}
                  onChange={(e) => setNewSubcategories(prev => ({
                    ...prev,
                    [category._id]: e.target.value
                  }))}
                  placeholder="Add new subcategory"
                  className="flex-1 px-4 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
                />
                <button
                  onClick={() => handleAddSubcategory(category._id)}
                  disabled={!newSubcategories[category._id]?.trim()}
                  className="flex items-center justify-center px-4 py-2 text-white transition-all rounded bg-[#2ab6e4] hover:bg-[#2ab6e4]/80 disabled:opacity-50 hover:scale-105"
                  title="Add Subcategory"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManagement;