import React, { useState} from 'react';
import { DollarSign } from 'lucide-react';

const PriceFilter = ({ onPriceChange }) => {
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleMinPriceChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setMinPrice(value);
    }
  };

  const handleMaxPriceChange = (e) => {
    const value = e.target.value;
    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
      setMaxPrice(value);
    }
  };

  const handleApplyFilter = () => {
    // Convert empty strings to null
    const min = minPrice === '' ? null : parseFloat(minPrice);
    const max = maxPrice === '' ? null : parseFloat(maxPrice);
    
    // Validate min is not greater than max
    if (min !== null && max !== null && min > max) {
      alert('Minimum price cannot be greater than maximum price');
      return;
    }
    
    onPriceChange({
      min: min,
      max: max
    });
  };

  const handleClearFilter = () => {
    setMinPrice('');
    setMaxPrice('');
    onPriceChange({ min: null, max: null });
  };

  // Apply filter when Enter key is pressed
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleApplyFilter();
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-lg backdrop-blur-sm">
      <DollarSign className="w-5 h-5 text-gray-400" />
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Min"
          value={minPrice}
          onChange={handleMinPriceChange}
          onKeyPress={handleKeyPress}
          className="w-24 px-3 py-2 text-black bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] placeholder-gray-400"
          min="0"
          step="any"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          placeholder="Max"
          value={maxPrice}
          onChange={handleMaxPriceChange}
          onKeyPress={handleKeyPress}
          className="w-24 px-3 py-2 text-black bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ab6e4] placeholder-gray-400"
          min="0"
          step="any"
        />
      </div>
      <button
        onClick={handleApplyFilter}
        className="px-4 py-2 text-white rounded-lg bg-[#6f1f76] hover:opacity-90"
      >
        Apply
      </button>
      {(minPrice || maxPrice) && (
        <button
          onClick={handleClearFilter}
          className="px-4 py-2 text-gray-300 border border-gray-500 rounded-lg hover:border-gray-400 hover:text-white"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default PriceFilter;