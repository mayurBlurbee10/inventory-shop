"use client";
import { fetchWrapper } from '@/app/lib/fetchWrapper';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { ArrowDownToLine, Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { useSelector } from 'react-redux';
import { getUserData } from '@/app/lib/auth';
import { saveAs } from 'file-saver';
import LoaderSpinner from '../Common/Elements/LoaderSpinner';
import { cn } from '@/app/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const toISODate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const DatePickerField = ({ id, value, onChange, min, placeholder = "Pick a date" }) => {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const minDate = min ? new Date(`${min}T00:00:00`) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className="h-10 w-[190px] justify-start !bg-background font-normal !text-secondary-foreground"
          />
        }
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
        {selected ? (
          selected.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          captionLayout="dropdown"
          disabled={minDate ? { before: minDate } : undefined}
          onSelect={(date) => {
            if (date) {
              onChange(toISODate(date));
              setOpen(false);
            }
          }}
          className="hidden-scrollbar text-secondary-foreground"
          classNames={{
            month_caption: "flex items-center justify-center h-9 w-full px-2",
            dropdowns: "flex items-center gap-1.5 !text-secondary-foreground",
            caption_label:
              "select-none font-medium !text-secondary-foreground flex items-center gap-1 pl-2 pr-1 h-8 rounded-md [&>svg]:text-muted-foreground [&>svg]:size-3.5",
            dropdown_root:
              "relative  border border-input rounded-md bg-background has-focus:ring-ring/50 has-focus:ring-[3px]",
            dropdown:
              "hidden-scrollbar  bg-popover absolute inset-0 opacity-0 cursor-pointer !text-secondary-foreground [&>option]:bg-popover [&>option]:!text-foreground",
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

const getReportData = async (portalId, startDate, endDate, newPage = 1, newItemsPerPage = 5, params = null, setIsLoading = null, setData = null, setPaginationInfo = null, search = "", sortBy = null, sortOrder = null, filter = "all") => {
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
    if (sortBy && sortOrder) {
      url += `&sortBy=${sortBy}`;
      url += `&sortOrder=${sortOrder}`;
    }
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

  const getFullName = (user) =>
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "N/A";

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key || !sortConfig.direction) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />;
    }

    if (sortConfig.direction === "asc") {
      return <ChevronUp className="h-4 w-4 text-secondary-foreground" />;
    }

    return <ChevronDown className="h-4 w-4 text-secondary-foreground" />;
  };

  const SortableHeader = ({ label, sortKey }) => (
    <TableHead>
      <button
        type="button"
        className="flex items-center justify-start gap-2"
        onClick={() => sortBy(sortKey)}
      >
        <span>{label}</span>
        {renderSortIcon(sortKey)}
      </button>
    </TableHead>
  );

  return (
    <div className="hidden-scrollbar mx-auto flex min-h-[30vh] flex-col overflow-y-auto rounded-lg text-foreground">
      <div>
        <div className="py-1">
          <div className="mb-4 flex items-center justify-between gap-4 px-2">
            <Input
              type="text"
              className="h-10 w-full !bg-background"
              placeholder="Search records..."
              value={searchRecord || ""}
              onChange={handleSearch}
            />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="h-10 flex-shrink-0" />}>
                {filter === "all" ? "All Records" : "My Records"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => handleFilterChange("all")}
                  className={cn(filter === "all" && "bg-accent")}
                >
                  All Records
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFilterChange("my")}
                  className={cn(filter === "my" && "bg-accent")}
                >
                  My Records
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div
          className={cn(
            "hidden-scrollbar max-h-[50vh] overflow-auto border border-border md:max-h-[60vh]",
            totalPages > 0 ? "rounded-t-lg border-b-0" : "rounded-lg"
          )}
        >
          <Table className="text-sm">
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <SortableHeader label="Date & Time" sortKey="createdAt" />
                <SortableHeader label="Name" sortKey="type" />
                <SortableHeader label="File" sortKey="fileSource" />
                <SortableHeader label="User" sortKey="user" />
                <SortableHeader label="Email" sortKey="email" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8">
                    <div className="flex h-[35vh] w-full items-center justify-center">
                      <LoaderSpinner className="text-secondary-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedData?.length > 0 ? (
                paginatedData.map((d, index) => (
                  <TableRow
                    key={d?.createdAt + index}
                    className={cn(index % 2 !== 0 && "bg-muted/30")}
                  >
                    <TableCell className="px-4 py-4">{formatTimestamp(d?.createdAt)}</TableCell>
                    <TableCell className="px-4 py-4">{d?.type?.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}</TableCell>
                    <TableCell className="px-4 py-4">{d?.fileSource || "-"}</TableCell>
                    <TableCell className="px-4 py-4">{getFullName(d?.createdBy)}</TableCell>
                    <TableCell className="px-4 py-4">{d?.createdBy?.email || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-5 text-center text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination Controls */}
        <div className="flex flex-wrap items-center justify-center gap-5 rounded-b-lg border-x border-b border-border bg-muted/50 p-4 lg:justify-end">
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-foreground">Rows per page:</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(value) => handleItemsPerPageChange(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px] !bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-foreground">
                Page {paginationInfo?.currentPage || currentPage} of {paginationInfo?.totalPages || totalPages}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="size-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="size-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="size-5" />
            </Button>
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
  const [data, setData] = useState([]);
  const [apiCalls, setApiCalls] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false)
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [dateData, setDateData] = useState({
    startDate: "",
    endDate: "",
  });
  const [searchRecord, setSearchRecord] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

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

  const handleExport = async () => {
    try {
      setIsExportLoading(true);
      const user = getUserData();
      let url = `/api/box/events/export?portalId=${params?.portalid}&userId=${user?.id}`;
      if (dateData.startDate) url += `&startDate=${dateData.startDate}`;
      if (dateData.endDate) url += `&endDate=${dateData.endDate}`;
      if (debouncedSearchTerm) url += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
      if (sortConfig.key && sortConfig.direction) {
        url += `&sortBy=${sortConfig.key}`;
        url += `&sortOrder=${sortConfig.direction}`;
      }
      if (filter) url += `&filter=${filter}`;

      const response = await fetchWrapper(url, { method: "GET" }, "get-api-logs");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      saveAs(blob, "api_logs_export.csv");
    } catch (error) {
      console.error("Export error:", error.message);
    } finally {
      setIsExportLoading(false);
    }
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
  const handleFilterChange = (selectedFilter) => {
    setFilter(selectedFilter);
    setCurrentPage(1);
  };
  const handleSort = (key) => {
    setCurrentPage(1);

    if (sortConfig.key !== key || !sortConfig.direction) {
      setSortConfig({ key, direction: "asc" });
    } else if (sortConfig.direction === "asc") {
      setSortConfig({ key, direction: "desc" });
    } else {
      setSortConfig({ key: null, direction: null });
    }
  };

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
      null, // sortBy
      null, // sortOrder
      filter // filter
    );
    // generateMockData()
    apiCallThisMonth();
  }, []);

  const { startDate, endDate } = useSelector((state) => state.pages);
  const handleDateChange = (key, value) => {
    if (key === "startDate") {
      setDateData((prev) => ({ ...prev, startDate: value }))
    }
    if (key === "endDate") {
      setDateData((prev) => ({ ...prev, endDate: value }))
    }
  };

  return (
    <div className='w-full max-w-8xl'>
      <div className="mb-5 flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="flex gap-6">
          <div className="z-10 space-y-1">
            <Label htmlFor="startDate" className="!text-secondary-foreground">Start Date</Label>
            <DatePickerField
              id="startDate"
              value={dateData.startDate}
              onChange={(value) => handleDateChange("startDate", value)}
              placeholder="Start date"
            />
          </div>
          <div className="z-10 space-y-1">
            <Label htmlFor="endDate" className="!text-secondary-foreground">End Date</Label>
            <DatePickerField
              id="endDate"
              value={dateData.endDate}
              onChange={(value) => handleDateChange("endDate", value)}
              min={startDate || new Date().toISOString().split("T")[0]}
              placeholder="End date"
              className="!bg-background"
            />
          </div>
        </div>
        <div className='flex flex-wrap gap-4'>
          <Button
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
            className="h-10"
          >
            Go
          </Button>
          <Button
            onClick={handleExport}
            className="ml-auto h-10"
            disabled={isLoading || isExportLoading}
          >
            {isExportLoading ? (
              <LoaderSpinner size={16} className="text-current" />
            ) : (
              <ArrowDownToLine className="h-4 w-4" />
            )}
            Export CSV
          </Button>
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
