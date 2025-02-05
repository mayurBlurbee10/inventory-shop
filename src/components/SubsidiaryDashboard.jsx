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

// Mock data - in real app, this would come from an API
const subsidiariesData = [
  {
    id: 1,
    name: "Ethree",
    domain: "ethree.com",
    description:
      "Enterprise solution for document management and collaboration.",
    activeUsers: {
      current: 850,
      total: 1000,
      percentage: 85,
    },
    apiCalls: {
      current: 8500,
      total: 10000,
      percentage: 85,
    },
  },
  {
    id: 2,
    name: "European Division",
    domain: "eu.company.com",
    description: "European branch operations and document management system.",
    activeUsers: {
      current: 380,
      total: 500,
      percentage: 76,
    },
    apiCalls: {
      current: 7700,
      total: 10000,
      percentage: 77,
    },
  },
  {
    id: 3,
    name: "Asia Pacific",
    domain: "apac.company.com",
    description: "Asia Pacific region document and collaboration platform.",
    activeUsers: {
      current: 200,
      total: 350,
      percentage: 57,
    },
    apiCalls: {
      current: 5700,
      total: 10000,
      percentage: 57,
    },
  },
];

const generateMockData = async (year, portalId) => {
  // const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // return months.map(month => ({
  //   name: month,
  //   apiCalls: Math.floor(Math.random() * 1000) + 500,
  //   activeUsers: Math.floor(Math.random() * 100) + 50
  // }));
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

const DeletePortalModal = ({ isOpen, onClose, subsidiary }) => {
  const router = useRouter();
  const [enteredPortal, setEnteredPortal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  function sanitizeName(name) {
    let sanitizeName = name.trim().toLowerCase().replace(/\s+/g, "-");
    return sanitizeName.endsWith(".")
      ? sanitizeName.slice(0, -1)
      : sanitizeName;
  }

  const handleDeleteSubsidiary = async () => {
    if (subsidiary.legalName !== enteredPortal) {
      setError("Entered portal doesn't match");
      return;
    }
    try {
      setIsLoading(true);
      const requestOptions = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: subsidiary.id }),
      };

      const response = await fetch(
        `/api/portal`,
        requestOptions,
        "portal-delete"
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Portal deletion failed");
      router.back();
      toast.success(data.message || "Portal deleted successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50 " />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl text-gray-600 font-medium">
              Delete Portal
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center text-gray-700 py-4">
            <p className="font-bold">{subsidiary?.legalName}</p>
            <div className="text-gray-700 p-5 space-y-2 border-t ">
              <p className="text-sm">
                This action CANNOT be undone. This will delete the portal
                permanently
              </p>
              <p className="text-sm font-semibold tracking-tight">
                Please type in the portal name to confirm
              </p>
              <input
                type="text"
                id="email"
                value={enteredPortal}
                onChange={(e) => setEnteredPortal(e.target.value)}
                placeholder="Enter Portal"
                className="w-full px-3 py-2 text-gray-700 border border-red-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>

            <div className="flex justify-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-medium text-white disabled:bg-red-400 bg-red-500 border border-gray-300 rounded-lg hover:bg-red-400 transition-colors"
                onClick={handleDeleteSubsidiary}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner"></div> Deleting This Portal
                  </div>
                ) : (
                  "Delete This Portal"
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function SubsidiaryDashboard({ subsidiaryId }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [apiCalls, setApiCalls] = useState(0);
  const [config, setConfig] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [user, setUser] = useState(null);
  const [portalToDelete, setPortalToDelete] = useState(null);

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

  // const fetchUsers = async () => {
  //   try {
  //     if (!config) return;
  //     const response = await fetchWrapper(
  //       `/api/users?portalid=${sanitizeName(config?.legalName)}`,
  //       {},
  //       "fetch-users"
  //     );
  //     const data = await response.json();
  //     if (!response.ok) {
  //       throw new Error(data.error || "Failed to fetch users");
  //     }

  //     setActiveUsers(data?.length);
  //   } catch (error) {
  //     console.log("error: ", error);
  //   }
  // };

  const fetchConfig = async () => {
    try {
      const response = await fetchWrapper(
        `/api/portal?id=${subsidiaryId}`,
        {},
        "fetch-portal"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch subsidiary");
      }
      setConfig(data?.data);
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
    getChartData(2025, subsidiaryId).then((data) => setData(data));
    apiCallThisMonth();
    fetchConfig();
  }, []);

  const subsidiaryData = useMemo(() => {
    const id = parseInt(subsidiaryId);
    return subsidiariesData.find((s) => s.id === id) || subsidiariesData[0];
  }, [subsidiaryId]);

  if (!config) {
    <LoadingSpinner />;
  }

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-[#0161D5] p-6 flex flex-col justify-between">
        <div className="">
          <button
            onClick={() => router.back()}
            className="flex items-center text-white hover:text-gray-200 mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          <div className="space-y-4">
            <ActionButton
              icon={Users}
              onClick={() => console.log("Buy more users")}
            >
              Buy More User Licenses
            </ActionButton>
            <ActionButton
              icon={Activity}
              onClick={() => console.log("Buy more API calls")}
            >
              Increase API Call Limit
            </ActionButton>
            <ActionButton
              icon={SquareArrowOutUpRight}
              onClick={() => {
                const url = `/${sanitizeName(config.legalName)}/login`;
                window.open(url, "_blank");
              }}
            >
              Visit Portal
            </ActionButton>
          </div>
        </div>

        {user?.id === config?.createdBy?.id && (
          <button
            className="inline-flex items-center justify-center mt-5 px-4 py-2 text-sm font-medium text-white bg-[#e63434e8] rounded-md hover:bg-[#bd2626] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setPortalToDelete(config)}
          >
            Delete Portal
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Statistics Report for {config?.legalName}
            </h1>
            <SquareArrowOutUpRight
              className="text-black hover:text-blue-500 size-4"
              onClick={() => {
                const url = `/${sanitizeName(config.legalName)}/login`;
                window.open(url, "_blank");
              }}
            />
          </div>

          <p className="text-gray-500 mb-6">{subsidiaryData.description}</p>
        </div>

        {/* KPIs in single row */}
        <div className="flex gap-6 mb-8">
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
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
                  stroke="#2563eb"
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

      <DeletePortalModal
        isOpen={portalToDelete?.id === subsidiaryId}
        onClose={() => setPortalToDelete(null)}
        subsidiary={config}
      />
    </div>
  );
}
