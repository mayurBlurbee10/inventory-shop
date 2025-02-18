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
import Image from "next/image";
import Navbar from "./Navbar";
import Container from "./Container";
import { setCurrentUser } from "@/store/services/userService";
import { useDispatch, useSelector } from "react-redux";

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

export default function DocDashboard() {
  // return <Dashboard fileType={'my'}/>;
  // const [config, setConfig] = useState(null);
  const [content, setContent] = useState(null);
  const params = useParams();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // const [user, setUser] = useState(null);
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
  const {data : user } = useSelector((state)=>state.user);
  const dispatch = useDispatch();
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

  // const fetchConfig = async () => {
  //   try {
  //     if (!params?.portalid) return;
  //     const response = await fetchWrapper(
  //       `/api/portal?portalid=${params.portalid || "default"}`,
  //       {},
  //       "portal-login"
  //     );
  //     const data = await response.json();
  //     if (!data.data && response.status === 404) {
  //       router.push(`/${params.portalid}/not-found`);
  //       return;
  //     }
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch users");
  //     }

  //     setConfig(data.data);
  //   } catch (error) {
  //     console.log("error: ", error);
  //   }
  // };

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
      // setUserData(userData);
      dispatch(setCurrentUser(userData))
      // localStorage.setItem("portal", params.portalid);
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

      // setUser(userData);
    });
  }, [router]);

  useEffect(() => {
    // const fetchConfig = async () => {
    //   try {
    //     const response = await fetchWrapper(
    //       `/api/portal?portalid=${params.portalid || "default"}`,
    //       {},
    //       "portal-login"
    //     );
    //     const data = await response.json();
    //     if (!data.data && response.status === 404) {
    //       router.push(`/${params.portalid}/not-found`);
    //       return;
    //     }
    //     if (!response.ok) {
    //       throw new Error(data.error || "Failed to fetch portal config");
    //     }
    //     setConfig(data.data);
    //   } catch (error) {
    //     console.log("error: ", error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchConfig();
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
    // <Container>
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
              {/* <Link href="my-docs">
                <div className="p-4 border rounded-md mb-4 transform hover:scale-105 ease-in-out transition duration-300 cursor-pointer">
                  <h3 className="text-xl font-light font-lato text-[#007bff] hover:text-sky-600 pl-4">
                    My Documents
                  </h3>
                  <p className="font-medium text-gray-500 font-lato pt-2 pl-4 mb-4 text-sm">
                    Securely share content with your advisor
                  </p>
                </div>
              </Link> */}
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
              <Link href="loans">
                <div className="p-4 border rounded-md mb-4 transform hover:scale-105 ease-in-out transition duration-300 cursor-pointer">
                  <h3 className="text-xl font-light font-lato text-[#007bff] hover:text-sky-600 pl-4">
                    Loans Origination
                  </h3>
                  <p className="font-medium text-gray-500 font-lato pt-2 pl-4 mb-4 text-sm">
                  Apply and submit documents for a loan
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
    // </Container>
  );
}
