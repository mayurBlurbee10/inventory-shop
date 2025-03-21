"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { usePathname, useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import {
    RotateCw
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartModule,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,


} from 'chart.js';
import MyTaskPopupBox from "@/components/MyTaskPopupBox";
import Link from "next/link";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);
const labels = ["Mon, 11PM", "Tue, 3AM", "Tue, 7AM", "Tue, 11AM", "Tue, 3PM"];

const data = {
    labels,
    datasets: [
        {
            label: "S&P500",
            data: [30000, 29000, 28000, 32000, 33000],
            borderColor: "rgb(255, 99, 132)",
            backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
        {
            label: "NASDAQ",
            data: [20000, 21000, 22000, 23000, 24000],
            borderColor: "rgb(53, 162, 235)",
            backgroundColor: "rgba(53, 162, 235, 0.5)",
        },
        {
            label: "Dow Jones",
            data: [25000, 26000, 25500, 26500, 27000],
            borderColor: "rgb(255, 205, 86)",
            backgroundColor: "rgba(255, 205, 86, 0.5)",
        },
        {
            label: "Russell 3000",
            data: [15000, 16000, 15500, 16500, 17000],
            borderColor: "rgb(75, 192, 192)",
            backgroundColor: "rgba(75, 192, 192, 0.5)",
        },
        {
            label: "Box",
            data: [5000, 5200, 5400, 5600, 5800],
            borderColor: "rgb(54, 162, 235)",
            backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
        {
            label: "MSCI ACWI",
            data: [13000, 13500, 14000, 14500, 15000],
            borderColor: "rgb(201, 203, 207)",
            backgroundColor: "rgba(201, 203, 207, 0.5)",
        },
        {
            label: "MSCI EAFE",
            data: [11000, 11500, 12000, 12500, 13000],
            borderColor: "rgb(153, 102, 255)",
            backgroundColor: "rgba(153, 102, 255, 0.5)",
        },
        {
            label: "MSCI World",
            data: [17000, 17500, 18000, 18500, 19000],
            borderColor: "rgb(255, 159, 64)",
            backgroundColor: "rgba(255, 159, 64, 0.5)",
        },
        {
            label: "Wilshire 5000",
            data: [9000, 9500, 10000, 10500, 11000],
            borderColor: "rgb(255, 99, 71)",
            backgroundColor: "rgba(255, 99, 71, 0.5)",
        },
        {
            label: "Box",
            data: [7000, 7200, 7400, 7600, 7800],
            borderColor: "rgb(102, 205, 170)",
            backgroundColor: "rgba(102, 205, 170, 0.5)",
        },
    ],
};


const options = {
    responsive: true,
    maintainAspectRatio: false, // Allows dynamic height
    plugins: {
        legend: {
            position: "top",
            labels: {
                font: {
                    size: 14, // Makes legend text larger for readability
                },
            },
        },
        tooltip: {
            mode: "index",
            intersect: false,
        },
    },
    scales: {
        x: {
            ticks: {
                font: {
                    size: 12,
                },
            },
        },
        y: {
            beginAtZero: true,
            ticks: {
                font: {
                    size: 12,
                },
            },
        },
    },
};

const LoadingSpinner = () => (
    <div className="min-h-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);


export default function AdvisorViewDashboard() {
    const [isMyTaskPopupOpen, setIsMyTaskPopupOpen] = useState(false);
    const [myTaskPopupBoxContent, setMyTaskPopupBoxContent] = useState('');
    const [user, setUser] = useState(null);
    const [usersList, setUsersList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const params = useParams();

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
            setUsersList(data);
        } catch (error) {
            console.error("Download error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        // <Container>
        <div className="max-w-[1140px] mx-auto px-4">
            {/* <div className="grid grid-cols-1 lg:grid-cols-2 pt-12 pb-4 border-b">
                <div>
                    <h2 className="text-xl font-light text-black font-lato">
                        {`Hello, Erica Smith! Today is ${dayAndDate.day}, ${dayAndDate.month
                            } ${dayAndDate.date}${dayAndDate.date === 1 ? "st" : ""}${dayAndDate.date === 2 ? "nd" : ""
                            }${dayAndDate.date === 3 ? "rd" : ""}${dayAndDate.date !== 1 && dayAndDate.date !== 2 && dayAndDate.date !== 3 ? "th" : ""}`}
                    </h2>
                </div>
            </div> */}

            <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 pt-8 gap-10">
                    <div className="flex flex-col ">
                        <div >
                            <div className="w-full flex justify-center items-center">
                                <h3 className="text-xl font-light font-lato text-black mb-4">
                                    Your Clients
                                </h3>
                            </div>
                            <div className="max-w-[1200px] mx-auto flex justify-center flex-wrap gap-5">
                                {
                                    !isLoading && usersList.length > 0 &&
                                    <div className="overflow-x-auto border rounded-lg max-h-[300px] overflow-y-auto w-full">
                                        <table className="w-full bg-white border-collapse">
                                            <thead className="sticky top-0 bg-gray-50 w-full">
                                                <tr>
                                                    <th className="py-2 px-4 border-b text-left text-sm">Name</th>
                                                    <th className="py-2 px-4 border-b text-left text-sm">Message</th>
                                                    <th className="py-2 px-4 border-b text-left text-sm">Phone</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {usersList.map((user) => (
                                                    <tr key={user?.id} className="hover:bg-gray-100 transition-colors">
                                                        <td className="py-2 px-4 border-b text-blue-600 text-sm">
                                                            <Link href={`shared-docs?userId=${user?.boxUserId}`} passHref>
                                                                {user?.name}
                                                            </Link>
                                                        </td>
                                                        <td className="py-2 px-4 border-b text-sm">
                                                            {`Message ${Math.floor(Math.random() * 100)}`}
                                                        </td>
                                                        <td className="py-2 px-4 border-b text-sm">
                                                            {`+1-${Math.floor(1000000000 + Math.random() * 9000000000)}`}
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
                        <div className="bg-white w-full mx-auto mt-8">
                            {/* Title Section */}
                            <div className="grid grid-cols-1">
                                <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                                    Your Market at a Glance
                                </h3>
                            </div>

                            {/* Chart Section */}
                            <div className="w-full h-[400px]">
                                <Line data={data} options={options} />
                            </div>
                        </div>
                    </div>
                    <div>
                        <div>
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
                        </div>


                    </div>
                </div>
            </div>
        </div>
        // </Container>
    );
}
