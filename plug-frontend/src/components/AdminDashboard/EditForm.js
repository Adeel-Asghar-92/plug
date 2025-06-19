import { X } from "lucide-react";

const EditForm = ({
  editingProduct,
  setEditingProduct,
  updateForm,
  setUpdateForm,
  handleUpdateSubmit,
  uploadType,
  setUploadType,
  handleFileChange,
  uploading,
}) => {
  // Prevent default on all input changes to stop refresh
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    e.preventDefault(); // Prevent any default refresh
    setUpdateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-xl p-6 bg-gray-800 rounded-xl max-h-[calc(100vh-2rem)] overflow-auto ">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Edit Product</h3>
          <button
            onClick={() => setEditingProduct(null)}
            className="p-1 hover:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault(); // Prevent form submission refresh
            handleUpdateSubmit(e);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block mb-2 text-sm text-gray-400">Title</label>
            <input
              type="text"
              name="title"
              value={updateForm.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm text-gray-400">Price</label>
            <input
              type="number"
              name="price"
              step="0.01"
              value={updateForm.price}
              onChange={handleInputChange}
              className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
              required
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setUploadType("url");
              }}
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
              onClick={(e) => {
                e.preventDefault();
                setUploadType("file");
              }}
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
                value={updateForm.imageUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none"
                required
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
                onChange={handleFileChange}
                className="w-full px-3 py-2 text-white bg-gray-700 rounded focus:ring-2 focus:ring-[#2ab6e4] focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#2ab6e4] file:text-white hover:file:bg-[#229ed4]"
              />
            </div>
          )}

          {updateForm.imageUrl && (
            <div>
              <label className="block mb-2 text-sm text-gray-400">
                Preview
              </label>
              <img
                src={updateForm.imageUrl}
                alt="Preview"
                className="object-cover w-full h-48 rounded"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={uploading}
              className="px-4 py-2 text-white rounded bg-[#2ab6e4] hover:bg-[#229ed4] disabled:opacity-50"
            >
              Add new
            </button>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setEditingProduct(null);
                }}
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
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditForm;
