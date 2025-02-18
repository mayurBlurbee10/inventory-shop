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



export default function AdvisorView() {
    const [isMyTaskPopupOpen, setIsMyTaskPopupOpen] = useState(false);
    const [myTaskPopupBoxContent, setMyTaskPopupBoxContent] = useState('');
    const [user, setUser] = useState(null);

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




    return (
        // <Container>
        <div className="max-w-[1140px] mx-auto px-4 pb-[70px]">
            <div className="grid grid-cols-1 lg:grid-cols-2 pt-12 pb-4 border-b">
                <div>
                    <h2 className="text-xl font-light text-black font-lato">
                        {/* Hello, David West! Today is Wednesday, January 15th. */}
                        {`Hello, Jhon! Today is ${dayAndDate.day}, ${dayAndDate.month
                            } ${dayAndDate.date}${dayAndDate.date === 1 ? "st" : ""}${dayAndDate.date === 2 ? "nd" : ""
                            }${dayAndDate.date === 3 ? "rd" : "th"}`}
                    </h2>
                </div>
            </div>

            <div>
                <div className="grid grid-cols-1 lg:grid-cols-2 pt-8 gap-7">
                    <div>
                        <h3 className="text-xl font-light font-lato text-black mb-4">
                            Your Clients
                        </h3>

                        <div className="max-w-[1200px] mx-auto flex justify-center flex-wrap gap-5">
                            <div className="border w-[150px] sm:w-[200px] lg:w-[220px]">
                                <Link href="shared-docs" passHref>
                                    <img
                                        src="/images (1).jpg"
                                        alt="User"
                                        className="w-full h-[100px] sm:h-[150px] object-cover border"
                                    />
                                </Link>

                                <div className="text-center p-2">
                                    <h3 className="text-sm sm:text-md text-blue-600 font-medium">David West</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm">Account ID: 821900</p>
                                </div>
                            </div>
                            <div className="border w-[150px] sm:w-[200px] lg:w-[220px]">
                                <Link href="shared-docs" passHref>
                                    <img
                                         src="/profile-3.jpg"
                                        alt="User"
                                        className="w-full h-[100px] sm:h-[150px] object-cover border"
                                    />
                                </Link>
                                <div className="text-center p-2">
                                    <h3 className="text-sm sm:text-md text-blue-600 font-medium">Jessica Chu</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm">Account ID: 112094</p>
                                </div>
                            </div>
                            <div className="border w-[150px] sm:w-[200px] lg:w-[220px]">
                                <Link href="shared-docs" passHref>
                                    <img
                                        src="/images (2).jpg"
                                        alt="User"
                                        className="w-full h-[100px] sm:h-[150px] object-cover border"
                                    />
                                </Link>
                                <div className="text-center p-2">
                                    <h3 className="text-sm sm:text-md text-blue-600 font-medium">Zen Gest</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm">Account ID: 854236</p>
                                </div>
                            </div>
                            <div className="border w-[150px] sm:w-[200px] lg:w-[220px]">
                                <Link href="shared-docs" passHref>
                                    <img
                                        src="/images (3).jpg"

                                        alt="User"
                                        className="w-full h-[100px] sm:h-[150px] object-cover border"
                                    />
                                </Link>
                                <div className="text-center p-2">
                                    <h3 className="text-sm sm:text-md text-blue-600 font-medium">Jessy hau</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm">Account ID: 698524</p>
                                </div>
                            </div>
                            <div className="border w-[150px] sm:w-[200px] lg:w-[220px]">
                                <Link href="shared-docs" passHref>
                                    <img
                                        src="/images.jpg"
                                        alt="User"
                                        className="w-full h-[100px] sm:h-[150px] object-cover border"
                                    />
                                </Link>
                                <div className="text-center p-2">
                                    <h3 className="text-sm sm:text-md text-blue-600 font-medium">James Foe</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm">Account ID: 536247</p>
                                </div>
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
                        <div className="bg-white p-8 max-w-5xl mx-auto">
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
                </div>
            </div>
        </div>
        // </Container>
    );
}
