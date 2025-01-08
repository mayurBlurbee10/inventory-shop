import Image from "next/image";
import Link from "next/link";

const PortalFooter = ({ config, filterValue }) => {
  // const contactInfo = filterValue("Contact Info").split("\n");
  const contactInfo = 'San Francisco 415.391.5100 | Boston 617.203.7689 | New York 646.699.3773'.split("\n");
  return (
    <footer className="bg-[#929493] text-white py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="mb-4">
              <Image
                src={config?.logo}
                alt={config?.legalName || "Default Company Name"}
                width={50}
                height={50}
                style={{ width: "auto", height: "auto" }}
              />
              {/* <img src={config?.logo} alt={config?.legalName} width="auto" height="auto" className='w-auto h-12'/> */}
            </div>
            {/* <p className="mb-2">Energy and Environmental Economics, Inc. (E3)</p>
                <p className="mb-4">Part of the Willdan Group, Inc.</p> */}
            {/* San Francisco 415.391.5100 | Boston 617.203.7689 | New York
              646.699.3773 */}
            <ul className="space-y-2">
              {contactInfo &&
                contactInfo.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
            {/* <p>info@ethree.com</p> */}
          </div>

          {/* Navigation Links 1 */}
          <div className="flex justify-start md:justify-center">
            <div>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:underline">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Our people
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Our clients
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Areas of expertise
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Tools
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Navigation Links 2 */}
          <div className="flex justify-start md:justify-center">
            <div>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:underline">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    News and Notes
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Public proceedings
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Contact
                  </Link>
                </li>
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
