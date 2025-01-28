"use client";

import Footer from "@/components/Footer";

import { CircleUserRound, Settings, Headset, LogOut } from "lucide-react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { isAdmin, getUserData, clearUserData, setUserData } from "@/lib/auth";
import { getSession, signOut } from "next-auth/react";
import SettingsModal from "@/components/Settings";
import TechSupport from "@/components/TechSupport";

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
  const [config, setConfig] = useState(null);
  const [content, setContent] = useState(null);
  const params = useParams();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTechSupportModalOpen, setIsTechSupportModalOpen] = useState(false);
  const [dayAndDate, setDayAndDate] = useState({
    day: "",
    date: "",
    month: "",
  });
  const NavBarItem = ({ title, href }) => {
    if (!href) {
      console.error("href prop is required for NavBarItem.");
      return null;
    }

    return (
      <Link href={href} passHref>
        <button
          className={`px-6 py-2 text-black hover:scale-105 duration-200 ease-in-out transition-all font-lato text-sm ${
            pathname.includes(href) ? "text-blue-500" : ""
          }`}
        >
          {title}
        </button>
      </Link>
    );
  };
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  const fetchConfig = async () => {
    try {
      if (!params?.portalid) return;
      const response = await fetchWrapper(
        `/api/portal?portalid=${params.portalid || "default"}`,
        {},
        "portal-login"
      );
      const data = await response.json();
      if (!data.data && response.status === 404) {
        router.push(`/${params.portalid}/not-found`);
        return;
      }
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      setConfig(data.data);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const getUserDetailsByEmail = async (email) => {
    try {
      let url = `/api/users/loginByProvider`;
      const body = {
        method: "POST",
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetchUserByEmail");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      setUserData(userData);
      localStorage.setItem("portal", params.portalid);
      localStorage.setItem("accessToken", data.accessToken);
    } catch (error) {
      console.error("Failed to get user from email:", error);
      router.push("login");
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
      if (sessionData) {
        await getUserDetailsByEmail(sessionData.user.email);
      }
    };
    fetchSession().then(() => {
      const userData = getUserData();
      if (!userData) {
        router.push("login");
        return;
      }

      setUser(userData);

      fetchConfig();
    });
  }, [router]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetchWrapper(
          `/api/portal?portalid=${params.portalid || "default"}`,
          {},
          "portal-login"
        );
        const data = await response.json();
        if (!data.data && response.status === 404) {
          router.push(`/${params.portalid}/not-found`);
          return;
        }
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch portal config");
        }
        setConfig(data.data);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
    fetchContent();
  }, []);

  const filterValue = (title) => {
    if (!content) return null;
    console.log("content:", content);

    const contentItem = content.portalContent.find(
      (item) => item.title === title
    );
    const value = contentItem ? contentItem.value : null;

    if (!value) {
      const defaultItem = content.defaultContent.find(
        (item) => item.title === title
      );
      return defaultItem ? defaultItem.value : null;
    }
    return value;
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    const response = await fetchWrapper(
      `/api/contentManagement?portalId=${params.portalid}`,
      { method: "GET" },
      "fetchContentManagement"
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch Content Management");
    }
    setContent(data);
  };

  const handleLogout = async () => {
    clearUserData();
    await signOut();
    toast.success("User signout successfully");
    router.push("login");
  };

  useEffect(() => {
    const date = new Date();
    const dayIndex = date.getDay();
    const monthIndex = date.getMonth();
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    setDayAndDate((prev) => ({ ...prev, day: days[dayIndex] }));
    setDayAndDate((prev) => ({ ...prev, month: months[monthIndex] }));
    setDayAndDate((prev) => ({ ...prev, date: date.getDate() }));
  }, []);

  const userIsAdmin = isAdmin();

  return (
    <div
      className="bg-white min-h-screen overflow-y-auto"
      suppressHydrationWarning={true}
    >
      {/* Header */}
      <div className="border-b border-[#0000001a]">
        <div className="max-w-[1140px] mx-auto px-3">
          <nav className="flex justify-between items-center bg-secondary py-2">
            <div className="flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
              {user?.company?.logo || config?.logo ? (
                <img
                  src={
                    user?.company?.logo
                      ? user.company.logo.replace("/api/upload", "/uploads")
                      : config?.logo || "/default_logo_purple.png"
                  }
                  alt={params.portalid}
                  className="h-[52px] mr-2"
                />
              ) : (
                // Skeleton for logo
                <div className="h-[52px] w-[52px] mr-2 bg-gray-300 animate-pulse rounded" />
              )}

              <span className="text-3xl text-[#000000e6] mb-1 font-lato">
                {filterValue("Header Text") || params.portalId ? (
                  filterValue("Header Text") || params.portalId
                ) : (
                  // Skeleton for header text
                  <div className="w-[200px] h-[50px] bg-gray-200 animate-pulse rounded" />
                )}
              </span>
            </div>
            <div className="hidden md:flex space-x-4 items-center">
              <NavBarItem title="Dashboard" href="dashboard" />
              <NavBarItem title="My Documents" href="my-docs" />
              <NavBarItem title="Shared Documents" href="shared-docs" />
              {userIsAdmin && (
                // <NavBarItem title="Settings" href='/demo/settings' />
                <button
                  className="px-6 py-2 text-black hover:scale-105 duration-200 ease-in-out transition-all font-lato text-sm"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  Settings
                </button>
              )}

              {/* Profile dropdown */}
              <div className="flex items-center space-x-8 cursor-pointer">
                <div
                  className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
                  onClick={() => setAccountDropdown((prev) => !prev)}
                >
                  {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
                  <div
                    className={`size-8 xl:size-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${
                      userIsAdmin ? "bg-blue-600" : "bg-gray-700"
                    }`}
                  >
                    {user?.name?.charAt(0) || "U"}
                  </div>
                  <div className="flex flex-col text-sm xl:text-base">
                    <span className="text-gray-900 font-medium">
                      {user?.name}
                    </span>
                    {userIsAdmin && (
                      <span className="text-blue-600 text-sm font-medium">
                        Administrator
                      </span>
                    )}
                  </div>

                  {/* DROPDOWN SECTION DONE*/}
                  {accountDropdown && (
                    <div className="absolute top-16 overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
                      <button className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200">
                        <CircleUserRound className="h-5 w-5" /> Account Info
                      </button>
                      {userIsAdmin && (
                        <button
                          onClick={() => setIsSettingsOpen(true)}
                          className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                        >
                          <Settings className="h-5 w-5" />
                          Settings
                        </button>
                      )}
                      {userIsAdmin && (
                        <button
                          onClick={() =>
                            setIsTechSupportModalOpen((prev) => !prev)
                          }
                          className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                        >
                          <Headset className="h-5 w-5" />
                          Tech Support
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign out
                      </button>
                    </div>
                  )}
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
              {/* Hello, David West! Today is Wednesday, January 15th. */}
              {`Hello, ${user?.name}! Today is ${dayAndDate.day}, ${
                dayAndDate.month
              } ${dayAndDate.date}${dayAndDate.date === 1 ? "st" : ""}${
                dayAndDate.date === 2 ? "nd" : ""
              }${dayAndDate.date === 3 ? "rd" : "th"}`}
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
              <Link href="my-docs">
                <div className="p-4 border rounded-md mb-4 transform hover:scale-105 ease-in-out transition duration-300 cursor-pointer">
                  <h3 className="text-xl font-light font-lato text-[#007bff] hover:text-sky-600 pl-4">
                    My Documents
                  </h3>
                  <p className="font-medium text-gray-500 font-lato pt-2 pl-4 mb-4 text-sm">
                    Securely share content with your advisor
                  </p>
                </div>
              </Link>
              <Link href="shared-docs">
                <div className="p-4 border rounded-md mb-4 transform hover:scale-105 ease-in-out transition duration-300 cursor-pointer">
                  <h3 className="text-xl font-light font-lato text-[#007bff] hover:text-sky-600 pl-4">
                    Shared Documents
                  </h3>
                  <p className="font-medium text-gray-500 font-lato pt-2 pl-4 mb-4 text-sm">
                    Securely share content with your advisor
                  </p>
                </div>
              </Link>
              {/* <div className="p-4 border rounded-md transform hover:scale-105 transition duration-300  ease-in-out">
                <h3 className="text-xl font-light font-lato text-[#007bff] hover:text-sky-600 pl-4">
                  Loan Origination
                </h3>

                <p className="font-medium text-gray-500 font-lato pt-2 pl-4 mb-4 text-sm">
                  Apply and submit documents for a loan
                </p>
              </div> */}
            </div>
          </div>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <TechSupport
        isOpen={isTechSupportModalOpen}
        onClose={() => setIsTechSupportModalOpen(false)}
      />
      <Footer config={config} filterValue={filterValue} user={user} />
    </div>
  );
}
