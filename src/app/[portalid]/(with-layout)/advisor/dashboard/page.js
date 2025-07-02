"use client";

import { usePathname, useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import MyTaskPopupBox from "@/components/MyTaskPopupBox";
import Link from "next/link";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import TasksSection from "@/components/Common/TasksSection";
import MessageSection from "@/components/Common/MessageSection";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } from "recharts";
import { useSelector } from "react-redux";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";


const LoadingSpinner = () => (
    <div className="min-h-full flex justify-center items-center py-8">
        <Loader2 className="text-blue-500 animate-spin" />
    </div>
);


export default function AdvisorViewDashboard() {
    const [isMyTaskPopupOpen, setIsMyTaskPopupOpen] = useState(false);
    const [myTaskPopupBoxContent, setMyTaskPopupBoxContent] = useState('');
    // const [user, setUser] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const params = useParams();
    const [data, setData] = useState(null);
    const [config, setConfig] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(false)
    const [page, setPage] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

    const { data : user } = useSelector((state) => state.user);

    const [dayAndDate, setDayAndDate] = useState({
        day: "",
        date: "",
        month: "",
    });


    useEffect(() => {
        const date = new Date();
        const dayIndex = date.getDay();
        const monthIndex = date.getMonth();
        const days = [
            "Sunday",
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

    const fetchUser = async () => {
        try {
            setIsLoading(true);
            const url = params.portalid
                ? `/api/users?portalid=${params.portalid || "default"}`
                : "/api/users";
            const response = await fetchWrapper(url, {}, "fetchUserList");
            if (!response.ok) throw new Error("Download failed");
            const data = await response.json();
            console.log("UsersList:", data);
            const flteredUsers = data.filter((item) => item?.id !== user?.id);
            setUsersList(flteredUsers);
        } catch (error) {
            console.error("Download error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        fetchPage();
    }, []);

    const fetchConfig = async () => {
        try {
          const response = await fetchWrapper(
            `/api/portal?portalid=${params.portalid}`,
            {},
            "fetch-portal"
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Failed to fetch portal");
          }
          setConfig(data?.data);
          return data?.data
        } catch (error) {
          console.log("error: ", error);
        }
      };
      const generateMockData = async (year, portalId) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.map(month => ({
          name: month,
          apiCalls: Math.floor(Math.random() * 1000) + 100,
          activeUsers: Math.floor(Math.random() * 100) + 50
        }));
      };

    const filterVisibility = (label) => {
      if (isPageLoading) return false;
      if (!page || !page.length) return true;

      const section = page.find((item) => item.label === label);
      return section?.visible ?? false;
    };

    const fetchPage = async () => {
      try {
        setIsPageLoading(true);
        if (!params?.portalid) return;
        const page = encodeURIComponent("advisor dashboard")
        const response = await fetchWrapper(
          `/api/pages?portalId=${params.portalid || "default"}&page=${page}`,
          {},
          "fetch-page"
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error("Failed to fetch page");
        }

        const pageData = data?.data?.visibility || [];

        setPage(pageData);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    const sortedClients = usersList && [...usersList].sort((a, b) => {
        if (sortConfig.key === "name") {
          return sortConfig.direction === "asc" 
            ? a.name.localeCompare(b.name) 
            : b.name.localeCompare(a.name);
        } else if (sortConfig.key === "email"){
            return sortConfig.direction === "asc" 
            ? a.email.localeCompare(b.email) 
            : b.email.localeCompare(a.email);
        }
        return 0;
    });

    const toggleSort = (key) => {
        setSortConfig((prev) => ({
          key,
          direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };


     useEffect(() => {
        fetchConfig().then((portal) => {
        //   getChartData(2025, portal?.id).then((data) => setData(data));
          generateMockData(2025, portal?.id).then((data) => setData(data));
        });
      }, []);
      console.log("Data:", data);
      
      const LoadingSpinner = () => (
        <div className={`h-[80vh] flex items-center justify-center bg-white`}>
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );

      if (isLoading || isPageLoading) return <LoadingSpinner />;

    return (
        // <Container>
        <div className="max-w-[1820px] mx-auto px-4">
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 pt-12 pb-4 border-b">
                <div>
                    <h2 className="text-xl font-light text-black font-lato">
                        {`Hello, Erica Smith! Today is ${dayAndDate.day}, ${dayAndDate.month
                            } ${dayAndDate.date}${dayAndDate.date === 1 ? "st" : ""}${dayAndDate.date === 2 ? "nd" : ""
                            }${dayAndDate.date === 3 ? "rd" : ""}${dayAndDate.date !== 1 && dayAndDate.date !== 2 && dayAndDate.date !== 3 ? "th" : ""}`}
                    </h2>
                </div>
            </div> */}

            <div className="grid grid-cols-1 lg:grid-cols-2 pt-8 gap-10 w-full">
                <div className="flex flex-col w-full">
                    {filterVisibility("Your Clients Section") && (
                        <div >
                            <div className="w-full flex justify-center items-center">
                                <h3 className="text-xl font-light font-lato text-black mb-4">
                                    Your Clients
                                </h3>
                            </div>
                            <div className="max-w-[1200px] mx-auto flex justify-center flex-wrap gap-5 text-black">
                                {
                                    !isLoading && sortedClients.length > 0 &&
                                    <div className="overflow-x-auto border max-h-[300px] overflow-y-auto w-full">
                                        <table className="w-full bg-white border-collapse">
                                            <thead className="sticky top-0 bg-gray-50 w-full">
                                                <tr>
                                                    <th className="p-4 border-b text-left text-sm">
                                                        <div className="flex items-center justify-start gap-2">
                                                            <span className="block">Name</span>
                                                            <button className="flex items-center justify-center" onClick={() => toggleSort("name")}>
                                                                <ChevronUp className={`h-4 w-4 ${sortConfig.key === "name" && sortConfig.direction === "asc" ? "text-black" : "text-gray-400"}`} />
                                                            </button>
                                                            <button className="flex items-center justify-center" onClick={() => toggleSort("name")}>
                                                                <ChevronDown className={`h-4 w-4 ${sortConfig.key === "name" && sortConfig.direction === "desc" ? "text-black" : "text-gray-400"}`} />
                                                            </button>
                                                        </div>
                                                    </th>
                                                    <th className="p-4 border-b text-left text-sm">
                                                        <div className="flex items-center justify-start gap-2">
                                                            <span className="block">Email</span>
                                                            <button className="flex items-center justify-center" onClick={() => toggleSort("email")}>
                                                                <ChevronUp className={`h-4 w-4 ${sortConfig.key === "email" && sortConfig.direction === "asc" ? "text-black" : "text-gray-400"}`} />
                                                            </button>
                                                            <button className="flex items-center justify-center" onClick={() => toggleSort("email")}>
                                                                <ChevronDown className={`h-4 w-4 ${sortConfig.key === "email" && sortConfig.direction === "desc" ? "text-black" : "text-gray-400"}`} />
                                                            </button>
                                                        </div>
                                                    </th>
                                                    <th className="p-4 border-b text-left text-sm">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedClients.map((user) => (
                                                    <tr key={user?.id} className="hover:bg-gray-100 transition-colors">
                                                        <td className="py-2 px-4 border-b text-blue-600 text-sm">
                                                            <Link href={`shared-docs?userId=${user?.boxUserId}`} passHref>
                                                                {user?.name}
                                                            </Link>
                                                        </td>
                                                        <td className="p-4 border-b text-sm">
                                                           {user?.email}
                                                        </td>
                                                        <td className="p-4 border-b text-sm">
                                                            {user?.phoneNo}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                }
                                {
                                    isLoading && (
                                        <LoadingSpinner />
                                    )
                                }
                            </div>
                        </div>
                    )}
                    {filterVisibility("Activity Section") && (
                        <div className="bg-white w-full mx-auto mt-8">
                            {/* Title Section */}
                            <div className="grid grid-cols-1">
                                <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                                    Activities
                                </h3>
                            </div>

                            {/* Chart Section */}
                            <div className="sm:h-[350px] h-[250px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <LineChart
                                            data={data}
                                            margin={{
                                              top: 5,
                                              right: 30,
                                              left: 20,
                                              bottom: 5,
                                            }}
                                          >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis yAxisId="left" />
                                            <YAxis yAxisId="right" orientation="right" />
                                            <Tooltip />
                                            <Legend />
                                            <Line
                                              yAxisId="left"
                                              type="monotone"
                                              dataKey="apiCalls"
                                              stroke="#0061D5"
                                              name="API Calls"
                                            />
                                            <Line
                                              yAxisId="right"
                                              type="monotone"
                                              dataKey="activeUsers"
                                              stroke="#16a34a"
                                              name="Active Users"
                                            />
                                          </LineChart>
                                        </ResponsiveContainer>
                                      </div>
                        </div>
                    )}
                </div>
                <div className="w-full">
                    {filterVisibility("My Task Section") && (
                        <TasksSection />
                    )}
                    {/* <div>
                            <div className="grid grid-cols-3">
                                <div></div>
                                <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                                    Your Tasks
                                </h3>
                                <div className="flex items-center justify-end text-[#dc3545]">
                                    <RotateCw className="h-4 w-4" />
                                </div>
                            </div>
                           
                            <div className="mb-7">
                                <table className="min-w-full divide-y divide-gray-200 overflow-auto border border-[#dee2e6]">
                                    <tbody className="divide-y divide-gray-200 ">
                                        <tr>
                                            <td className="ps-3 py-4">
                                                <div className="h-3 w-3 rounded-full bg-[#ffc107]"></div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <p className="font-lato text-[#212529] text-sm">
                                                    Investment Forms
                                                </p>
                                            </td>
                                            <td className="px-3 py-4">
                                                <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end cursor-pointer"
                                                    onClick={() => {
                                                        setMyTaskPopupBoxContent({
                                                            title: "Investment Forms",
                                                            actionText: "Review"
                                                        });
                                                        setIsMyTaskPopupOpen((prev) => !prev);
                                                    }}
                                                >
                                                    Review
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="ps-3 py-4">
                                                <div className="h-3 w-3 rounded-full bg-[#1ec0cb] pulse-animation"></div>
                                            </td>
                                            <td className="px-3 py-4">
                                                <p className="font-lato text-[#212529] text-sm">
                                                    Upload lease agreements
                                                </p>
                                            </td>
                                            <td className="px-3 py-4">
                                                <p className="font-lato text-sky-500 text-sm hover:text-sky-700 text-end cursor-pointer"
                                                    onClick={() => {
                                                        setMyTaskPopupBoxContent({
                                                            title: "Upload lease agreements",
                                                            actionText: "Upload"
                                                        });
                                                        setIsMyTaskPopupOpen((prev) => !prev);
                                                    }}
                                                >
                                                    Upload
                                                </p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                {
                                    isMyTaskPopupOpen && (
                                        <MyTaskPopupBox
                                            onClose={() => setIsMyTaskPopupOpen(false)}
                                            content={myTaskPopupBoxContent}

                                        />
                                    )
                                }
                            </div>
                    </div> */}
                    {filterVisibility("Messaging") && (
                        <MessageSection />
                    )}
                </div>
            </div>
        </div>
        // </Container>
    );
}
