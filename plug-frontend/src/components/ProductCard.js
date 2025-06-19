import { useState } from "react";
import { Trash2, ExternalLink, Edit2 } from 'lucide-react';
import EditImage from './EditImage'

const ProductCard = ({ product, selectedProducts, toggleProductSelection, handleEditClick, handleDelete, fetchSavedProducts }) => {
  const [isOpen, setIsOpen] = useState(false);


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
    <>
      <div className="relative overflow-hidden bg-gray-800 rounded-xl hover:ring-2 hover:ring-[#2ab6e4] transition-all">
        <input
          type="checkbox"
          className="absolute z-20 w-5 h-5 top-3 left-3"
          checked={selectedProducts.has(product.productId)}
          onChange={() => toggleProductSelection(product.productId)}
        />
        <div className="relative">
          <img
            src={getImageUrl(product.imageUrl)}
            alt={product.title}
            className="object-cover w-full aspect-square"
          />
          <div className="absolute flex gap-2 top-2 right-2">
            <button
              onClick={() => handleEditClick(product)}
              className="p-2 transition-colors bg-blue-500 rounded-full hover:bg-blue-600"
            >
              <Edit2 className="w-5 h-5 text-white" />
            </button>
            <a
              href={product.detailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 transition-colors bg-blue-500 rounded-full hover:bg-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-5 h-5 text-white" />
            </a>
            <button
              onClick={(e) => handleDelete(e, product.productId)}
              className="p-2 transition-colors bg-red-500 rounded-full hover:bg-red-600"
            >
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <h4 className="mb-2 font-semibold text-white line-clamp-2">{product.title}</h4>
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <p className="text-[#2ab6e4] font-bold text-xl">${(product.price ? parseFloat(product.price).toFixed(2) : '0.00')}</p>
            </div>
            <p className="text-sm text-gray-400">{product.seller}</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-sm">
              <span className="text-gray-400">Category:</span>
              <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-white">{product.category}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-400">Subcategory:</span>
              <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-white">{product.subcategory || 'None'}</span>
            </div>
            {product.secondSubcategory && (
              <div className="flex items-center text-sm">
                <span className="text-gray-400">Second Subcategory:</span>
                <span className="ml-2 px-2 py-0.5 bg-gray-700 rounded text-white">{product.secondSubcategory}</span>
              </div>
            )}
          </div>
          <div className="flex justify-end items-center text-sm mt-4">
            <button
              onClick={() => setIsOpen(true)}
              className="px-4 py-2 text-white transition-all rounded bg-[#2ab6e4] hover:bg-[#2ab6e4]/80 disabled:opacity-50 hover:scale-105"
            >Create</button>
          </div>
        </div>
      </div>

      <EditImage
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        product={product}
        fetchSavedProducts={fetchSavedProducts}
      />
    </>
  );
};

export default ProductCard;