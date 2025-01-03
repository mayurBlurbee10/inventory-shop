

import { ChevronRight } from "lucide-react";

const Breadcrumbs = ({ path, setPath }) => {
  const handleBreadcrumbClick = (index) => {
    setPath((prev) => prev.slice(0, index + 1));
  };

  return (
    <nav className="flex items-center text-gray-500 text-sm xl:text-base space-x-1 py-1.5">
      <button
        onClick={() => setPath([])}
        className="text-gray-700 transition-colors font-semibold hover:text-gray-950"
      >
        My Files
      </button>
      {path &&
        path.length > 0 &&
        path.map((p, index) => (
          <div key={p.id} className="flex items-center">
            <ChevronRight className="h-5 w-5" />
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className="text-gray-700 transition-colors font-semibold hover:text-gray-950"
            >
              {p.name}
            </button>
          </div>
        ))}
    </nav>
  );
};

export default Breadcrumbs
