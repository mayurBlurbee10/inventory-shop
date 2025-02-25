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
  const { data: loanData } = useSelector((state) => state.loans);
  const dispatch = useDispatch();

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

  return (
    <div className="bg-white rounded-lg flex flex-col relative w-full h-[80vh] lg:max-w-[1140px] md:max-w-[720px] max-w-[540px] mx-auto text-gray-700">
      <div className="m-1 mx-4">
        <div className="border-b border-[#dee2e6] pt-12 pb-5">
          <p className="text-sm font-lato">
            <span className="block md:inline text-black text-xl font-light sm:text-center mr-10 font-lato mb-2 md:mb-0">
              Loan Origination
            </span>
            <span className="block md:inline text-black">
              Securely execute a loan origination workflow, including application, document ingestion, and eSignature.
            </span>
          </p>
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
          <table className="border border-[#dee2e6] text-sm font-lato">
            <thead>
              <tr>
                <th className="p-5">My Loans</th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loanData?.length > 0 &&
                loanData?.map(({ id, icon, name, type, status }) => (
                  <tr key={id} className="border border-[#dee2e6] text-center">
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
                      onClick={() => router.push(`loans/details/${id}`)}
                    >
                      Details
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {loanData?.length === 3 ? (
          <div
            className="flex max-w-60 items-center text-[#17a2b8] gap-3 text-2xl py-10 cursor-pointer font-lato"
            onClick={() => router.push(`loans/new?type=mortgage`)}
          >
            <List className="size-8" />
            View Application
          </div>
        ) : (
          <div
            className={`flex items-center justify-between cursor-pointer bg-[#f8f9fa] border border-transparent hover:border-[#dee2e6] p-3 max-w-48 rounded-md relative mt-5 ${isLoanOptionOpen && "bg-[#dadcdd]"
              }`}
            onClick={() => setIsLoanOptionOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-2 font-lato">
              <Plus className="font-bold" />
              New Loan
            </div>
            <ChevronDown className="fill-black " />
            {isLoanOptionOpen && (
              <div ref={newLoanDropdownRef} className="flex flex-col border border-[#dee2e6] w-48 rounded px-5 py-3 space-y-2 mt-2 absolute top-full left-0 cursor-pointer font-lato">
                <div onClick={() => router.push(`loans/new?type=mortgage`)}>
                  Mortgage
                </div>
                <div onClick={() => router.push(`loans/new?type=auto`)}>
                  Auto
                </div>
                <div onClick={() => router.push(`loans/new?type=personal`)}>
                  Personal
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoansPage;
