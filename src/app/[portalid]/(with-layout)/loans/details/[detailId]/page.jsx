"use client";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Documents from "@/components/Documents";
import { getUserData } from "@/lib/auth";
import { ArrowDownUp, ChevronLeft, Folder, Loader2, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
const data = [
  {
    id: 635789,
    name: "Auto - 635789",
    type: "Auto",
    status: "Active",
    complete: 75,
    paid: "$40,225.00 Paid",
  },
  {
    id: 990154,
    name: "Personal - 990154",
    type: "Personal",
    status: "Fully Paid",
    complete: 100,
    paid: "Fully Paid",
  },
  {
    id: 174192,
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
  const [isLoading, setIsLoading] = useState(false);

  const findFolderWithName = (data, targetName) => {
    for (const item of data) {
      if (item.type === "folder" && item.name.toLowerCase() === targetName.toLowerCase()) {
        return item;
      }
      if (item.children) {
        const found = findFolderWithName(item.children, targetName);
        if (found) return found;
      }
    }
    return null;
  };

  const getFiles = async () => {
    try {
      const userData = getUserData();
      if (!userData) return;
      const response = await fetchWrapper(
        `/api/box/folders?folderId=${userData?.boxFolderId}`,
        { method: "GET" },
        "fetchFile"
      );
      if (!response.ok) throw new Error("Failed to fetch files");

      const data = await response.json();
      return data?.items || [];
    } catch (error) {
      console.error("Error fetching files:", error);
      return [];
    }
  };

  const handleGetFolderId = async (loan) => {
    try {
      setIsLoading(true);
      const files = await getFiles();
      const userData = getUserData();
      if (!userData || !files) return;

      const loansFolder = await new Promise((resolve) => {
        const foundItems = findFolderWithName(files, "Loans");
        resolve(foundItems);
      });
      let loansId = loansFolder?.id;

      if (!loansId) {
        const response = await fetchWrapper(
          "/api/box/folders",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Loans",
              boxFolderId: userData?.boxFolderId,
            }),
          },
          "create-folder"
        );

        const folderData = await response.json();
        if (!response.ok) {
          if (folderData?.response?.status !== 409) {
            throw new Error(
              folderData.error || "Failed to create Loans folder"
            );
          } else {
            return;
          }
        }
        loansId = folderData.id;
      }

      let loanFolder = await new Promise((resolve) => {
        const foundItems = findFolderWithName(
          loansFolder?.children || [],
          loan?.name
        );
        resolve(foundItems);
      });
      console.log("loanFolder", loanFolder);
      if (!loanFolder) {
        const res = await fetchWrapper(
          "/api/box/folders",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: loan?.name, boxFolderId: loansId }),
          },
          "create-folder"
        );

        const loanFolderData = await res.json();
        if (!res.ok)
          throw new Error(
            loanFolderData.error || "Failed to create loan folder"
          );

        loanFolder = loanFolderData;
      }

      setLoan((prev) => ({ ...prev, folderId: loanFolder.id }));
      return loanFolder.id;
    } catch (error) {
      console.error("Error creating/getting folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchLoanFolder = async () => {
      if (params?.detailId) {
        const loans = JSON.parse(localStorage.getItem("loan")) || [];
        const foundLoan = loans.find((d) => d.id === Number(params.detailId));

        if (foundLoan) {
          setLoan(foundLoan);
          const folderId = await handleGetFolderId(foundLoan);
          foundLoan.folderId = folderId;

          const updatedLoans = loans.map((loan) =>
            loan.id === foundLoan.id ? foundLoan : loan
          );
          localStorage.setItem("loan", JSON.stringify(updatedLoans));
        }
      }
    };

    fetchLoanFolder();
  }, [params?.detailId]);

  if (!loan) return <p>Loading loan details...</p>;

  return (
    <div className="bg-white rounded-lg flex flex-col relative w-full lg:max-w-[1140px] md:max-w-[720px] max-w-[540px] mx-auto text-gray-700">
      <div className="border-b border-[#dee2e6] font-lato flex items-end justify-center gap-5 py-5">
        <div
          className="flex items-end text-blue-600"
          onClick={() => router.back()}
        >
          <ChevronLeft className="size-6" /> Back to Loans
        </div>
        <h1 className="text-3xl font-lato font-light text-center">
          Loan Detail
        </h1>
        <p className="italic text-gray-500 text-base">ID:{loan?.id}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
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
          {loan?.folderId ? (
            <Documents fileType={"loan"} loanFolderId={loan.folderId} />
          ) : (
            <div className="min-h-[50vh] flex items-center justify-center">
              <Loader2 className="m-auto size-8 animate-spin text-blue-500" />
            </div>
          )}
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
