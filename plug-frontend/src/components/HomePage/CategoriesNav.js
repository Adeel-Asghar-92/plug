import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CategoriesNav = ({ 
  mainCategories = [],
  selectedCategory,
  selectedSubCategory,
  selectedSecondSubCategory, // Added
  onCategorySelect,
  onSubCategorySelect,
  onSecondSubCategorySelect, // Added
  getSubCategories,
  getSecondSubCategories, // Added
  loading = false
}) => {
  const mainScrollRef = useRef(null);
  const subScrollRef = useRef(null);
  const secondSubScrollRef = useRef(null); // Added
  const [showMainLeftChevron, setShowMainLeftChevron] = useState(false);
  const [showMainRightChevron, setShowMainRightChevron] = useState(true);
  const [showSubLeftChevron, setShowSubLeftChevron] = useState(false);
  const [showSubRightChevron, setShowSubRightChevron] = useState(true);
  const [showSecondSubLeftChevron, setShowSecondSubLeftChevron] = useState(false); // Added
  const [showSecondSubRightChevron, setShowSecondSubRightChevron] = useState(true); // Added

  // Check scroll positions on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      checkScrollPosition(mainScrollRef, setShowMainLeftChevron, setShowMainRightChevron);
      if (selectedCategory !== 'All') {
        checkScrollPosition(subScrollRef, setShowSubLeftChevron, setShowSubRightChevron);
      }
      if (selectedSubCategory !== 'All') {
        checkScrollPosition(secondSubScrollRef, setShowSecondSubLeftChevron, setShowSecondSubRightChevron); // Added
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedCategory, selectedSubCategory]); // Added selectedSubCategory dependency

  const scroll = (direction, ref, amount = 300) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -amount : amount;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const checkScrollPosition = (ref, setLeftChevron, setRightChevron) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setLeftChevron(scrollLeft > 0);
      setRightChevron(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const handleScroll = (ref, setLeftChevron, setRightChevron) => {
    checkScrollPosition(ref, setLeftChevron, setRightChevron);
  };

  // Enhanced Chevron Button Component
  const ChevronButton = ({ direction, onClick, show, className = "" }) => {
    if (!show) return null;
    
    return (
      <button 
        onClick={onClick}
        className={`
          absolute top-1/2 -translate-y-1/2 h-14
          z-20 hidden sm:flex items-center justify-center
          transition-all duration-200 hover:scale-105
          ${direction === 'left' ? '-left-2' : '-right-2'}
          ${className}
        `}
      >
        <div className={`
          flex items-center justify-center w-10 h-14
          bg-gray-900/90 backdrop-blur
          ${direction === 'left' ? 'rounded-r-2xl pl-1' : 'rounded-l-2xl pr-1'}
          shadow-xl shadow-black/20
          hover:bg-gray-800/90
        `}>
          {direction === 'left' 
            ? <ChevronLeft className="w-7 h-7 text-white/90" />
            : <ChevronRight className="w-7 h-7 text-white/90" />
          }
        </div>
      </button>
    );
  };

  // Mobile Chevron Button Component
  const MobileChevronButton = ({ direction, onClick, show }) => {
    if (!show) return null;
    
    return (
      <button 
        onClick={onClick}
        className={`
          absolute top-1/2 -translate-y-1/2
          z-20 flex sm:hidden items-center justify-center
          ${direction === 'left' ? 'left-0' : 'right-0'}
          w-8 h-12 bg-gray-900/90 backdrop-blur
          ${direction === 'left' ? 'rounded-r-lg' : 'rounded-l-lg'}
        `}
      >
        {direction === 'left' 
          ? <ChevronLeft className="w-5 h-5 text-white/90" />
          : <ChevronRight className="w-5 h-5 text-white/90" />
        }
      </button>
    );
  };

  if (loading) {
    return (
      <div className="w-full h-24 bg-gray-800/50 animate-pulse">
        <div className="mx-auto max-w-[1400px]">
          <div className="h-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-[#13111C]">
      <div className="relative mx-auto">
        {/* Main Categories */}
        <div className="relative">
          <div 
            ref={mainScrollRef}
            onScroll={() => handleScroll(mainScrollRef, setShowMainLeftChevron, setShowMainRightChevron)}
            className="flex gap-2 px-2 py-4 overflow-x-auto sm:px-4 scroll-smooth hide-scrollbar"
          >
            {mainCategories.map((category) => (
              <button
                key={category}
                onClick={() => onCategorySelect(category)}
                className={`
                  px-4 sm:px-6 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300
                  font-medium text-sm flex-shrink-0
                  ${selectedCategory === category
                    ? 'bg-gradient-to-r from-[#9f17c975] to-[#2ab6e4] text-white shadow-lg shadow-purple-500/30 scale-105'
                    : 'bg-[#3a2e7f] text-gray-300 hover:bg-[#4d37cc] hover:text-white'}
                `}
              >
                {category}
              </button>
            ))}
          </div>
          <ChevronButton 
            direction="left"
            onClick={() => scroll('left', mainScrollRef)}
            show={showMainLeftChevron}
          />
          <MobileChevronButton 
            direction="left"
            onClick={() => scroll('left', mainScrollRef)}
            show={showMainLeftChevron}
          />
          <ChevronButton 
            direction="right"
            onClick={() => scroll('right', mainScrollRef)}
            show={showMainRightChevron}
          />
          <MobileChevronButton 
            direction="right"
            onClick={() => scroll('right', mainScrollRef)}
            show={showMainRightChevron}
          />
        </div>

        {/* Subcategories */}
        <div 
          className={`
            transition-all duration-300 overflow-hidden border-gray-700/50
            ${selectedCategory !== 'All' ? 'h-16' : 'h-0'}
          `}
        >
          {selectedCategory !== 'All' && (
            <div className="relative">
              <div 
                ref={subScrollRef}
                onScroll={() => handleScroll(subScrollRef, setShowSubLeftChevron, setShowSubRightChevron)}
                className="flex gap-2 px-2 py-4 overflow-x-auto sm:px-4 scroll-smooth hide-scrollbar"
              >
                {getSubCategories(selectedCategory).map((subcat) => (
                  <button
                    key={subcat}
                    onClick={() => onSubCategorySelect(subcat)}
                    className={`
                      px-3 sm:px-4 py-1.5 rounded-lg whitespace-nowrap text-sm transition-all duration-300 flex-shrink-0
                      ${selectedSubCategory === subcat
                        ? 'bg-[#125166] text-white shadow-md shadow-blue-500/30 font-medium'
                        : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white'}
                    `}
                  >
                    {subcat}
                  </button>
                ))}
              </div>
              <ChevronButton 
                direction="left"
                onClick={() => scroll('left', subScrollRef)}
                show={showSubLeftChevron}
              />
              <MobileChevronButton 
                direction="left"
                onClick={() => scroll('left', subScrollRef)}
                show={showSubLeftChevron}
              />
              <ChevronButton 
                direction="right"
                onClick={() => scroll('right', subScrollRef)}
                show={showSubRightChevron}
              />
              <MobileChevronButton 
                direction="right"
                onClick={() => scroll('right', subScrollRef)}
                show={showSubRightChevron}
              />
            </div>
          )}
        </div>

        {/* Second Subcategories */}
        <div 
          className={`
            transition-all duration-300 overflow-hidden border-gray-700/50
            ${selectedSubCategory !== 'All' ? 'h-16' : 'h-0'}
          `}
        >
          {selectedSubCategory !== 'All' && (
            <div className="relative">
              <div 
                ref={secondSubScrollRef}
                onScroll={() => handleScroll(secondSubScrollRef, setShowSecondSubLeftChevron, setShowSecondSubRightChevron)}
                className="flex gap-2 px-2 py-4 overflow-x-auto sm:px-4 scroll-smooth hide-scrollbar"
              >
                {getSecondSubCategories(selectedCategory, selectedSubCategory).map((secondSubcat) => (
                  <button
                    key={secondSubcat}
                    onClick={() => onSecondSubCategorySelect(secondSubcat)}
                    className={`
                      px-3 sm:px-4 py-1.5 rounded-lg whitespace-nowrap text-sm transition-all duration-300 flex-shrink-0
                      ${selectedSecondSubCategory === secondSubcat
                        ? 'bg-[#125166] text-white shadow-md shadow-blue-500/30 font-medium'
                        : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white'}
                    `}
                  >
                    {secondSubcat}
                  </button>
                ))}
              </div>
              <ChevronButton 
                direction="left"
                onClick={() => scroll('left', secondSubScrollRef)}
                show={showSecondSubLeftChevron}
              />
              <MobileChevronButton 
                direction="left"
                onClick={() => scroll('left', secondSubScrollRef)}
                show={showSecondSubLeftChevron}
              />
              <ChevronButton 
                direction="right"
                onClick={() => scroll('right', secondSubScrollRef)}
                show={showSecondSubRightChevron}
              />
              <MobileChevronButton 
                direction="right"
                onClick={() => scroll('right', secondSubScrollRef)}
                show={showSecondSubRightChevron}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add a style to hide scrollbars while keeping functionality
const style = document.createElement('style');
style.textContent = `
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
`;
document.head.appendChild(style);

export default CategoriesNav;