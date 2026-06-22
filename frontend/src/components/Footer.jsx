import { Pen } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const Footer = ({
  config,
  filterValue,
  from,
  handleModalOpenForEdit,
}) => {

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (config && typeof filterValue === "function") {
      setIsLoading(false);
    }
  }, [config, filterValue]);

  const isValidJSON = (str) => {
    try {
      JSON.parse(str);
      return true; // It's valid JSON
    } catch (error) {
      return false; // It's not valid JSON
    }
  };
  const contactInfo = filterValue("Footer Content")?.split("\n") || [];
  const links = (() => {
    try {
      const filteredValue = filterValue("Footer Links");
      if (isValidJSON(filteredValue)) {
        const parsedLinks = filteredValue ? JSON.parse(filteredValue) : null;
        return Array.isArray(parsedLinks) ? parsedLinks : filteredValue;
      }
    } catch (error) {
      console.error("Error parsing Footer Links:", error);
      return [];
    }
  })();
  const isFromAvailable = from;
  if (isLoading) {
    return (
      <footer className="pt-5 mt-auto">
        <div className="container px-4">
          <div className="max-w-[1140px] md:px-[15px]">
            <div className="animate-pulse flex justify-start items-start space-x-2">
              <div className="bg-gray-200 h-4 w-32 mb-1"></div>
              <div className="bg-gray-200 h-4 w-52 mb-1"></div>
              <div className="bg-gray-200 h-4 w-32 mb-1"></div>
              <div className="bg-gray-200 h-4 w-32 mb-1"></div>
              <div className="bg-gray-200 h-4 w-32 mb-1"></div>
              <div className="bg-gray-200 h-4 w-32 mb-1"></div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className="">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full px-4 md:px-[15px] flex justify-center">
          <div className="flex flex-col items-center flex-wrap w-full">
            <div className="w-full flex justify-center border-b border-gray-200 pb-[5px]">
              <div className="text-sm text-[#6c757d] font-medium font-lato">
                <div>
                  {isFromAvailable ? (
                    <div className="border border-dashed border-gray-400 pl-3 pr-8 relative">
                      <div
                        className="absolute top-0 right-0 p-1 cursor-pointer"
                        onClick={() =>
                          handleModalOpenForEdit &&
                          handleModalOpenForEdit("Footer Links")
                        }
                      >
                        <Pen className="size-4" />
                      </div>
                      {links &&
                        links.length > 0 &&
                        links.map((item, index) => (
                          <span key={index}>
                            {isFromAvailable ? (
                              <span className="px-[5px] text-gray-400 cursor-not-allowed text-xs">
                                {item.label}
                              </span>
                            ) : (
                              <Link
                                href={item.link}
                                className="hover:underline px-[5px] text-xs"
                              >
                                {item.label}
                              </Link>
                            )}
                            {index < links.length - 1 && " | "}
                          </span>
                        ))}
                      {!links && <div className="text-xs">Footer Links</div>}
                    </div>
                  ) : (
                    <div>
                      {links &&
                        links.length > 0 &&
                        links.map((item, index) => (
                          <span key={index}>
                            {isFromAvailable ? (
                              <span className="px-[5px] text-gray-400 cursor-not-allowed text-xs">
                                {item.label}
                              </span>
                            ) : (
                              <Link
                                href={item.link}
                                className="hover:underline px-[5px] text-xs"
                              >
                                {item.label}
                              </Link>
                            )}
                            {index < links.length - 1 && " | "}
                          </span>
                        ))}
                      {!links && <div className="text-xs">Footer Links</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="md:mb-0 pt-[8px]">
                <div className="flex items-end gap-1">
                  <span>
                      <img
                        src="/Powered_by_Mstrategy.png"
                        alt="Company Logo"
                        className="h-6 w-15 p-1"
                      />
                    </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
