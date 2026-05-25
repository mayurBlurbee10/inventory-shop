'use client'
import React from "react";
import { useSelector } from "react-redux";

const SubsidiaryMetrics = ({ activeUsers, currentPageCount }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {[
        {
          label: "Total Portals",
          value: currentPageCount,
          change: "+2 this month",
        },
        { label: "Active Users", value: activeUsers, change: "+57 this month" },
        { label: "Storage Used", value: "0 TB", change: "+100 GB this month" },
      ].map((metric, idx) => (
        <div
          key={idx}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
          <p className="text-2xl font-semibold text-gray-900 mb-2">
            {metric.value}
          </p>
          <p className="text-xs text-green-600">{metric.change}</p>
        </div>
      ))}
    </div>
  );
};

const AdminReportPage = () => {
  const { adminActiveUsers: activeUsers, data: portals } = useSelector(
    (state) => state.portal
  );
  return (
    <SubsidiaryMetrics
      activeUsers={activeUsers || 0}
      currentPageCount={portals?.length || 0}
    />
  );
};

export default AdminReportPage;
