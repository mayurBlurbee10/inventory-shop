import { CodeXml } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

const Footer = ({ config, filterValue, user, from }) => {

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (config && typeof filterValue === "function") {
      setIsLoading(false);
    }
  }, [config, filterValue]);

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

  const contactInfo = filterValue("Footer Content")?.split("\n") || [];
  const links = JSON.parse(filterValue("Footer Links") || "null") || [];
  const isFromAvailable = from;

  return (
    <footer className=" mt-auto">
      <div className="container mx-auto px-4">
        <div className="max-w-[1140px] mx-auto md:px-[15px]">
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

          <div className="mb-1"
            style={{
              maxWidth: "100px",
              maxHeight: "100px",
              overflow: "hidden",
            }}>
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
            {/* <img src={config?.logo} alt={config?.legalName} width="auto" height="auto" className='w-auto h-12'/> */}
          </div>


          <div>
            <div>
              <div className="text-sm text-[#6c757d] font-medium font-lato mb-1">
                <div>
                  <p>
                    {links.length > 0 && links.slice(0, 5).map((item, index) => (
                      <span key={index}>
                        <Link href={item.link} className={`hover:underline px-[5px] ${isFromAvailable ? 'pointer-events-none text-gray-400' : ''}`}                        >
                          {item.label}
                        </Link>
                        {index < links.length - 1 && ' | '}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </div>



            <div className="flex items-center justify-between flex-col md:flex-row">
              <div className="max-w-[670px] w-full">
                <ul className="text-xs text-[#6c757d] font-normal mb-2 leading-6 font-lato">
                  {contactInfo &&
                    contactInfo.map((item, index) => <li key={index}>{item}</li>)}
                  <span>©2017 Wealthportal, Inc.</span>
                </ul>

              </div>
              <div className="flex items-end text-end mb-2 md:mb-0">
                <div className="flex items-end gap-1">
                  <div className="text-[#6c757d]">
                    <CodeXml className="h-7 w-7" />
                  </div>
                  <p className="text-xs text-[#6c757d] font-medium font-lato">
                    by DemoEng
                  </p>
                </div>
                <span className="block ml-10 md:ml-12 text-xs text-[#6c757d] font-medium font-lato">
                  Add a customization to edit text
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="mt-8 pt-4 border-t border-white/20 text-sm">
            <div className="text-center"></div>
            <div className="text-center mt-2">© 2024 MStrategy Portal</div>
          </div> */}
      </div>
    </footer >
  );
};

export default Footer;
