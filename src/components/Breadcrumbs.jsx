import { ChevronRight } from "lucide-react";

const Breadcrumbs = ({ path, setPath, setSearchQuery, user, setSelectedBulkItems }) => {
  const handleBreadcrumbClick = (index) => {
    setSearchQuery("");
    setSelectedBulkItems([])
    if (index === -1) {
      setPath([]);
    } else {
      setPath((prev) => prev.slice(0, index + 1));
    }
  };

  return (
    <div className="max-w-full overflow-x-auto">
      <nav className="flex items-center text-gray-500 text-sm xl:text-sm space-x-1 py-1.5 whitespace-nowrap">
        <button
          onClick={() => handleBreadcrumbClick(-1)}
          className="text-gray-500 transition-colors font-normal hover:text-gray-950 font-lato"
        >
          All Documents
        </button>
        {path &&
          path.length > 0 &&
          path.map((p, index) => (
            <div key={p.id} className="flex items-center">
              <ChevronRight className="h-5 w-5" />
              <button
                onClick={() => handleBreadcrumbClick(index)}
                className="text-gray-500 transition-colors text-sm font-normal hover:text-gray-950 font-lato"
              >
                {p.name}
              </button>
            </div>
          ))}
      </nav>
    </div>
  );
};

export default Breadcrumbs;
