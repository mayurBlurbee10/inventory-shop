"use client";
import { fetchWrapper } from '@/app/lib/fetchWrapper';
import Button from '@/components/Common/Elements/Button';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react'
import {
    Dialog,
    DialogBackdrop,
    Menu,
    MenuButton,
    MenuItem,
    MenuItems,
  } from "@headlessui/react";
import { ArrowDownToLine, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronUp } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { getUserData } from '@/app/lib/auth';
import { setDataRoomAvailability } from '@/store/services/pageService';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import LoaderSpinner from '../Common/Elements/LoaderSpinner';

const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
        month: "short",  // Oct
        day: "2-digit",  // 10
        year: "numeric", // 2024
        hour: "2-digit", // 8
        minute: "2-digit", // 29
        hour12: true, // AM/PM format
    });
};

const getReportData = async (portalId, startDate, endDate, newPage = 1, newItemsPerPage = 5, params = null, setIsLoading = null, setData = null, setPaginationInfo = null, search = "", sortBy = "createdAt", sortOrder = "desc", filter = "all") => {
  try {
    if (setIsLoading) setIsLoading(true);
    const user = getUserData();
    let url = `/api/box/events?portalId=${params?.portalid}&userId=${user?.id}`;
    
    // Apply pagination and filter parameters
    if (newItemsPerPage) url += `&limit=${newItemsPerPage}`;
    if (newPage) url += `&page=${newPage}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sortBy) url += `&sortBy=${sortBy}`;
    if (sortOrder) url += `&sortOrder=${sortOrder}`;
    if (filter) url += `&filter=${filter}`;

    const response = await fetchWrapper(url, { method: "GET", headers: { "Content-Type": "application/json" } }, "get-api-logs");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Error while getting apiLogs");
    
    if (setData) setData(data?.data);
    if (data?.pagination && setPaginationInfo) setPaginationInfo(data?.pagination);
  } catch (error) {
    throw new Error(error.message);
  } finally {
    if (setIsLoading) setIsLoading(false);
  }
};

const handleExport = () => {
  const exportData = data.map((log) => ({
    "Date & Time": formatTimestamp(log?.createdAt),
    Name: formatType(log?.type) || "N/A",
    User: log.createdBy?.firstName + " " + log.createdBy?.lastName || "N/A",
  }));
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, "api_logs.csv");
};


export const PaginatedTable = ({ 
  data, 
  isLoading, 
  paginationInfo, 
  setIsLoading, 
  setPaginationInfo, 
  setData, 
  currentPage, 
  itemsPerPage, 
  handlePageChange, 
  handleItemsPerPageChange,
  searchRecord,
  handleSearch,
  filter,
  handleFilterChange,
  sortConfig,
  sortBy
}) => {
  const totalPages = paginationInfo?.totalPages || 1;
  const paginatedData = data;

  return (
    <div className="flex flex-col mx-auto overflow-y-auto hidden-scrollbar text-black rounded-lg min-h-[30vh]">
      <div>
          <div className="py-1">
            <div className="flex justify-between items-center mb-4 text-gray-600 gap-4 px-2">
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search records..."
                value={searchRecord || ""}
                onChange={handleSearch}
              />
              <Menu as="div" className="relative flex-shrink-0">
                <MenuButton className="flex items-center px-4 py-2 text-gray-600 bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {filter === "all" ? "All Records" : "My Records"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </MenuButton>
                <MenuItems className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10">
                  <MenuItem>
                    <button
                      onClick={() => handleFilterChange("all")}
                      className={`block w-full text-left px-4 py-2 text-sm ${filter === "all" ? "bg-blue-100" : ""}`}
                    >
                      All Records
                    </button>
                  </MenuItem>
                  <MenuItem>
                    <button
                      onClick={() => handleFilterChange("my")}
                      className={`block w-full text-left px-4 py-2 text-sm ${filter === "my" ? "bg-blue-100" : ""}`}
                    >
                      My Records
                    </button>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
          </div>
          <div className={`border max-h-[50vh] md:max-h-[60vh] hidden-scrollbar border-gray-200 overflow-auto ${totalPages > 0 ? "border-b-0 rounded-t-lg" : "rounded-lg"}`}>
            <table className={`w-full text-sm font-lato shadow-md overflow-hidden ${totalPages > 0 ? "rounded-t-lg" : "rounded-lg"}`}>
              <thead className="bg-gray-100 text-gray-700 text-left sticky top-0">
                <tr>
                  <th className="p-4 border-b">
                    <div className="flex items-center justify-start gap-2 mx-4">
                      <span className="block">Date & Time</span>
                      <button className="flex items-center" onClick={() => sortBy("createdAt", "asc")}>
                        <ChevronUp
                          className={`h-4 w-4 transition-colors ${sortConfig.key === "createdAt" && sortConfig.direction === "asc"
                              ? "text-blue-600"
                              : "text-gray-400"
                            }`}
                        />
                      </button>
                      <button className="flex items-center" onClick={() => sortBy("createdAt", "desc")}>
                        <ChevronDown
                          className={`h-4 w-4 transition-colors ${sortConfig.key === "createdAt" && sortConfig.direction === "desc"
                              ? "text-blue-600"
                              : "text-gray-400"
                            }`}
                        />
                      </button>
                    </div>
                  </th>
                  <th className="p-4 border-b">
                    <div className="flex items-center justify-start gap-2 mx-4">
                      <span className="block">Name</span>
                      <button className="flex items-center" onClick={() => sortBy("type", "asc")}>
                        <ChevronUp
                          className={`h-4 w-4 transition-colors ${sortConfig.key === "type" && sortConfig.direction === "asc"
                              ? "text-blue-600"
                              : "text-gray-400"
                            }`}
                        />
                      </button>
                      <button className="flex items-center" onClick={() => sortBy("type", "desc")}>
                        <ChevronDown
                          className={`h-4 w-4 transition-colors ${sortConfig.key === "type" && sortConfig.direction === "desc"
                              ? "text-blue-600"
                              : "text-gray-400"
                            }`}
                        />
                      </button>
                    </div>
                  </th>
                  <th className="p-4 border-b">User</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="py-8">
                      <div className="h-[35vh] w-full flex items-center justify-center">
                        <LoaderSpinner />
                      </div>
                    </td>
                  </tr>
                ) : paginatedData?.length > 0 ? (
                  paginatedData.map((d, index) => (
                    <tr
                      key={d?.createdAt + index}
                      className={`border-b text-gray-800 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-gray-100 transition`}
                    >
                      <td className="py-3 px-4">{formatTimestamp(d?.createdAt)}</td>
                      <td className="py-3 px-4">{d?.type?.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</td>
                      <td className="py-3 px-4">{d?.createdBy?.firstName + " " + d?.createdBy?.lastName || "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center py-5 text-gray-500">
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
           <div className="flex flex-wrap justify-center lg:justify-end items-center p-4 gap-5 border-b border-x border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">Rows per page:</span>
                <select
                  className="border rounded px-2 py-1 bg-white text-gray-700"
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">
                  Page {paginationInfo?.currentPage || currentPage} of {paginationInfo?.totalPages || totalPages}
                </span>
              </div>
            </div>
                 <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
                   onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="size-5" />
                </button>
                <button
                  className="p-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
                   onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  className="p-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
                   onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="size-5" />
                </button>
                <button
                  className="p-2 rounded bg-gray-300 hover:bg-gray-400 disabled:opacity-50"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="size-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
  );
};



const DataTableSection = () => {
  const [paginationInfo, setPaginationInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [apiCalls, setApiCalls] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false)
  const [dateData, setDateData] = useState({
    startDate: "",
    endDate: "",
  });
  const [searchRecord, setSearchRecord] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  const { data: user } = useSelector((state) => state.user)

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

  const generateMockData = async () => {
    const apiLogNames = [
      "User Login", "Files Preview", "File Upload", "Add Message", "Add Folder", "File Download"
    ];

    const daysCount = 4;
    const today = new Date();
    const last5Days = Array.from({ length: daysCount }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (daysCount - 1 - i));
      date.setHours(12, 0, 0, 0);
      return date;
    });

    const rowsCount = 10;
    const mockdata = Array.from({ length: rowsCount }, () => {
      const randomDate = new Date(last5Days[Math.floor(Math.random() * last5Days.length)]);
      randomDate.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
      const randomApiName = apiLogNames[Math.floor(Math.random() * apiLogNames.length)];
      return {
        name: randomDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        userId: user?.id,
        apiCalls: Math.floor(Math.random() * 1000) + 100,
        activeUsers: Math.floor(Math.random() * 100) + 50,
        type: randomApiName,
        createdAt: randomDate.toISOString(),
      };
    });

    setData(mockdata);
    console.log('mockdata: ', mockdata);
  };

  const handleExport = () => {
    const exportData = data.map(log => ({
      "Date & Time": formatTimestamp(log?.createdAt),
      "Name": log?.type || 'N/A',
      "User": log.createdBy?.firstName || 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'api_logs.csv');
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    getReportData(params?.portalid, dateData.startDate, dateData.endDate, newPage, itemsPerPage, params, setIsLoading, setData, setPaginationInfo, debouncedSearchTerm, sortConfig.key, sortConfig.direction, filter);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    getReportData(params?.portalid, dateData.startDate, dateData.endDate, 1, newItemsPerPage, params, setIsLoading, setData, setPaginationInfo, debouncedSearchTerm, sortConfig.key, sortConfig.direction, filter);
  };

  const handleSearch = (e) => setSearchRecord(e.target.value);
  const handleFilterChange = (selectedFilter) => setFilter(selectedFilter);
  const handleSort = (key, direction) => setSortConfig({ key, direction });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchRecord), 500);
    return () => clearTimeout(handler);
  }, [searchRecord]);

  useEffect(() => {
    if (dateData.startDate && dateData.endDate) {
      setCurrentPage(1);
      getReportData(params?.portalid, dateData.startDate, dateData.endDate, 1, itemsPerPage, params, setIsLoading, setData, setPaginationInfo, debouncedSearchTerm, sortConfig.key, sortConfig.direction, filter);
    }
  }, [debouncedSearchTerm, filter, sortConfig]);

  useEffect(() => {
    apiCallThisMonth();
  }, [data, filter]);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const start = new Date(year, month, 2);
    const end = new Date(year, month + 1, 1);

    setDateData({
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    });
    getReportData(
      params?.portalid,
      start.toISOString().split("T")[0],
      end.toISOString().split("T")[0],
      1, // default page
      5, // default items per page
      params,
      setIsLoading,
      setData,
      setPaginationInfo,
      "", // search
      "createdAt", // sortBy
      "desc", // sortOrder
      filter // filter
    );
    // generateMockData()
    apiCallThisMonth();
  }, []);

  console.log("StartDate:", dateData.startDate);
  console.log("EndDate:", dateData.endDate);
  const { startDate, endDate } = useSelector((state) => state.pages);
  const dispatch = useDispatch();
  const handleDateChange = (key, value) => {
    // if (key === "startDate" && endDate && new Date(value) > new Date(endDate)) {
    //     dispatch(setDataRoomAvailability(value, "")); // Reset endDate if startDate is greater
    // } else {
    //     dispatch(
    //         setDataRoomAvailability(
    //             key === "startDate" ? value : startDate,
    //             key === "endDate" ? value : endDate
    //         )
    //     );
    // }
    if (key === "startDate") {
      setDateData((prev) => ({ ...prev, startDate: value }))
    }
    if (key === "endDate") {
      setDateData((prev) => ({ ...prev, endDate: value }))
    }
  };
  console.log("start date: ", startDate);
  console.log("end date: ", endDate);

  return (
    <div className='w-full max-w-8xl'>
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3 mb-5">
        <div className="flex gap-6">
          <div className="z-10">
            <label className="block text-sm font-medium text-gray-700 pb-1">
              Start Date
            </label>
            <input
              required
              type="date"
              className="border p-2 font-medium text-gray-700 rounded-lg outline-none"
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              value={dateData.startDate || ""}
            />
          </div>
          <div className="z-10">
            <label className="block text-sm font-medium text-gray-700 pb-1">
              End Date
            </label>
            <input
              required
              type="date"
              className="border p-2 font-medium text-gray-700 rounded-lg outline-none"
              min={startDate || new Date().toISOString().split("T")[0]}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              value={dateData.endDate || ""}
            />
          </div>
        </div>
        <div className='flex flex-wrap gap-4'>
          <Button
            label={"Go"}
            type={"Primary"}
            onClick={() =>
              getReportData(
                params?.portalid,
                dateData.startDate,
                dateData.endDate,
                currentPage,
                itemsPerPage,
                params,
                setIsLoading,
                setData,
                setPaginationInfo,
                searchRecord,
                sortConfig.key,
                sortConfig.direction,
                filter
              )
            }
            disabled={isLoading && dateData.startDate && dateData.endDate}
          />
          <Button
            onClick={handleExport}
            label={'Export CSV'}
            type={"Primary"}
            className='ml-auto'
            icon={ArrowDownToLine}
            disabled={isLoading}
          />
        </div>
      </div>
      <PaginatedTable
        data={data}
        setData={setData}
        isLoading={isLoading}
        paginationInfo={paginationInfo}
        setIsLoading={setIsLoading}
        setPaginationInfo={setPaginationInfo}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        handlePageChange={handlePageChange}
        handleItemsPerPageChange={handleItemsPerPageChange}
        searchRecord={searchRecord}
        handleSearch={handleSearch}
        filter={filter}
        handleFilterChange={handleFilterChange}
        sortConfig={sortConfig}
        sortBy={handleSort}
      />
    </div>
  )
}

export default DataTableSection;