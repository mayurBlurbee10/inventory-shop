import Image from "next/image";
import Link from "next/link";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";

const PortalFooter = ({ config, filterValue }) => {
  const contactInfo = filterValue("Footer Content").split("\n");
  const isValidJSON = (str) => {
    try {
      JSON.parse(str);
      return true; // It's valid JSON
    } catch (error) {
      return false; // It's not valid JSON
    }
  };
  const links = (() => {
    try {
      const filteredValue = filterValue("Footer Links");
      if(isValidJSON(filteredValue)){
        const parsedLinks = filteredValue ? JSON.parse(filteredValue) : null;
        return Array.isArray(parsedLinks) ? parsedLinks : filteredValue;
      }
    } catch (error) {
      console.error("Error parsing Footer Links:", error);
      return [];
    }
  })();

  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoaderSpinner size={24} className="text-blue-500" />
    </div>
  );

  if(!config || !config.logo) {
    return <LoadingSpinner/>
  }
  return (
    <footer className="bg-[#929493] text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="mb-4">
              <Image
                src={config?.logo}
                alt={config?.legalName || "Default Company Name"}
                width={75}
                height={75}
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <ul className="space-y-2">
              {contactInfo &&
                contactInfo.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>

          {!links&& (
            <div>Footer Links</div>
          )}

          {/* Navigation Links 1 */}
          <div className="flex justify-start md:justify-center">
            <div>
              <ul className="space-y-2">
                {links && links.length > 0 &&
                  links.slice(0, 5).map((item, index) => (
                    <li key={index}>
                      <Link href={item.link} className="hover:underline">
                        {item.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>

          {/* Navigation Links 2 */}
          <div className="flex justify-start md:justify-center">
            <div>
              <ul className="space-y-2">
                {links && links.length > 5 &&
                  links.slice(5).map((item, index) => (
                    <li key={index}>
                      <Link href={item.link} className="hover:underline">
                        {item.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/20 text-sm">
          <div className="text-center"></div>
          <div className="text-center mt-2">© 2024 MStrategy Portal</div>
        </div>
      </div>
    </footer>
  );
};

export default PortalFooter;
