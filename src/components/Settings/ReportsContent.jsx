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
import DataTableSection from "./DataTableSection";

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
  <div className="flex justify-center items-center py-8 min-h-[50vh]">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
        `/api/chart?portalId=${portalId || "root"}&year=${year}`,
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
        `/api/portal?portalid=${params.portalid || "root"}`,
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
        <div className="flex justify-center items-center">
          <DataTableSection />
        </div>
      </div>
    </div>
  );
};

export default ReportsContent;