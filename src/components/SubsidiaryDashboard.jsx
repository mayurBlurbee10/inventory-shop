'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ArrowLeft, Users, Activity } from 'lucide-react';

// Mock data - in real app, this would come from an API
const subsidiariesData = [
  {
    id: 1,
    name: 'Ethree',
    domain: 'ethree.com',
    description: 'Enterprise solution for document management and collaboration.',
    activeUsers: {
      current: 850,
      total: 1000,
      percentage: 85
    },
    apiCalls: {
      current: 8500,
      total: 10000,
      percentage: 85
    }
  },
  {
    id: 2,
    name: 'European Division',
    domain: 'eu.company.com',
    description: 'European branch operations and document management system.',
    activeUsers: {
      current: 380,
      total: 500,
      percentage: 76
    },
    apiCalls: {
      current: 7700,
      total: 10000,
      percentage: 77
    }
  },
  {
    id: 3,
    name: 'Asia Pacific',
    domain: 'apac.company.com',
    description: 'Asia Pacific region document and collaboration platform.',
    activeUsers: {
      current: 200,
      total: 350,
      percentage: 57
    },
    apiCalls: {
      current: 5700,
      total: 10000,
      percentage: 57
    }
  }
];

const generateMockData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map(month => ({
    name: month,
    apiCalls: Math.floor(Math.random() * 1000) + 500,
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

const ActionButton = ({ icon: Icon, children, onClick, variant = 'primary' }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full mb-2
      ${variant === 'primary' 
        ? 'bg-blue-700 text-white hover:bg-blue-800' 
        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
  >
    {Icon && <Icon className="w-4 h-4 mr-2" />}
    {children}
  </button>
);

export default function SubsidiaryDashboard({ subsidiaryId }) {
  const router = useRouter();
  const data = generateMockData();
  
  const subsidiaryData = useMemo(() => {
    const id = parseInt(subsidiaryId);
    return subsidiariesData.find(s => s.id === id) || subsidiariesData[0];
  }, [subsidiaryId]);

  return (
    <div className="flex min-h-screen">

      <div className="w-64 bg-[#0161D5] p-6 flex flex-col">
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
            onClick={() => console.log('Buy more users')}
          >
            Buy More User Licenses
          </ActionButton>
          <ActionButton 
            icon={Activity}
            onClick={() => console.log('Buy more API calls')}
          >
            Increase API Call Limit
          </ActionButton>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-50 p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Statistics Report for {subsidiaryData.name}
          </h1>
          <p className="text-gray-500 mb-6">
            {subsidiaryData.description}
          </p>
        </div>

        {/* KPIs in single row */}
        <div className="flex gap-6 mb-8">
          <div className="flex-1">
            <KPICard
              title="Monthly Active Users"
              value={subsidiaryData.activeUsers.current}
              total={subsidiaryData.activeUsers.total}
              percentage={subsidiaryData.activeUsers.percentage}
            />
          </div>
          <div className="flex-1">
            <KPICard
              title="API Calls This Month"
              value={subsidiaryData.apiCalls.current}
              total={subsidiaryData.apiCalls.total}
              percentage={subsidiaryData.apiCalls.percentage}
            />
          </div>
        </div>

        {/* Graph */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Usage Analytics</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height={400}>
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
    </div>
  );
}
