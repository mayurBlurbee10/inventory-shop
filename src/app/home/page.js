import Dashboard from "@/components/Dashboard";
import Footer from "@/components/Footer";
import {
  AlignJustify,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Ellipsis,
  FileUp,
  Folder,
  FolderRoot,
  Minus,
  Pencil,
  Plus,
  RotateCw,
  SquarePen,
} from "lucide-react";

export default function HomePage() {
  // return <Dashboard fileType={'my'}/>;

  const NavBarItem = ({ title }) => (
    <button className="px-6 py-2 text-black hover:scale-105 duration-200 ease-in-out transition-all font-lato text-sm">
      {title}
    </button>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="border-b border-[#0000001a]">
        <div className="max-w-[1140px] mx-auto px-3">
          <nav className="flex justify-between items-center bg-secondary py-2">
            <a className="flex items-center py-1 gap-2 hover:scale-105 transition-all ease-in-out duration-300">
              <img
                src="/default_logo_purple.png"
                alt="Wealthportal"
                className="h-[50px] mr-2"
              />
              <span className="text-3xl text-[#000000e6] mb-1 font-lato">
                Wealthportal
              </span>
            </a>
            <div className="hidden md:flex space-x-4 items-center">
              <NavBarItem title="Dashboard" />
              <NavBarItem title="Shared Document" />
              <NavBarItem title="Loans" />

              {/* Profile dropdown */}
              <div className="relative">
                <button className="flex items-center justify-center gap-1 text-black p-2 rounded-md hover:bg-gray-100 transition-all ease-in-out duration-200">
                  <img
                    src="default_logo_purple.png"
                    className="h-9 w-9 rounded-full mr-3"
                  />
                  <span>User name</span>
                  <span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="currentColor"
                    >
                      <path d="M12 16L6 10H18L12 16Z"></path>
                    </svg>
                  </span>
                </button>

                {/* <div className="absolute top-[50px] right-0 w-48 bg-white py-3 rounded-md border border-[#e8e8e8]">
                  <ul>
                    <li>
                      <button className="p-3 w-full text-base text-start font-lato text-[#212529] font-normal hover:bg-gray-50 transition-all ease-in-out duration-300">
                        Advisor view
                      </button>
                    </li>
                    <li>
                      <button className="p-3 w-full text-base text-start font-lato text-[#212529] font-normal hover:bg-gray-50 transition-all ease-in-out duration-300">
                        Logout
                      </button>
                    </li>
                  </ul>
                </div> */}
              </div>

              {/* Edit button */}
              <button className="h-5 w-5 rounded-sm text-white bg-[#17a2b8] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="currentColor"
                >
                  <path d="M12.8995 6.85453L17.1421 11.0972L7.24264 20.9967H3V16.754L12.8995 6.85453ZM14.3137 5.44032L16.435 3.319C16.8256 2.92848 17.4587 2.92848 17.8492 3.319L20.6777 6.14743C21.0682 6.53795 21.0682 7.17112 20.6777 7.56164L18.5563 9.68296L14.3137 5.44032Z"></path>
                </svg>
              </button>
            </div>
            <button className="md:hidden text-text">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>

      {/* Shared documents */}
      <div className="max-w-[1820px] mx-auto pt-12 mt-12">
        <div>
          <div className="grid grid-cols-5 px-4 gap-7">
            <div className="col-span-5 lg:col-span-3">
              <div className="flex items-center gap-10">
                <span className="text-xl font-light text-[#212529] font-lato">
                  Shared Documents
                </span>
                <span className="text-black font-lato font-normal text-sm">
                  Securely share content with your advisor and trusted
                  collaborators
                </span>
              </div>
              <hr className="my-4" />
              <div className="border border-solid border-[#0000001a] rounded-sm">
                <div className="border-b border-solid border-[#0000001a] ">
                  <div className="py-[18px] bg-[#fcfcfc] flex items-center w-full px-5">
                    <img src="/default_logo_purple.png" className="h-8 w-8" />

                    <input
                      type="search"
                      className="w-full py-1.5 px-3 rounded-lg text-sm border border-solid border-[#0000001a] ml-5 outline-none focus:ring-1 focus:ring-[#0000001a]"
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
                        {/* Grid range */}
                        <div className="flex items-center justify=-center gap-2">
                          <button className="hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200">
                            <Minus className="h-5 w-5" />
                          </button>
                          <input type="range" />
                          <button className="hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200">
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>

                        {/* Card view button */}
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

                        {/* List view button */}
                        <button className="hover:bg-gray-100 p-2 rounded-md text-[#8f8f8f] transition-all ease-in-out duration-200">
                          <AlignJustify />
                        </button>

                        {/* Upload items */}
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

                {/* Table in list view */}

                <div className="min-h-[450px]">
                  <table className="min-w-full divide-y divide-gray-200 overflow-auto">
                    <thead className="custom-box-shadow">
                      <tr>
                        <th></th>
                        <th className="text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                          <div className="flex items-center justify-start gap-2  mx-4">
                            <span className="block">Name</span>
                            <button className="flex items-center justify-center">
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button className="flex items-center justify-center">
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        </th>
                        <th className="text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                          <span className="block mx-4">Modified</span>
                        </th>
                        <th className="text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                          <span className="block mx-4">Size</span>
                        </th>
                      </tr>
                    </thead>

                    <tbody className="w-full divide-y divide-y-gray-200">
                      <tr className="group hover:bg-[#e4f4ff66] border-l-2 border-l-white hover:border-l-cyan-700 active:bg-[#e4f4ff]">
                        <td className="py-1 pl-4">
                          <Folder className="text-[#767676] mx-4" />
                        </td>
                        <td className="py-1">
                          <button className="text-sm text-black font-lato group-hover:text-[#1a5976] max-w-64 w-full text-start mx-4">
                            Loans
                          </button>
                        </td>
                        <td className="py-1">
                          <p className="text-sm text-[#767676] font-lato group-hover:text-[#1a5976] mx-4">
                            today by Wealthportal Service Account
                          </p>
                        </td>
                        <td className="py-1 pr-4">
                          <div className="flex items-center gap-10 mx-4">
                            <p className="text-sm text-[#767676] font-lato group-hover:text-[#1a5976]">
                              100.7 KB
                            </p>

                            <div className="relative">
                              <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:bg-gray-100 rounded-md py-2 px-3">
                                <Ellipsis />
                              </button>

                              <div className="absolute top-11 right-0 w-32 bg-white shadow-md p-3 rounded-md border border-[#e8e8e8]">
                                <ul>
                                  <li>
                                    <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                      Delete
                                    </button>
                                  </li>
                                  <li>
                                    <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                      Rename
                                    </button>
                                  </li>
                                  <li>
                                    <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                      Share
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            </div>
                            <button className="text-base font-medium font-lato text-[#212529] opacity-0 group-hover:opacity-100">
                              Share
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Table in card view */}

                <div>
                  <div className="grid grid-cols-3">
                    <div className="p-2 max-w-[356px]">
                      <div className="border border-[#e8e8e8] card-shadow hover:border-sky-500">
                        <div>
                          <div className="min-h-48 flex items-center justify-center bg-[#fbfbfb]">
                            <div className="max-h-24 max-w-[80px] h-full w-full">
                              <Folder className="flex-auto h-full w-full text-blue-500" />
                            </div>
                          </div>
                          <div className="py-2 px-2.5">
                            <div className="flex items-center justify-between">
                              <h6 className="text-sm font-medium text-black font-lato">
                                Loans
                              </h6>
                              Dropdown
                              <div className="relative">
                                <button className="text-gray-600 hover:bg-gray-100 rounded-md px-3">
                                  <Ellipsis />
                                </button>

                                <div className="absolute top-7 right-0 w-32 bg-white shadow-md p-3 rounded-md border border-[#e8e8e8]">
                                  <ul>
                                    <li>
                                      <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                        Delete
                                      </button>
                                    </li>
                                    <li>
                                      <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                        Rename
                                      </button>
                                    </li>
                                    <li>
                                      <button className="px-3 py-2.5 w-full text-sm text-start font-lato text-[#222] font-normal hover:bg-gray-50 rounded-md transition-all ease-in-out duration-300">
                                        Share
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 font-lato">
                              Modified today by Wealthportal Service Account
                            </p>
                            <p className="text-xs text-gray-500 font-lato ">
                              100.7 KB
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Create folder */}

                <div className="p-6 bg-white rounded-sm max-w-[400px] w-full mx-auto">
                  <label className="text-sm text-black font-medium font-lato block mb-1">
                    Please enter a name.
                  </label>
                  <input
                    type="text"
                    className="py-2 w-56 border border-[#d3d3d3] rounded-md text-sm font-[#222] outline-none mb-2 focus:border-[#0061d5] hover:border-[#0061d5]"
                  />
                  <div className="flex items-center justify-center pt-4">
                    <button className="flex items-center justify-center py-3 px-4 rounded-md bg-[#007bff] text-white font-lato font-medium mr-4">
                      Create
                    </button>
                    <button className="py-3 px-4 rounded-md text-[#222] font-lato font-medium hover:bg-gray-100">
                      Cancel
                    </button>
                  </div>
                </div>

                {/* Upload files */}

                <div>
                  <div className="p-7 flex items-center justify-center flex-col gap-1">
                    <div className="h-11 w-11 text-[#0060d6] mb-2">
                      <FileUp className="h-full w-full" />
                    </div>
                    <p className="text-xs font-semibold text-gray-500 font-lato">
                      Drag and drop files
                    </p>
                    <label className="flex items-center">
                      <input type="file" hidden />
                      <a className="text-xs font-semibold text-sky-500 font-lato hover:underline hover:underline-offset-2 cursor-pointer">
                        Browse your device
                      </a>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* right panel */}
            <div className="col-span-5 lg:col-span-2">
              <div>
                <div className="grid grid-cols-3">
                  <div></div>
                  <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                    My Tasks
                  </h3>
                  <div className="flex items-center justify-end text-[#dc3545]">
                    <RotateCw className="h-4 w-4" />
                  </div>
                </div>
                {/* Tasks */}
                <div className="mb-7">
                  <table className="min-w-full divide-y divide-gray-200 overflow-auto border border-[#dee2e6]">
                    <tbody className="divide-y divide-gray-200 ">
                      <tr>
                        <td className="ps-3 py-4">
                          <div className="h-3 w-3 rounded-full bg-[#1ec0cb] pulse-animation"></div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-[#212529] text-sm">
                            Upload identity information
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end">
                            Upload
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td className="ps-3 py-4">
                          <div className="h-3 w-3 rounded-full bg-[#1ec0cb] pulse-animation"></div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-[#212529] text-sm">
                            Upload 2023 tax return
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end">
                            Complete Forms
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td className="ps-3 py-4">
                          <div className="h-3 w-3 rounded-full bg-[#ffc107]"></div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-[#212529] text-sm">
                            Sign money transfer agreement
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end">
                            Sign
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td className="ps-3 py-4">
                          <div className="h-3 w-3 rounded-full bg-[#ffc107]"></div>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-[#212529] text-sm">
                            Auto Loan Forms
                          </p>
                        </td>
                        <td className="px-3 py-4">
                          <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end">
                            Start Forms
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* My advisor */}
                <div className="mb-7">
                  <div>
                    <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                      My Advisor
                    </h3>
                  </div>

                  {/* Advisory card */}

                  <div className="rounded-md border border-[#dee2e6]">
                    <div className="flex items-start gap-6 border-b border-b-[#dee2e6] p-4">
                      <div className="max-w-[150px] w-full">
                        <a className="p-1 rounded-sm cursor-pointer flex items-center border border-[#dee2e6]">
                          <img src="https://images.unsplash.com/photo-1498529605908-f357a9af7bf5?auto=format&fit=crop&w=1950&q=60&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D" />
                        </a>
                      </div>

                      <div>
                        <h2 className="font-medium text-2xl font-lato mb-1 text-[#212529] leading-none">
                          Erica Smith
                        </h2>
                        <p className="font-lato text-base text-[#6c757d]">
                          Senior Financial Advisor
                        </p>
                      </div>
                    </div>
                    <div className="px-5 py-3 flex items-center justify-center bg-gray-100">
                      <button className="px-2 text-sm text-[#6c757d] font-lato mx-3">
                        Meet
                      </button>
                      <button className="px-2 text-sm text-[#6c757d] font-lato mx-3">
                        Call
                      </button>
                      <button className="px-2 text-sm text-[#6c757d] font-lato mx-3">
                        Chat
                      </button>
                    </div>
                  </div>
                </div>

                {/* Collaborators */}

                <div>
                  <div>
                    <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                      My Collaborators
                    </h3>
                  </div>
                  <div className="p-4 border border-[#dee2e6]">
                    <form className="mb-3.5">
                      <input
                        type="email"
                        className="border border-[#dee2e6] mb-2 w-full rounded-md outline-none text-[#495057] text-base py-1.5 px-4 font-lato"
                      />

                      <div className="flex items-center gap-6">
                        <select className="text-[#495057] max-w-[335px] w-full py-2  border border-[#dee2e6] px-3 rounded-md font-lato">
                          <option>Co-Owner</option>
                          <option>Editor</option>
                          <option>Viewer</option>
                          <option>Previewer</option>
                          <option>Uploader</option>
                          <option>Previewer Uploader</option>
                          <option>Viewer Uploader</option>
                        </select>

                        <button
                          className="py-1 px-3 bg-gray-100 rounded-md text-[#495057] border border-transparent hover:border-[#dee2e6] text-sm"
                          type="button"
                        >
                          Invite
                        </button>
                      </div>
                    </form>

                    {/* Table */}

                    <div className="border overflow-auto">
                      <table className="divide-y-2 divide-gray-200 overflow-auto border-t">
                        <thead>
                          <tr>
                            <th className="text-sm text-black font-medium font-lato p-3 text-start">
                              Name
                            </th>
                            <th className="text-sm text-black font-medium font-lato p-3 text-start">
                              Email
                            </th>
                            <th className="text-sm text-black font-medium font-lato p-3 text-start">
                              Role
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          <tr className="hover:bg-gray-300">
                            <td className="p-3"><p className="font-semibold font-lato text-sm text-black">Erica Smith</p></td>
                            <td className="p-3"><p className="font-normal font-lato text-sm text-black">advisor@wealthportal.com</p></td>
                            <td className="p-3"><p className="font-normal font-lato text-sm text-black">Editor</p></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
