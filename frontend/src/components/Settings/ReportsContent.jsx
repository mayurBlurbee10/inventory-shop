"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import { useParams } from "next/navigation";
import DataTableSection from "./DataTableSection";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";

const generateMockData = async (year, portalId) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    name: month,
    apiCalls: Math.floor(Math.random() * 1000) + 100,
    activeUsers: Math.floor(Math.random() * 100) + 50
  }));
};


const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8 min-h-[50vh]">
    <LoaderSpinner size={32} className="text-blue-500" />
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