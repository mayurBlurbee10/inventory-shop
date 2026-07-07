"use client";

import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";

export default function AdvisorViewDashboard() {
    const [usersList, setUsersList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const params = useParams();
    const [data, setData] = useState([]);
    const [config, setConfig] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(false)
    const [page, setPage] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
    const router = useRouter();
    const { data: user } = useSelector((state) => state.user);
    const { data: pages } = useSelector((state) => state.pages);

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
            const url =
                `/api/users?portalid=${params.portalid || "root"}`
                ?? "/api/users";
            const response = await fetchWrapper(url, {}, "fetch-user-list");
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
                `/api/pages?portalId=${params.portalid || "root"}&page=${page}`,
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
        if (sortConfig?.key && sortConfig?.direction) {
            if (sortConfig?.key === "name") {
                const aName = `${a?.firstName || ''} ${a?.lastName || ''}`.trim();
                const bName = `${b?.firstName || ''} ${b?.lastName || ''}`.trim();
                return sortConfig?.direction === "asc"
                    ? aName.localeCompare(bName)
                    : bName.localeCompare(aName);
            } else if (sortConfig?.key === "email") {
                return sortConfig?.direction === "asc"
                    ? a?.email?.localeCompare(b?.email)
                    : b?.email?.localeCompare(a?.email);
            }
        }
        return 0;
    });

    const toggleSort = (key) => {
        let newDirection = 'asc';

        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') {
                newDirection = 'desc';
            } else if (sortConfig.direction === 'desc') {
                newDirection = null;
            } else {
                newDirection = 'asc';
            }
        }

        setSortConfig({ key: newDirection ? key : null, direction: newDirection });
    };

    useEffect(() => {
        const page = pages?.find((page) => page.title === "advisor dashboard");

        if (page && !page.isPageVisible) {
            router.push(
                `${params?.portalid
                    ? `/${params?.portalid}/access-denied`
                    : "/access-denied"
                }`
            );
            return;
        }
        fetchUser();
        fetchPage();
        fetchConfig().then((portal) => {
            //   getChartData(2025, portal?.id).then((data) => setData(data));
            generateMockData(new Date().getFullYear(), portal?.id).then((data) => setData(data));
        });
    }, []);

    const LoadingSpinner = () => (
        <div className={`h-[80vh] flex items-center justify-center bg-white`}>
            <LoaderSpinner size={32} className="text-blue-500" />
        </div>
    );

    if (isLoading || isPageLoading) return <LoadingSpinner />;

    return (
        // <Container>
        <div className="max-w-[1820px] mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 pt-8 gap-10 w-full">
                <div className="flex flex-col w-full">
                    {filterVisibility("Your Clients Section") && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between bg-white p-3 border-b border-gray-200 rounded-t-xl">
                                <h3 className="text-lg font-semibold text-gray-800 font-lato">
                                    Your Clients
                                </h3>
                            </div>
                            <div className="max-w-[1200px] mx-auto">
                                {
                                    !isLoading && sortedClients.length > 0 &&
                                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                        <table className="w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                                                        <div className="flex items-center justify-start gap-2">
                                                            <span className="block cursor-pointer hover:text-gray-900" onClick={() => toggleSort("name")}>Name</span>
                                                            <div className="cursor-pointer" onClick={() => toggleSort("name")}>
                                                                {sortConfig.key === "name" ? (
                                                                    sortConfig.direction === "asc" ? (
                                                                        <ChevronUp className="h-4 w-4 text-black" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4 text-black" />
                                                                    )
                                                                ) : (
                                                                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </th>
                                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">
                                                        <div className="flex items-center justify-start gap-2">
                                                            <span className="block cursor-pointer hover:text-gray-900" onClick={() => toggleSort("email")}>Email</span>
                                                            <div className="cursor-pointer" onClick={() => toggleSort("email")}>
                                                                {sortConfig.key === "email" ? (
                                                                    sortConfig.direction === "asc" ? (
                                                                        <ChevronUp className="h-4 w-4 text-black" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4 text-black" />
                                                                    )
                                                                ) : (
                                                                    <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </th>
                                                    <th className="p-4 text-left text-sm font-semibold text-gray-700">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {sortedClients.map((user) => (
                                                    <tr key={user?.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 px-4 text-sm">
                                                            <Link
                                                                href={`shared-docs?userId=${user?.boxUserId}`}
                                                                passHref
                                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                {`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                                                            </Link>
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-600">
                                                            {user?.email}
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-600">
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
                                        <div className="flex justify-center py-8">
                                            <LoadingSpinner />
                                        </div>
                                    )
                                }
                            </div>
                        </div>
                    )}
                    {filterVisibility("Activity Section") && (
                        <div className="bg-white w-full mx-auto mt-8">
                            {/* Title Section */}
                            <div className="flex items-center justify-between bg-white p-3">
                                <h3 className="text-lg font-semibold text-gray-800 font-lato">
                                    Activities
                                </h3>
                            </div>

                            {/* Chart Section */}
                            <div className="sm:h-[350px] h-[250px] w-full">
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart
                                        data={data || []}
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
                <div className="w-full flex flex-col gap-4">
                    {filterVisibility("My Task Section") && (
                        <TasksSection />
                    )}
                </div>
            </div>
        </div>
        // </Container>
    );
}
