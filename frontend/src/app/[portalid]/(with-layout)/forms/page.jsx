"use client";
import { defaultLoanData } from "@/app/lib/data/loan-data";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
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
    // dispatch(setLoans(loanData?.length < 3 ? defaultLoanData : loanData));
    dispatch(setLoans( loanData));
  }, []);

  const handleRefresh = () => {
    // dispatch(setLoans(loanData?.length === 3 ? loanData.slice(1) : loanData));
    dispatch(setLoans( loanData));
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
    <div className={`h-[80vh] flex items-center justify-center bg-white`}>
      <LoaderSpinner size={32} className="text-blue-500" />
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
      <div>
        <div className="flex justify-between bg-white rounded-lg shadow-sm border border-gray-200 mb-6 mt-12 relative">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex-1">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 font-lato">
                  Custom Forms
                </h3>
                <div className="text-sm text-gray-600">
                  Create new forms and collect new data from customers, partners and employees and route as required.
                </div>
              </div>
            </div>
          </div>
          {/* {loanData?.length === 3 ? (
            <div
              className="flex max-w-60 items-center text-[#17a2b8] gap-3 text-2xl cursor-pointer font-lato"
              onClick={() => router.push(`forms/new?type=mortgage`)}
            >
              <List className="size-8" />
              View Application
            </div>
        ) : (  */}
          <div className="absolute top-4 right-4 z-[10]">
            <div className="relative">
              <div
                className={`flex items-center justify-between cursor-pointer bg-[#f8f9fa] border border-transparent hover:border-[#dee2e6] p-2 max-w-48 rounded-md ${isLoanOptionOpen && "bg-[#dadcdd]"
                  }`}
                onClick={() => setIsLoanOptionOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-2 font-lato">
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Create New</span>
                </div>
                <ChevronDown className="h-4 w-4 fill-black" />
              </div>
              {isLoanOptionOpen && (
                <div 
                  ref={newLoanDropdownRef} 
                  className="flex flex-col border border-[#dee2e6] bg-white w-48 rounded p-3 space-y-2 mt-2 absolute top-full right-0 cursor-pointer font-lato z-[70] shadow-lg"
                >
                  <div 
                    onClick={() => {
                      router.push(`forms/new?type=mortgage`);
                      setIsLoanOptionOpen(false);
                    }}
                    className="hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Mortgage
                  </div>
                  <div 
                    onClick={() => {
                      router.push(`forms/new?type=auto`);
                      setIsLoanOptionOpen(false);
                    }}
                    className="hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Auto
                  </div>
                  <div 
                    onClick={() => {
                      router.push(`forms/new?type=personal`);
                      setIsLoanOptionOpen(false);
                    }}
                    className="hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Personal
                  </div>
                </div>
              )}
            </div>
          </div>
        {/* )} */}
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="search"
                placeholder="Search forms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Forms</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoanData?.length > 0 ?
                filteredLoanData?.map(({ id, icon, name, type, status }) => (
                  <tr key={id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        {icon === "CarFront" && <CarFront className="size-8 text-gray-600" />}
                        {icon === "Home" && <Home className="size-8 text-gray-600" />}
                        {icon === "User" && <User className="size-8 text-gray-600" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        type === 'mortgage' ? 'bg-blue-100 text-blue-800' :
                        type === 'auto' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status === 'Fully Paid' ? 'bg-green-100 text-green-800' :
                        status === 'Active' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline transition-colors"
                        onClick={() => router.push(`forms/details/${id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )): (
                    <tr>
                      <td colSpan="5" className="text-center text-gray-500 py-8">
                        <div className="flex flex-col items-center">
                          <p className="text-md">No forms found</p>
                        </div>
                      </td>
                    </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
   
  );
}

export default LoansPage;
