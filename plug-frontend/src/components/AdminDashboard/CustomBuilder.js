import React, { useState, useEffect } from 'react';
import { Upload, X, AlertCircle, Image as ImageIcon, Trash2, Check } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import BuyerContactModal from './../Modals/BuyerContactModal'; // Adjust the path as needed

const CustomBuilder = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  const [isBuyerContactModalOpen, setIsBuyerContactModalOpen] = useState(false);

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
      setError('Failed to fetch images');
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', selectedFile);

      await axios.post(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/custom-builder/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          params: { email: process.env.REACT_APP_ADMIN_EMAIL }
        }
      );

      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('image-upload');
      if (fileInput) fileInput.value = '';
      
      setSuccessMessage('Image uploaded successfully!');
      await fetchImages(); // Refresh the images
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image');
      console.error('Error uploading image:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (imageId) => {
    setDeleteConfirmation(imageId);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;

    try {
      setDeleting(true);
      await axios.delete(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/custom-builder/${deleteConfirmation}`,
        { params: { email: process.env.REACT_APP_ADMIN_EMAIL } }
      );
      
      setSuccessMessage('Image deleted successfully!');
      await fetchImages(); // Refresh the images list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete image');
      console.error('Error deleting image:', err);
    } finally {
      setDeleting(false);
      setDeleteConfirmation(null); // Close the confirmation modal
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation(null);
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

      {successMessage && (
        <div className="p-4 mb-4 text-green-500 bg-green-100 rounded-lg">
          <div className="flex items-center">
            <Check className="w-5 h-5 mr-2" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Upload Section */}
      <div className="p-6 mb-6 bg-gray-800 rounded-xl">
        <h3 className="mb-4 text-xl font-bold text-white">Upload New Image</h3>
        <div className="mb-4">
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-gray-600 hover:border-[#2ab6e4]"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-400" />
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-medium">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, or GIF (MAX. 10MB)</p>
            </div>
            {selectedFile && (
              <div className="flex items-center mt-2 text-sm text-green-400">
                <span className="mr-2">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedFile(null);
                    document.getElementById('image-upload').value = '';
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </label>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-2 text-white rounded bg-[#2ab6e4] hover:bg-[#2ab6e4]/80 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
        </div>
      </div>

      {/* Images Gallery */}
      <div className="p-6 bg-gray-800 rounded-xl">
        <h3 className="mb-6 text-xl font-bold text-white">Uploaded Images</h3>
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <ImageIcon className="w-12 h-12 mb-2" />
            <p>No images uploaded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {images.map((image) => (
              <div key={image._id} className="overflow-hidden bg-gray-700 rounded-lg group relative">
                <div className="relative h-48">
                  <img
                    src={image.Image}
                    alt={image.name || 'Custom builder image'}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => handleDeleteClick(image._id)}
                      className="p-2 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600"
                      title="Delete image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-300 truncate">
                    {image.name || 'Image'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(image.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="p-6 bg-gray-800 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="mb-4 text-xl font-medium text-white">Confirm Deletion</h3>
            <p className="mb-6 text-gray-300">Are you sure you want to delete this image? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomBuilder; 