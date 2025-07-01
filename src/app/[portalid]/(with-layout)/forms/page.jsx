"use client";
import { defaultLoanData } from "@/app/lib/data/loan-data";
import { setLoans } from "@/store/services/loanService";
import {
  ArrowDownUp,
  CarFront,
  ChevronDown,
  Folder,
  Home,
  List,
  ListChecks,
  Plus,
  RotateCw,
  Search,
  UploadCloud,
  User,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function LoansPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoanOptionOpen, setIsLoanOptionOpen] = useState(false);
  const [newLoan, setNewLoan] = useState(false);
  const newLoanDropdownRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: loanData } = useSelector((state) => state.loans);
  const {data : pages } = useSelector((state)=>state.pages);
  const dispatch = useDispatch();

  useEffect(() => {
    const page = pages?.find((page) => page.title === "forms");
    if (page && !page.isPageVisible) {
      router.push("access-denied");
    }
  }, []);

  useEffect(() => {
    dispatch(setLoans(loanData?.length < 3 ? defaultLoanData : loanData));
  }, []);

  const handleRefresh = () => {
    dispatch(setLoans(loanData?.length === 3 ? loanData.slice(1) : loanData));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (newLoanDropdownRef.current && newLoanDropdownRef.current.contains(event.target)) {
        return;
      }
      setIsLoanOptionOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const LoadingSpinner = () => (
    <div className="h-[80vh] flex items-center justify-center bg-white">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if(!loanData){
    return <LoadingSpinner/>
  }
  const filteredLoanData = loanData?.filter((loan) =>
    loan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
console.log("loanData", loanData);

  return (
    <div className="bg-white rounded-lg flex flex-col relative w-full lg:max-w-[1140px] md:max-w-[720px] max-w-[540px] mx-auto text-gray-700">
      <div className="m-1 mx-4">
        <div className="border-b border-[#dee2e6] pt-4 sm:pt-12 pb-5 flex justify-between sm:items-center flex-col md:flex-row gap-3">
          <div className="text-sm font-lato">
            <span className="block md:inline text-black text-xl font-light sm:text-center mr-10 font-lato mb-2 md:mb-0">
              Custom Forms
            </span>
            <span className="block md:inline text-black">
              Create new forms and collect new data from customers, partners and employees and route as required.
            </span>
          </div>
          <div>
          {loanData?.length === 3 ? (
          <div
            className="flex max-w-60 items-center text-[#17a2b8] gap-3 text-2xl cursor-pointer font-lato"
            onClick={() => router.push(`forms/new?type=mortgage`)}
          >
            <List className="size-8" />
            View Application
          </div>
        ) : ( 
          <div
            className={`flex items-center justify-between cursor-pointer bg-[#f8f9fa] border border-transparent hover:border-[#dee2e6] p-3 max-w-48 rounded-md relative ${isLoanOptionOpen && "bg-[#dadcdd]"
              }`}
            onClick={() => setIsLoanOptionOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-2 font-lato">
              <Plus className="font-bold" />
              Create New
            </div>
            <ChevronDown className="fill-black " />
            {isLoanOptionOpen && (
              <div ref={newLoanDropdownRef} className="flex flex-col border border-[#dee2e6] bg-white  w-48 rounded px-5 py-3 space-y-2 mt-2 absolute top-full left-0 cursor-pointer font-lato z-[50]">
                <div onClick={() => router.push(`forms/new?type=mortgage`)}>
                  Mortgage
                </div>
                <div onClick={() => router.push(`forms/new?type=auto`)}>
                  Auto
                </div>
                <div onClick={() => router.push(`forms/new?type=personal`)}>
                  Personal
                </div>
              </div>
            )}
          </div>
        )}
        </div>
        </div>
        <div className="flex flex-col pt-8">
          <div className="pb-5">
            <div
              className="flex items-center justify-end text-[#dc3545] cursor-pointer"
              onClick={() => handleRefresh()}
            >
              <RotateCw className="h-4 w-4" />
            </div>
          </div>
          <div className="border w-full">
            <div className="py-[18px] flex items-center w-full px-5 bg-gray-50 text-[#8f8f8f]">
              <div>
                <Search className="w-5 h-5" />
              </div>
              <input
                type="search"
                placeholder="Search file and folders"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={
                  "relative border w-full mx-4 h-9 rounded-md shadow-inner pl-4 text-sm outline-none focus:outline-1 focus:outline-blue-500 focus:outline-offset-0 pr-4 text-gray-700"
                }
              />
            </div>
          <table className=" border-[#dee2e6] text-sm font-lato w-full">
            <thead className="border-t">
              <tr>
                <th className="p-3">Forms</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="border-t">
              {filteredLoanData?.length > 0 ?
                filteredLoanData?.map(({ id, icon, name, type, status }) => (
                  <tr key={id} className=" border-b text-center">
                    <td className="py-5 flex items-center justify-center">
                      {/* <Icon className="size-8" /> */}
                      {icon === "CarFront" && <CarFront className="size-8" />}
                      {icon === "Home" && <Home className="size-8" />}
                      {icon === "User" && <User className="size-8" />}
                    </td>
                    <td className="py-5 px-2">{name}</td>
                    <td>{type}</td>
                    <td
                      className={`${status === "Fully Paid" && "text-green-600"
                        } ${status === "Active" && "text-[#17a2b8]"} ${status === "Processing" && "text-[#ffc107]"
                        }`}
                    >
                      {status}
                    </td>
                    <td
                      className="text-blue-500 cursor-pointer"
                      onClick={() => router.push(`forms/details/${id}`)}
                    >
                      Details
                    </td>
                  </tr>
                )): (
                    <tr>
                      <td colSpan="5" className="text-center text-gray-500 py-4">
                        No form found
                      </td>
                    </tr>
                )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoansPage;
