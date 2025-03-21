import { CodeXml, Pen } from "lucide-react";
import Image from "next/image";
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
  // const links = JSON.parse(filterValue("Footer Links") || "null") || [];
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
      <footer className="pt-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="max-w-[1140px] mx-auto md:px-[15px]">
            <div className="animate-pulse">
              <div className="bg-gray-200 h-8 w-32 mb-4"></div>
              <div className="bg-gray-200 h-4 w-64 mb-2"></div>
              <div className="bg-gray-200 h-4 w-48 mb-2"></div>
              <div className="bg-gray-200 h-4 w-56"></div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className=" mt-10">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full px-4 md:px-[15px]">
          {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1">
              <div className="mb-4">
                <Image src="/logo.png" alt="E3 Logo" width={150} height={50} />
              </div>
              <ul className="space-y-2">
                {contactInfo &&
                  contactInfo.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
              <p className="space-y-2"> {contactInfo}</p>
              <p className="mb-2">Energy and Environmental Economics, Inc. (E3)</p>
                  <p className="mb-4">Part of the Willdan Group, Inc.</p>
                  <p className="mb-2">San Francisco 415.391.5100 | Boston 617.203.7689 | New York 646.699.3773</p>
                  <p>info@ethree.com</p>
            </div>

            Navigation Links 1
            <div className="flex justify-start md:justify-center">
              <div>
                <ul className="space-y-2">
                  {links.length > 0 && links.slice(0, 5).map((item,index)=>(
                    <li key={index}>
                    <Link href={item.link} className="hover:underline">
                        {item.label}
                    </Link>
                  </li>
                  ))}
                </ul>
              </div>
            </div>

            Navigation Links 2
            <div className="flex justify-start md:justify-center">
              <div>
                <ul className="space-y-2">
                  {links.length > 5 && links.slice(5).map((item,index)=>(
                    <li key={index}>
                    <Link href={item.link} className="hover:underline">
                        {item.label}
                    </Link>
                  </li>
                  ))}
                </ul>
              </div>
            </div>
          </div> */}

          {/* <div
            className="mb-6"
            style={{
              maxWidth: "350px",
              maxHeight: "60px",
              minHeight:"40px",
              minWidth:"50px",
              overflow: "hidden",
            }}
          >
            <Image
              src={
                user?.company?.logo
                  ? user.company.logo.replace("/api/upload", "/uploads")
                  : config?.logo || "/logo.png"
              }
              alt={config?.legalName || "Default Company Name"}
              width={75}
              height={75}
              style={{ width: "100%", height: "auto" }}
            />
          </div> */}
          {/* <img
            src={
              user?.company?.logo
                ? user.company.logo.replace("/api/upload", "/uploads")
                : config?.logo || "/logo.png"
            }
            alt={config?.legalName}
            className="mr-2 mb-5 max-h-[60px] max-w-[150px]"
          /> */}

          <div className="flex justify-between items-end flex-wrap">
            <div>
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
                        links.slice(0, 5).map((item, index) => (
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
                        links.slice(0, 5).map((item, index) => (
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
              <div className="md:mb-0">
                <div className="flex items-end gap-1">
                  <p className="text-xs text-[#6c757d] font-medium font-lato">
                    Powered By MStrategygroup © 2025
                  </p>
                  <span>
                      <img
                        src="/mstrategy_horizontal.jpg"
                        alt="Company Logo"
                        className="h-6 w-15 p-1"
                      />
                    </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="mt-8 pt-4 border-t border-white/20 text-sm">
            <div className="text-center"></div>
            <div className="text-center mt-2">© 2024 MStrategy Portal</div>
          </div> */}
      </div>
    </footer>
  );
};

export default Footer;
