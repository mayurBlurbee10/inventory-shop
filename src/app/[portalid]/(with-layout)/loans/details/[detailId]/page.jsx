"use client";
import Documents from "@/components/Documents";
import { ArrowDownUp, ChevronLeft, Folder, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
const data = [
  {
    id: 635789,
    // icon: CarFront,
    name: "Auto - 635789",
    type: "Auto",
    status: "Active",
    complete: 75,
    paid: "$40,225.00 Paid",
  },
  {
    id: 990154,
    // icon: User,
    name: "Personal - 990154",
    type: "Personal",
    status: "Fully Paid",
    complete: 100,
    paid: "Fully Paid",
  },
  {
    id: 174192,
    // icon: Home,
    name: "Mortgage - 174192",
    type: "Mortgage	",
    status: "Processing",
    complete: 30,
    paid: "In process",
  },
];

const calculatePercentage = (value, totalValue) => {
  if (totalValue === 0) {
    return 0;
  }
  return (value / totalValue) * 100;
};

function DetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loan, setLoan] = useState(null);
  useEffect(() => {
    if (params?.detailId && data) {
      const loans = JSON.parse(localStorage.getItem("loan"));
      const foundLoan = loans.find((d) => d.id === Number(params.detailId));
      setLoan(foundLoan || null);
    }
  }, [params?.detailId, data]);

  if (!loan) return <p>Loading loan details...</p>;

  return (
    <div className="bg-white rounded-lg flex flex-col relative w-full h-[80vh] lg:max-w-[1140px] md:max-w-[720px] max-w-[540px] mx-auto text-gray-700">
      <div className="border-b border-[#dee2e6] font-lato flex items-end justify-center gap-5 py-5">
        <div className="flex items-end text-blue-600" onClick={() => router.back()}>
          <ChevronLeft className="size-6"/> Back to Loans
        </div>
        <h1 className="text-3xl font-lato font-light text-center">
          Loan Detail
        </h1>
        <p className="italic text-gray-500 text-base">ID:{loan?.id}</p>
      </div>
      <div className="grid grid-cols-2 gap-x-10">
        <div className="space-y-3 font-lato p-5">
          <h1 className="text-6xl font-light italic">{loan?.name}</h1>
          <div className="w-full bg-gray-200 h-5 rounded">
            <div
              className={`h-5 rounded text-xs flex items-center justify-center text-white ${
                loan?.status === "Fully Paid" && "bg-green-600"
              } ${loan?.status === "Active" && "bg-[#17a2b8]"} ${
                loan?.status === "Processing" && "bg-[#ffc107]"
              }`}
              style={{ width: `${calculatePercentage(loan?.complete, 100)}%` }}
            >
              {loan?.paid}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xl">
            <p>Status:</p>
            <p
              className={`font-light ${
                loan?.status === "Fully Paid" && "text-green-600"
              } ${loan?.status === "Active" && "text-[#17a2b8]"} ${
                loan?.status === "Processing" && "text-[#ffc107]"
              }`}
            >
              {loan?.status}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xl">
            <p>Type:</p>
            <p className="font-light">{loan?.type}</p>
          </div>
          <div className="flex items-center gap-2 text-xl">
            <p>Start Date:</p>
            <p className="font-light">11/04/2016</p>
          </div>
          <div className="flex items-center gap-2 text-xl">
            <p>End Date:</p>
            <p className="font-light">04/04/2025</p>
          </div>
          <div className="flex items-center gap-2 text-xl">
            <p>Loan Amount:</p>
            <p className="font-light">$56,495</p>
          </div>
          <div className="flex items-center gap-2 text-xl">
            <p>Downpayment:</p>
            <p className="font-light">$10,000</p>
          </div>
          <div className="flex items-center gap-2 text-xl">
            <p>APR:</p>
            <p className="font-light">4.70%</p>
          </div>
        </div>
        <div className="flex flex-col font-lato">
          <h1 className="text-xl text-center font-lato font-light my-5">
            Loan Documents
          </h1>
          <Documents
            fileType={"loan"}
            loanFolderId={loan?.folderId}
          />
          {/* <div className="flex items-center gap-2 p-5 bg-[#fcfcfc] border-b border-[#ced4da]">
            <input
              type="text"
              placeholder="Search files and folder"
              className="text-sm border border-[#ced4da] rounded p-1 w-full mr-2"
            />
          </div>
          <div className="flex items-center justify-between text-sm p-3 border-b border-[#ced4da]">
            <p>testUser@yopmail.com</p>
            <div className="flex items-center gap-1">
              <ArrowDownUp className="size-4" />
              <Plus className="size-4" />
            </div>
          </div>
          <div className="flex items-center w-full text-xs bg-[#fcfcfc] py-2 px-3 gap-2 border-b border-[#ced4da]">
            <Folder />
            <div className="w-full">
              <p className="text-sm font-normal text-gray-700 text-center">
                Loans
              </p>
              <p className="text-gray-400 text-center">
                Modified today by testUser@yopmail.com - 1.38 MB
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs bg-[#fcfcfc] py-2 px-3 gap-2 border-b border-[#ced4da]">
            <Folder />
            <div className="w-full">
              <p className="text-sm font-normal text-gray-700 text-center">
                Personal Documents
              </p>
              <p className="text-gray-400 text-center">
                Modified Wed Jan 12 2025 by Wealthportal Service Account - 40.63
                KB
              </p>
            </div>
          </div>
          <div className="flex items-center text-xs bg-[#fcfcfc] py-2 px-3 gap-2 border-b border-[#ced4da]">
            <Folder />
            <div className="w-full">
              <p className="text-sm font-normal text-gray-700 text-center">
                Text Prep 2019
              </p>
              <p className="text-gray-400 text-center">
                Modified Wed Jan 12 2025 by Wealthportal Service Account -
                368.28 KB
              </p>
            </div>
          </div> */}
          {/* <div className="flex items-center text-xs bg-[#fcfcfc] py-2 px-3 gap-2 border-b border-[#ced4da]">
              <Folder />
              <div>
                <p className="text-sm font-normal text-black">pay-stub.pdf</p>
                <p>Modified Wed Jan 12 2025 by Wealthportal Service Account</p>
                <p>40.63 KB</p>
              </div>
            </div> */}
        </div>
      </div>
    </div>
  );
}

export default DetailsPage;
