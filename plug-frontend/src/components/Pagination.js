const Pagination = ({ currentPage, totalPages, setCurrentPage }) => {
    return (
      <div className="flex items-center justify-center gap-2 py-6 mt-6">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 text-white bg-gray-800 rounded disabled:opacity-50 hover:bg-gray-700"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNum = i + 1;
          if (
            pageNum === 1 ||
            pageNum === totalPages ||
            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
          ) {
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 rounded ${
                  currentPage === pageNum
                    ? 'bg-[#2ab6e4] text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </button>
            );
          } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
            return (
              <span key={pageNum} className="px-2 text-gray-400">
                ...
              </span>
            );
          }
          return null;
        })}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-white bg-gray-800 rounded disabled:opacity-50 hover:bg-gray-700"
        >
          Next
        </button>
      </div>
    );
  };
  
  export default Pagination;