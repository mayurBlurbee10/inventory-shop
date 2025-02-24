"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  ArrowLeft,
  Users,
  Activity,
  X,
  SquareArrowOutUpRight,
} from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import { Dialog, DialogBackdrop } from "@headlessui/react";
import { toast } from "react-toastify";
import { useParams } from "next/navigation";

const generateMockData = async (year, portalId) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    name: month,
    apiCalls: Math.floor(Math.random() * 1000) + 100,
    activeUsers: Math.floor(Math.random() * 100) + 50
  }));
};

const KPICard = ({ title, value, total, percentage }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
    <div className="flex items-end space-x-2 mb-2">
      <span className="text-3xl font-bold text-gray-900">{value}</span>
      <span className="text-sm text-gray-500 mb-1">/ {total}</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className="bg-blue-600 h-2.5 rounded-full"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

const ActionButton = ({
  icon: Icon,
  children,
  onClick,
  variant = "primary",
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full mb-2
        ${
          variant === "primary"
            ? "bg-blue-700 text-white hover:bg-blue-800"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
  >
    {Icon && <Icon className="w-4 h-4 mr-2" />}
    {children}
  </button>
);

function sanitizeName(name) {
  let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
}

const LoadingSpinner = () => (
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const ReportsContent = () => {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [apiCalls, setApiCalls] = useState(0);
  const [config, setConfig] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [user, setUser] = useState(null);

  const apiCallThisMonth = () => {
    const currentMonth = new Date().getMonth();
    const month = new Date(0, currentMonth).toLocaleString("en-US", {
      month: "short",
    });
    const res = data?.find((item) => item.name === month);
    if (res) {
      setApiCalls(res?.apiCalls);
      setActiveUsers(res?.activeUsers);
    }
    return;
  };

  const calculatePercentage = (value, totalValue) => {
    if (totalValue === 0) {
      return 0;
    }
    return (value / totalValue) * 100;
  };

  const getChartData = async (year, portalId) => {
    try {
      const response = await fetchWrapper(
        `/api/chart?portalId=${portalId}&year=${year}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
        "get-api-logs"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error while getting apiLogs");
      }
      return data;
    } catch (error) {
      throw new Error(error.message);
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

  useEffect(() => {
    apiCallThisMonth();
  }, [data]);

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push("login");
      return;
    }

    setUser(userData);
  }, [router]);

  useEffect(() => {
    fetchConfig().then((portal) => {
    //   getChartData(2025, portal?.id).then((data) => setData(data));
      generateMockData(2025, portal?.id).then((data) => setData(data));
      apiCallThisMonth();
    });
  }, []);

  if (!config || !data) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header Section */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium text-gray-900">
              Statistics Report for {config?.legalName}
            </h3>
            {/* <SquareArrowOutUpRight
              className="text-black hover:text-blue-500 size-4"
              onClick={() => {
                const url = `/${sanitizeName(config.legalName)}/login`;
                window.open(url, "_blank");
              }}
            /> */}
          </div>

          {/* <p className="text-gray-500 mb-6">{subsidiaryData.description}</p> */}
        </div>

        {/* KPIs in single row */}
        <div className="flex gap-6 mb-5">
          <div className="flex-1">
            <KPICard
              title="Monthly Active Users"
              value={activeUsers}
              total={1000}
              percentage={calculatePercentage(activeUsers, 1000)}
            />
          </div>
          <div className="flex-1">
            <KPICard
              title="API Calls This Month"
              value={apiCalls}
              total={10000}
              percentage={calculatePercentage(apiCalls, 10000)}
            />
          </div>
        </div>

        {/* Graph */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Usage Analytics
          </h2>
          <div className="h-[400px]">
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
      </div>
    </div>
  );
};

export default ReportsContent;