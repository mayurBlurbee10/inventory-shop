import Dashboard from "@/components/Dashboard";
import { ChevronRight, Ellipsis, Folder, Plus } from "lucide-react";

export default function HomePage() {
  // return <Dashboard fileType={'my'}/>;

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1820px] mx-auto pt-8">
        <div className="border border-solid border-[#d3d3d3] rounded-sm">
          <div className="py-3 bg-[#fcfcfc] flex items-center w-full px-5">
            <img src="/default_logo_purple.png" className="h-8 w-8" />

            <input
              type="search"
              className="w-full py-1.5 px-3 rounded-lg text-sm border border-solid border-[#d3d3d3] ml-5 outline-none focus:ring-1 focus:ring-[#d3d3d3]"
              placeholder="Search file and folders"
            />
          </div>
        </div>

        {/* breadcrumbs */}
        <div className="px-5 border-b">
          <div className="py-3 flex items-center justify-between">
            <div>
              <nav className="flex items-center text-gray-500 text-sm xl:text-sm space-x-1 py-1.5">
                <button className="text-gray-500 transition-colors font-normal hover:text-gray-950 font-lato">
                  emailID
                </button>

                <div className="flex items-center">
                  <ChevronRight className="h-5 w-5" />
                  <button className="text-gray-500 transition-colors text-sm font-normal hover:text-gray-950 font-lato">
                    Folder name
                  </button>
                </div>
              </nav>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <button className="hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="currentColor"
                  >
                    <path d="M22 12.999V20C22 20.5523 21.5523 21 21 21H13V12.999H22ZM11 12.999V21H3C2.44772 21 2 20.5523 2 20V12.999H11ZM11 3V10.999H2V4C2 3.44772 2.44772 3 3 3H11ZM21 3C21.5523 3 22 3.44772 22 4V10.999H13V3H21Z"></path>
                  </svg>
                </button>

                <div className="relative">
                  <button className="hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200">
                    <Plus />
                  </button>

                  <div className="absolute top-[50px] right-0 w-48 bg-white shadow-md p-3 rounded-md">
                    <ul>
                      <li>
                        <button className="p-3 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                          Upload
                        </button>
                      </li>
                      <li>
                        <button className="p-3 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                          New Folder
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* table */}

        <div>
          <table className="min-w-full divide-y divide-gray-200 overflow-auto">
            <thead>
              <tr>
                <th></th>
                <th className="text-[#808080] text-sm font-normal py-3 text-start">
                  Name
                </th>
                <th className="text-[#808080] text-sm font-normal py-3 text-start">
                  Modified
                </th>
                <th className="text-[#808080] text-sm font-normal py-3 text-start">
                  Size
                </th>
              </tr>
            </thead>

            <tbody className="w-full">
              <tr className="group hover:bg-blue-100 border-l-2 border-l-white hover:border-l-gray-500">
                <td className="py-3 pl-4">
                  <Folder className="text-gray-700"/>
                </td>
                <td className="py-3">
                  <button className="text-sm text-black">Loans</button>
                </td>
                <td className="py-3">
                  <p className="text-sm text-gray-500">
                    today by Wealthportal Service Account
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-black">100.7 KB</p>
                    <div className="flex items-center justify-between gap-14 opacity-0 group-hover:opacity-100">
                      <button>
                        <Ellipsis />
                      </button>

                      <button className="text-sm text-black">Share</button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
