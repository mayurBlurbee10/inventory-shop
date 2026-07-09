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
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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

    const renderSortIcon = (key) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === "asc" ? (
                <ChevronUp className="h-4 w-4 text-foreground" />
            ) : (
                <ChevronDown className="h-4 w-4 text-foreground" />
            );
        }
        return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
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
        <div className="flex h-[80vh] items-center justify-center bg-background">
            <LoaderSpinner size={32} className="text-secondary-foreground" />
        </div>
    );

    if (isLoading || isPageLoading) return <LoadingSpinner />;

    return (
        <div className="mx-auto max-w-[1820px] px-4">
            <div className="grid w-full grid-cols-1 gap-10 pt-8 lg:grid-cols-2">
                <div className="flex w-full flex-col">
                    {filterVisibility("Your Clients Section") && (
                        <Card className="overflow-hidden">
                            {/* Header */}
                            <CardHeader className="border-b border-border p-3">
                                <CardTitle className="text-lg">Your Clients</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                {!isLoading && sortedClients.length > 0 && (
                                    <div className="max-h-[300px] overflow-y-auto">
                                        <Table>
                                            <TableHeader className="sticky top-0 z-10 bg-muted/60">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="px-4">
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-primary-solid"
                                                            onClick={() => toggleSort("name")}
                                                        >
                                                            <span>Name</span>
                                                            {renderSortIcon("name")}
                                                        </button>
                                                    </TableHead>
                                                    <TableHead className="px-4">
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-2 font-semibold text-foreground transition-colors hover:text-primary-solid"
                                                            onClick={() => toggleSort("email")}
                                                        >
                                                            <span>Email</span>
                                                            {renderSortIcon("email")}
                                                        </button>
                                                    </TableHead>
                                                    <TableHead className="px-4 font-semibold text-foreground">
                                                        Phone
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {sortedClients.map((user) => (
                                                    <TableRow key={user?.id}>
                                                        <TableCell className="px-4 py-3">
                                                            <Link
                                                                href={`shared-docs?userId=${user?.boxUserId}`}
                                                                passHref
                                                                className="font-medium text-secondary-foreground hover:underline"
                                                            >
                                                                {`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                                                            </Link>
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 text-muted-foreground">
                                                            {user?.email}
                                                        </TableCell>
                                                        <TableCell className="px-4 py-3 text-muted-foreground">
                                                            {user?.phoneNo}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                                {isLoading && (
                                    <div className="flex justify-center py-8">
                                        <LoadingSpinner />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                    {filterVisibility("Activity Section") && (
                        <Card className="mt-8">
                            {/* Title Section */}
                            <CardHeader className="p-3">
                                <CardTitle className="text-lg">Activities</CardTitle>
                            </CardHeader>

                            {/* Chart Section */}
                            <CardContent className="h-[250px] w-full px-2 sm:h-[350px]">
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
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="hsl(var(--border))"
                                        />
                                        <XAxis
                                            dataKey="name"
                                            stroke="hsl(var(--muted-foreground))"
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                        />
                                        <YAxis
                                            yAxisId="left"
                                            stroke="hsl(var(--muted-foreground))"
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                        />
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            stroke="hsl(var(--muted-foreground))"
                                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "hsl(var(--popover))",
                                                border: "1px solid hsl(var(--border))",
                                                borderRadius: "var(--radius)",
                                                color: "hsl(var(--popover-foreground))",
                                            }}
                                            labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                                        />
                                        <Legend />
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="apiCalls"
                                            stroke="hsl(var(--secondary-foreground))"
                                            name="API Calls"
                                        />
                                        <Line
                                            yAxisId="right"
                                            type="monotone"
                                            dataKey="activeUsers"
                                            stroke="hsl(var(--success))"
                                            name="Active Users"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}
                </div>
                <div className="flex w-full flex-col gap-4">
                    {filterVisibility("My Task Section") && (
                        <TasksSection />
                    )}
                </div>
            </div>
        </div>
    );
}
