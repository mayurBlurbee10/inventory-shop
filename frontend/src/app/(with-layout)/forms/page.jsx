"use client";
import {
  ChevronDown,
  List,
  Plus,
  RotateCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

function LoansPage() {
  const router = useRouter();
  const [isLoanOptionOpen, setIsLoanOptionOpen] = useState(false);
  const [loanData, setLoanData] = useState([...preData]);
  const [newLoan, setNewLoan] = useState(false);

  console.log(loanData);

  useEffect(() => {
    const userEntered = localStorage.getItem("newLoan");
    setNewLoan(userEntered);

    if (userEntered) {
      setLoanData([...dataToAdd, ...preData]);
    }
  }, []);

  const handleRefresh = () => {
    localStorage.setItem("newLoan", false);
    setNewLoan(false);
    setLoanData([...preData]);
  };

  return (
    <div className="bg-white rounded-lg flex flex-col relative w-full min-h-screen lg:max-w-[1140px] md:max-w-[720px] max-w-[540px] mx-auto text-gray-700">
      <div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-12 mb-6">
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex-1">
              <div className="flex flex-col">
                <h3 className="text-lg font-semibold text-gray-800 font-lato">
                  Loan Origination
                </h3>
                <div className="text-sm text-gray-600">
                  Securely execute a loan origination workflow, including application, document ingestion, and eSignature.
                </div>
              </div>
            </div>
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">My Loans</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="p-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loanData &&
                loanData?.map(({ id, icon: Icon, name, type, status }) => (
                  <tr key={id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center">
                        <Icon className="size-8 text-gray-600" />
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
                        onClick={() => router.push(`/forms/details/${id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        </div>
        {newLoan ? (
          <div
            className="flex max-w-60 items-center text-[#17a2b8] gap-3 text-2xl cursor-pointer font-lato"
            onClick={() => router.push(`forms/new?type=mortgage`)}
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
                <div onClick={() => router.push(`forms/new?type=mortgage`)}>Mortgage</div>
                <div onClick={() => router.push(`forms/new?type=auto`)}>Auto</div>
                <div onClick={() => router.push(`forms/new?type=personal`)}>Personal</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LoansPage;
