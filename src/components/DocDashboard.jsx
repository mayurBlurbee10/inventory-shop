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
import TasksSection from "./Common/TasksSection";
import AdvisorSection from "./Common/CollaboratorSection";
import CollaboratorSection from "./Common/CollaboratorSection";
import MessageSection from "./Common/MessageSection";
import TickerTape from "./Common/charts/TickerTape";
import TopStories from "./Common/charts/TopStories";
import { MarketOverviewChart, StockMarketChart } from "./Common/charts/Chart";

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
  // const [content, setContent] = useState(null);
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
  const [dayAndDate, setDayAndDate] = useState("");
  const [page, setPage] = useState(null);
  const [isPageLoading, setIsPageLoading] = useState(false)
  
  const {data : user } = useSelector((state)=>state.user);
  const {data : pages } = useSelector((state)=>state.pages);
  const { data: content } = useSelector((state) => state.content);

  const dispatch = useDispatch();

  useEffect(() => {
    const page = pages?.find((page) => page.title === "dashboard");
    if (page && !page.isPageVisible) {
      router.push("access-denied");
    }
  }, []);

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

  const isAnySideSectionVisible = () => {
    if (isPageLoading) return true; 
    if (!page || !page.length) return true; 
    
    return page.some((item) => item.visible);
  };

  const fetchPage = async () => {
    try {
      setIsPageLoading(true);
      if (!params?.portalid) return;
      const response = await fetchWrapper(
        `/api/pages?portalId=${params.portalid || "default"}&page=${pathname
          .split("/")
          .pop()}`,
        {},
        "fetch-page"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch page");
      }

      const pageData = data?.data?.visibility || []

      setPage(pageData);

    } catch (error) {
      console.log("error: ", error);
    } finally {
      setIsPageLoading(false);
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
    fetchPage();
    // fetchContent();
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

  // const fetchContent = async () => {
  //   const response = await fetchWrapper(
  //     `/api/contentManagement?portalId=${params.portalid}`,
  //     { method: "GET" },
  //     "fetchContentManagement"
  //   );
  //   const data = await response.json();
  //   if (!response.ok) {
  //     throw new Error(data.error || "Failed to fetch Content Management");
  //   }
  //   setContent(data);
  // };

  const handleLogout = async () => {
    clearUserData();
    await signOut();
    toast.success("User signout successfully");
    router.push("login");
  };

  const filterVisibility = (label) => {
    if (isPageLoading) return false;  
    if (!page || !page.length) return true;       
    
    const section = page.find((item) => item.label === label);
    return section?.visible ?? false; 
  };

  const filterLinksVisibility = (title) => {
    const page = pages?.find((page) => page.title === title);
    return page ? page.isPageVisible : true;
  };
  
  useEffect(() => {
    const getOrdinalSuffix = (day) => {
      if (day > 3 && day < 21) return "th"; // Covers 11th, 12th, 13th
      switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
      }
    };
    
    const today = new Date();
    const day = today.getDate();
    const weekday = today.toLocaleDateString("en-US", { weekday: "long" }); // Wednesday
    const month = today.toLocaleDateString("en-US", { month: "long" }); // April
    
    const formattedDate = `${weekday}, ${month} ${day}${getOrdinalSuffix(day)}`;
    setDayAndDate(formattedDate);
  }, []);

  const LoadingSpinner = () => (
    <div className="h-[80vh] flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const userIsAdmin = isAdmin();

  if(isPageLoading){
  return <LoadingSpinner/>
  }

  return (
    // <Container>
    <div className="max-w-[1820px] mx-auto px-4">
      <div className={`${filterVisibility("Ticker Tape") ? "pt-5" : "pt-14"}`}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-7">
          <div className={`${!filterVisibility("My Task Section") && !filterVisibility("Collaborator Section") && !filterVisibility("Messaging") ? "col-span-5" : " col-span-5 md:col-span-3" }`}>
            <div className="flex flex-col justify-center gap-4">
              <div className="flex justify-center">
                {filterVisibility("Ticker Tape") && (
                  <div className="w-[96%] md:w-[80%]">
                    <TickerTape />
                  </div>
                )}
              </div>
              <div className="w-full flex justify-center">
                <div className="pb-4 border-b w-[96%] md:w-[80%] ">
                  {filterVisibility("Header Section") && (
                    <div className="w-full">
                      <div className="text-xl font-light text-black font-lato flex flex-wrap items-center">
                        {
                          filterValue("Dashboard Heading").length > 0 ? (
                            <div className="page flex items-center font lato" dangerouslySetInnerHTML={{ __html: filterValue("Dashboard Heading") }} suppressHydrationWarning={true}/>
                          ) : (
                            <div className="pr-2 flex items-center">{`Hello, ${user?.name}!`}</div>
                          )
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="mt-5 flex flex-col items-center">
              {filterVisibility("Chart Section") && (
                <>
                  <h3 className="text-xl font-light font-lato text-center text-black mb-4">
                    Summary
                  </h3>

                  <div className="flex justify-center w-full">
                      <div className="w-[96%] md:w-[80%]">
                        <StockMarketChart />
                        {/* <MarketOverviewChart /> */}
                      </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-center mt-5">
                {filterVisibility("Top Stories") && (
                  <div className="w-[96%] md:w-[80%]">
                    <TopStories />
                  </div>
                )}
            </div>
          </div>
          <div className="col-span-5 md:col-span-2">
          {filterVisibility("My Task Section") && (
            <TasksSection />
          )}
          {filterVisibility("Collaborator Section") && (
            <CollaboratorSection />
          )}
          {/* {filterVisibility("Links Section") && (
            <div className="mt-7">
              {filterLinksVisibility("shared-docs") && (
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
               )}
               {filterLinksVisibility("loans") && (
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
               )}
               {filterLinksVisibility("esignature") && (
                 <Link href="esignature">
                   <div className="p-4 border rounded-md mb-4 transform hover:scale-105 ease-in-out transition duration-300 cursor-pointer">
                     <h3 className="text-xl font-light font-lato text-[#007bff] hover:text-sky-600 pl-4">
                       E-signature
                     </h3>
                     <p className="font-medium text-gray-500 font-lato pt-2 pl-4 mb-4 text-sm">
                       Digitally sign and manage agreements.
                     </p>
                   </div>
                 </Link>
               )}
            </div>
           )} */}
            {filterVisibility("Messaging") && (
              // <Messaging />
              <MessageSection />
            )}
          </div>
        </div>
      </div>
    </div>
    // </Container>
  );
}
