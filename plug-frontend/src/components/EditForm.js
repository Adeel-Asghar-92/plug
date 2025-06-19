import { X } from "lucide-react";
import axios from "axios";
import { useState } from "react";

const EditForm = ({
  editingProduct,
  setEditingProduct,
  updateForm,
  setUpdateForm,
  uploadType,
  setUploadType,
  uploading,
  setUploading,
  fetchSavedProducts, // Added to refresh products after update
}) => {
  const [newVendor, setNewVendor] = useState({
    imageUrl: "",
    sourceUrl: "",
    imageFile: null,
    price: 0,
  });
  const [updateCompanyDetails, setUpdateCompanyDetails] = useState("no");

  console.log(editingProduct);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleNewVendorChange = (e) => {
    const { name, value } = e.target;
    setNewVendor((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleNewVendorFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewVendor((prev) => ({
        ...prev,
        imageFile: file,
        imageUrl: URL.createObjectURL(file),
      }));
    }
  };

  const addNewVendor = () => {
    if (newVendor.imageUrl && newVendor.sourceUrl && newVendor.price >= 0) {
      setUpdateForm((prev) => ({
        ...prev,
        withVendor: [...prev.withVendor, newVendor],
      }));
      setNewVendor({ imageUrl: "", sourceUrl: "", imageFile: null, price: 0 });
    }
  };

  const removeVendor = (index) => {
    setUpdateForm((prev) => ({
      ...prev,
      withVendor: prev.withVendor.filter((_, i) => i !== index),
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const updateData = {
        title: updateForm.title,
        price: updateForm.price,
        imageUrl: updateForm.imageUrl,
        withVendor: updateForm.withVendor,
        updateCompanyDetails: updateCompanyDetails,
        seller: updateForm.seller,
        videoUrl:
          updateForm?.videoUrl?.trim()?.length> 0 ? updateForm.videoUrl : null,
      };

      const response = await axios.put(
        `${process.env.REACT_APP_API_BASEURL}/api/admin/products/${editingProduct.productId}`,
        updateData,
        {
          params: { email: process.env.REACT_APP_ADMIN_EMAIL },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        alert("Product updated successfully");
        await fetchSavedProducts(); // Refresh product list
        setEditingProduct(null);
      }
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    } finally {
      setUploading(false);
      setUpdateCompanyDetails("no");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-xl p-6 bg-gray-800 rounded-xl max-h-[calc(100vh-2rem)] overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Edit Product</h3>
          <button
            onClick={() => setEditingProduct(null)}
            className="p-1 hover:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          {/* Form fields for title, price, image, etc. */}
          <div>
            <label className="block mb-2 text-sm text-gray-400">Title</label>
            <input
              type="text"
              name="title"
              value={updateForm.title || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm text-gray-400">Price</label>
            <input
              type="number"
              name="price"
              value={updateForm.price || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Image URL
            </label>
            <input
              type="text"
              name="imageUrl"
              value={updateForm.imageUrl || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Video URL (optional)
            </label>
            <input
              type="text"
              name="videoUrl"
              value={updateForm.videoUrl || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm text-gray-400">
              Seller
            </label>
            <input
              type="text"
              name="seller"
              value={updateForm.seller || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
            />
          </div>
          {/* Vendor management section */}
          <div className="space-y-4">
            <label className="block mb-2 text-sm text-gray-400">Vendors</label>
            {updateForm.withVendor.map((vendor, index) => (
              <div key={index} className="p-4 bg-gray-700 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white">Vendor {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeVendor(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-400">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={vendor.imageUrl}
                      readOnly
                      className="w-full px-3 py-2 text-white bg-gray-600 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">
                      Source URL
                    </label>
                    <input
                      type="text"
                      value={vendor.sourceUrl}
                      readOnly
                      className="w-full px-3 py-2 text-white bg-gray-600 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400">Price</label>
                    <input
                      type="number"
                      value={vendor.price}
                      readOnly
                      className="w-full px-3 py-2 text-white bg-gray-600 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  {vendor.imageUrl && (
                    <div>
                      <label className="block text-sm text-gray-400">
                        Preview
                      </label>
                      <img
                        src={vendor.imageUrl}
                        alt="Vendor Preview"
                        className="object-cover w-full h-24 rounded"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Add new vendor section */}
          <div className="space-y-4">
            <label className="block mb-2 text-sm text-gray-400">
              Add New Vendor
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setUploadType("url")}
                className={`flex-1 py-2 rounded ${
                  uploadType === "url"
                    ? "bg-[#2ab6e4] text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setUploadType("file")}
                className={`flex-1 py-2 rounded ${
                  uploadType === "file"
                    ? "bg-[#2ab6e4] text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                Upload File
              </button>
            </div>
            {uploadType === "url" ? (
              <div>
                <label className="block mb-2 text-sm text-gray-400">
                  Image URL
                </label>
                <input
                  type="text"
                  name="imageUrl"
                  value={newVendor.imageUrl}
                  onChange={handleNewVendorChange}
                  className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block mb-2 text-sm text-gray-400">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewVendorFileChange}
                  className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2ab6e4] file:text-white hover:file:bg-[#229ed4]"
                />
              </div>
            )}
            <div>
              <label className="block mb-2 text-sm text-gray-400">
                Source URL
              </label>
              <input
                type="text"
                name="sourceUrl"
                value={newVendor.sourceUrl}
                onChange={handleNewVendorChange}
                className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm text-gray-400">Price</label>
              <input
                type="number"
                name="price"
                value={newVendor.price}
                onChange={handleNewVendorChange}
                className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
                step="0.01"
                min="0"
              />
            </div>
            {newVendor.imageUrl && (
              <div>
                <label className="block mb-2 text-sm text-gray-400">
                  Preview
                </label>
                <img
                  src={newVendor.imageUrl}
                  alt="New Vendor Preview"
                  className="object-cover w-full h-24 rounded"
                />
              </div>
            )}
            <button
              type="button"
              onClick={addNewVendor}
              disabled={
                !newVendor.imageUrl ||
                !newVendor.sourceUrl ||
                newVendor.price < 0
              }
              className="px-4 py-2 text-white rounded bg-[#2ab6e4] hover:bg-[#229ed4] disabled:opacity-50"
            >
              Add Vendor
            </button>
          </div>
          {/* Form submission buttons */}
          <div className="flex items-center justify-between">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 text-white rounded bg-[#2ab6e4] hover:bg-[#229ed4] disabled:opacity-50"
              >
                {uploading ? "Updating..." : "Update"}
              </button>

              <button
                type="submit"
                disabled={uploading}
                onClick={() => {
                  setUpdateCompanyDetails("yes");
                }}
                className="px-4 py-2 text-white rounded bg-[#2ab6e4] hover:bg-[#229ed4] disabled:opacity-50"
              >
                {uploading
                  ? "Updating Company Details..."
                  : "Update Company Details"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditForm;
