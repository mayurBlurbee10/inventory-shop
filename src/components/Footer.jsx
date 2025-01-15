import { CodeXml } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Footer = ({ filterValue }) => {
  // const contactInfo = filterValue("Footer Content").split("\n");
  // const links = JSON.parse(filterValue("Footer Links") || "null") || [];
  return (
    <footer className=" pt-12 mt-auto">
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

          <div>
            <div>
              <p className="text-sm text-[#6c757d] font-medium font-lato mb-1">
                Careers | Legal | Help Center | Blog
              </p>
              <div className="flex items-center justify-between flex-col md:flex-row">
                <div className="max-w-[670px] w-full">
                  <p className="text-xs text-[#6c757d] font-normal mb-2 leading-6 font-lato">
                    Wealthportal is not an SEC-registered investment adviser. No
                    need to read our Full Disclosure for important details since
                    it doesn't exist. <span>©2017 Wealthportal, Inc.</span>
                  </p>
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
      </div>
    </footer>
  );
};

export default Footer;
