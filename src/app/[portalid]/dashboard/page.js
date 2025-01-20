"use client";

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
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut, Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export const data = {
  labels: ["US Stocks", "Foreign Stocks", "Emerging Markets", "Bonds"],
  datasets: [
    {
      label: "# of Votes",
      data: [46, 12, 23, 3],
      backgroundColor: ["#3d95cc", "#8f5fa3", "#3cba9f", "#e8c4ba"],
      borderWidth: 1,
    },
  ],
};

export default function DashboardPage() {
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

                <div className="absolute top-[50px] right-0 w-48 bg-white py-3 rounded-md border border-[#e8e8e8] ">
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
                </div>
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

      {/* Dashboard */}

      <div className="max-w-[1140px] mx-auto px-4 pb-[70px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 pt-12 pb-4 border-b">
          <div>
            <h2 className="text-xl font-light text-black font-lato">
              Hello, David West! Today is Wednesday, January 15th.
            </h2>
          </div>
          <div>
            <p className="text-sm font-normal text-black font-lato">
              Dow Jones <span className="text-red-500">-34.71 (-0.16%)</span>{" "}
              S&P 500 <span className="text-red-500">-0.79 (-0.03%)</span>{" "}
              Nasdaq <span className="text-green-500"> +0.04 (0.00%)</span>
            </p>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 pt-8 gap-7">
            <div>
              <h3 className="text-xl font-light font-lato text-center text-black mb-4">
                Your Investments At a Glance
              </h3>

              {/* Chart */}
              <div className="max-w-[400px] mx-auto">
                <Pie data={data} />
              </div>

              {/* Chart data table */}

              <div className="border border-[#0000001a] mt-[70px]">
                <table className="min-w-full divide-y-2 divide-[#0000001a]">
                  <thead>
                    <tr>
                      <th className="font-bold font-lato text-sm text-black text-start px-2 py-1.5">
                        Asset class
                      </th>
                      <th className="font-bold font-lato text-sm text-black text-start px-2 py-1.5">
                        Investment
                      </th>
                      <th className="font-bold font-lato text-sm text-black text-start px-2 py-1.5">
                        Amount
                      </th>
                      <th className="font-bold font-lato text-sm text-black text-start px-2 py-1.5">
                        Return
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#0000001a]">
                    <tr>
                      <td className="px-2 py-1.5">
                        <p className="font-bold font-lato text-sm text-black">
                          US Stocks
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-black">
                          Vanguard VTI ETF
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-black">
                          $46,000
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-green-500">
                          +11.7%
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-2 py-1.5">
                        <p className="font-bold font-lato text-sm text-black">
                          Foreign Stocks
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-black">
                          Vanguard VEA ETF
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-black">
                          $12,000
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-green-500">
                          +1.4%
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-2 py-1.5">
                        <p className="font-bold font-lato text-sm text-black">
                          Emerging Markets
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-black">
                          Vanguard VWO ETF
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-black">
                          $23,000
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-red-500">
                          -1.1%
                        </p>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-2 py-1.5">
                        <p className="font-bold font-lato text-sm text-black">
                          Bonds
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-black">
                          iShares MUB ETF
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-black">
                          $3,000
                        </p>
                      </td>
                      <td className="px-2 py-1.5">
                        <p className="font-normal font-lato text-sm text-red-500">
                          -2.0%
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1.5 col-span-2">
                        <p className="font-bold font-lato text-sm text-black">
                          Total
                        </p>
                      </td>
                      <td className="px-2 py-1.5 table-column-group"></td>
                      <td className="px-2 py-1.5">
                        <p className="font-semibold font-lato text-sm text-black">
                          $84,000
                        </p>
                      </td>
                      <td className="px-2 py-1.5 table-column-group"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              {/* Shared document cards */}
              <div className="p-4 border rounded-md mb-4">
                <h3 className="text-xl font-light font-lato text-[#007bff] hover:text-sky-600 pl-4">
                  Shared Documents
                </h3>

                <p className="font-medium text-gray-500 font-lato pt-2 pl-4 mb-4 text-sm">
                  Securely share content with your advisor
                </p>
              </div>
              <div className="p-4 border rounded-md">
                <h3 className="text-xl font-light font-lato text-[#007bff] hover:text-sky-600 pl-4">
                  Loan Origination
                </h3>

                <p className="font-medium text-gray-500 font-lato pt-2 pl-4 mb-4 text-sm">
                  Apply and submit documents for a loan
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}