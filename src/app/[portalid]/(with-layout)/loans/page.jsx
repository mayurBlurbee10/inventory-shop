"use client";
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
import React, { useEffect, useState } from "react";

function LoansPage() {
  const preData = [
    {
      id: 635789,
      icon: "CarFront",
      name: "Auto - 635789",
      type: "Auto",
      status: "Active",
      // folderId: "306788535946",
      complete: 75,
      paid: "$40,225.00 Paid",
    },
    {
      id: 990154,
      icon: "User",
      name: "Personal - 990154",
      type: "Personal",
      status: "Fully Paid",
      // folderId: "306789263204",
      complete: 100,
      paid: "Fully Paid",
    },
  ];

  const dataToAdd = [
    {
      id: 174192,
      icon: "Home",
      name: "Mortgage - 174192",
      type: "Mortgage	",
      status: "Processing",
      complete: 25,
      paid: "In Process",
    },
  ];
  const router = useRouter();
  const params = useParams();
  const [isLoanOptionOpen, setIsLoanOptionOpen] = useState(false);
  const [loanData, setLoanData] = useState(preData);
  const [newLoan, setNewLoan] = useState(false);

  // console.log(loanData);

  useEffect(() => {
    const userEntered = JSON.parse(localStorage.getItem("newLoan"));
    setNewLoan(userEntered);

    if (userEntered) {
      setLoanData([...dataToAdd, ...preData]);
      localStorage.setItem("loan", JSON.stringify([...dataToAdd, ...preData]));
    }else {
      localStorage.setItem("loan", JSON.stringify(preData));
    }

    // const loans = JSON.parse(localStorage.getItem("loan"));
    // console.log("loans:", loans);

    // if (loans && loans.length === 0) {
    //   localStorage.setItem("loan", JSON.stringify(preData));
    //   setLoanData([...preData]);
    // }
  }, []);

  useEffect(() => {
    if (newLoan) {
      localStorage.setItem("loan", JSON.stringify([...dataToAdd, ...preData]));
    }
  }, [newLoan]);

  const handleRefresh = () => {
    localStorage.setItem("newLoan", false);
    localStorage.setItem("loan", JSON.stringify(preData));
    setNewLoan(false);
    setLoanData([...preData]);
  };

  return (
    <div className="bg-white rounded-lg flex flex-col relative w-full h-[80vh] lg:max-w-[1140px] md:max-w-[720px] max-w-[540px] mx-auto text-gray-700">
      <div className="m-1">
        <div className="border-b border-[#dee2e6] pt-12 pb-5">
          <p className="text-sm font-lato mt-1">
            <span className="text-xl font-light text-center text-[#212529] mr-10 font-lato">
              Loan Origination
            </span>
            Securely execute a loan origination workflow, including application,
            document ingestion, and eSignature.
          </p>
        </div>
        <div className="flex flex-col pt-8">
          <div className="flex items-center justify-between pb-5">
            <p className="text-xl font-light text-[#212529] font-lato">
              My Loans
            </p>
            <div
              className="flex items-center justify-end text-[#dc3545] cursor-pointer"
              onClick={() => handleRefresh()}
            >
              <RotateCw className="h-4 w-4" />
            </div>
          </div>
          <table className="border border-[#dee2e6] text-sm">
            <thead>
              <tr>
                <th className="p-5"></th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loanData.length > 0 &&
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
                      className={`${
                        status === "Fully Paid" && "text-green-600"
                      } ${status === "Active" && "text-[#17a2b8]"} ${
                        status === "Processing" && "text-[#ffc107]"
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
        {newLoan ? (
          <div
            className="flex max-w-60 items-center text-[#17a2b8] gap-3 text-2xl py-10 cursor-pointer"
            onClick={() => router.push(`loans/new?type=mortgage`)}
          >
            <List className="size-8" />
            View Application
          </div>
        ) : (
          <div
            className={`flex items-center justify-between cursor-pointer bg-[#f8f9fa] border border-transparent hover:border-[#dee2e6] p-3 max-w-48 rounded-md relative mt-5 ${
              isLoanOptionOpen && "bg-[#dadcdd]"
            }`}
            onClick={() => setIsLoanOptionOpen((prev) => !prev)}
          >
            <div className="flex items-center gap-2">
              <Plus className="font-bold" />
              New Loan
            </div>
            <ChevronDown className="fill-black " />
            {isLoanOptionOpen && (
              <div className="flex flex-col border border-[#dee2e6] w-48 rounded px-5 py-3 space-y-2 mt-2 absolute top-full left-0 cursor-pointer">
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
