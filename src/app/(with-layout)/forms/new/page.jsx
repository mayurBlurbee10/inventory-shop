"use client";
import Button from "@/components/Common/Elements/Button";
import {
  ArrowDownUp,
  Folder,
  ListChecks,
  Plus,
  Signature,
  UploadCloud,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const ApplicationStep = ({ setActiveStep }) => {
  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    SSN_1: "",
    SSN_2: "",
    SSN_3: "",
    employer: "",
    annualIncome: "",
    purchasePrice: "",
    mortgageAmount: "",
    propertyLocation: "",
  });

  const preUserData = {
    firstName: "David",
    lastName: "West",
    phoneNumber: "(415)555-5555",
    SSN_1: 123,
    SSN_2: 45,
    SSN_3: 6789,
    employer: "Box, Inc.",
    annualIncome: "100,000.00",
    purchasePrice: "600,000.00",
    mortgageAmount: "565,000.00",
    propertyLocation: "CA",
  };
  return (
    <div className="flex flex-col justify-center w-full font-lato">
      <h1 className="text-center text-3xl text-black p-10">Application</h1>
      <form className="space-y-3">
        <div className="flex items-center justify-between text-sm text-black pl-10 pr-20 lg:pr-40">
          <label htmlFor="firstName" className="w-2/5">
            First Name
          </label>
          <input
            type="text"
            value={userData.firstName}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            className="px-3 py-2 rounded w-3/5 lg:w-1/2 border border-[#ced4da]"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-black pl-10 pr-20 lg:pr-40">
          <label htmlFor="lastName" className="w-2/5">
            Last Name
          </label>
          <input
            type="text"
            value={userData.lastName}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className="border border-[#ced4da] px-3 py-2 rounded w-3/5 lg:w-1/2"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-black pl-10 pr-20 lg:pr-40">
          <label htmlFor="phoneNumber" className="w-2/5">
            Phone Number
          </label>
          <input
            type="text"
            value={userData.phoneNumber}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            className="border border-[#ced4da] px-3 py-2 rounded w-3/5 lg:w-1/2"
          />
        </div>
        <hr className="bg-[#dee2e6] w-full mx-10" />
        <div className="flex items-center justify-between text-sm text-black pl-10 pr-20 lg:pr-40">
          <label htmlFor="SSN">SSN</label>
          <div className="flex gap-2  w-3/5 lg:w-1/2">
            <input
              type="password"
              value={userData.SSN_1}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, SSN_1: e.target.value }))
              }
              className="border border-[#ced4da] px-3 py-2 rounded w-3/5 lg:w-1/2"
            />
            <input
              type="password"
              value={userData.SSN_2}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, SSN_2: e.target.value }))
              }
              className="border border-[#ced4da] px-3 py-2 rounded w-3/5 lg:w-1/2"
            />
            <input
              type="password"
              value={userData.SSN_3}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, SSN_3: e.target.value }))
              }
              className="border border-[#ced4da] px-3 py-2 rounded w-3/5 lg:w-1/2"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-black pl-10 pr-20 lg:pr-40">
          <label htmlFor="employer" className="w-2/5">
            Employer
          </label>
          <input
            type="text"
            value={userData.employer}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, employer: e.target.value }))
            }
            className="border border-[#ced4da] px-3 py-2 rounded w-3/5 lg:w-1/2"
          />
        </div>
        <div className="flex items-center justify-between text-sm text-black pl-10 pr-20 lg:pr-40">
          <label htmlFor="annualIncome" className="w-2/5">
            Annual Income
          </label>
          <div className="rounded flex w-3/5 lg:w-1/2 bg-[#e9ecef] border border-[#ced4da]">
            <p className="px-3 flex items-center">$</p>
            <input
              type="text"
              value={userData.annualIncome}
              onChange={(e) =>
                setUserData((prev) => ({
                  ...prev,
                  annualIncome: e.target.value,
                }))
              }
              className="border-l border-[#ced4da] px-3 py-2 rounded-tr rounded-tb w-full"
            />
          </div>
        </div>
        <hr className="bg-[#dee2e6] w-full mx-10" />
        <div className="flex items-center justify-between text-sm text-black pl-10 pr-20 lg:pr-40">
          <label htmlFor="purchasePrice" className="w-2/5">
            Expected Purchase Price
          </label>
          <div className="rounded flex w-3/5 lg:w-1/2 bg-[#e9ecef] border border-[#ced4da]">
            <p className="px-3 flex items-center">$</p>
            <input
              type="text"
              value={userData.purchasePrice}
              onChange={(e) =>
                setUserData((prev) => ({
                  ...prev,
                  purchasePrice: e.target.value,
                }))
              }
              className="border-l border-[#ced4da] px-3 py-2 rounded-tr rounded-tb w-full"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-black pl-10 pr-20 lg:pr-40">
          <label htmlFor="mortgageAmount" className="w-2/5">
            Desired Mortgage Amount
          </label>
          <div className="rounded flex w-3/5 lg:w-1/2 bg-[#e9ecef] border border-[#ced4da]">
            <p className="px-3 flex items-center">$</p>
            <input
              type="text"
              value={userData.mortgageAmount}
              onChange={(e) =>
                setUserData((prev) => ({
                  ...prev,
                  mortgageAmount: e.target.value,
                }))
              }
              className="border-l border-[#ced4da] px-3 py-2 rounded-tr rounded-tb w-full"
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-black pl-10 pr-20 lg:pr-40">
          <label htmlFor="propertyLocation" className="w-2/5">
            Property Location
          </label>
          <select
            type="text"
            value={userData.propertyLocation}
            onChange={(e) =>
              setUserData((prev) => ({
                ...prev,
                propertyLocation: e.target.value,
              }))
            }
            className="border border-[#ced4da] px-3 py-2 rounded w-3/5 lg:w-1/2"
          >
            <option value="CA">CA</option>
            <option value="NY">NY</option>
          </select>
          {/* <input className="border border-[#ced4da] px-3 py-2 rounded w-3/5 lg:w-1/2" /> */}
        </div>
      </form>

      <div className="flex items-center justify-between pl-10 py-10">
        <div
          className="bg-[#17a2b8] rounded p-[6px] text-white cursor-pointer"
          onClick={() => setUserData((prev) => ({ ...prev, ...preUserData }))}
        >
          <ListChecks className="size-5" />
        </div>

        <Button
          onClick={() => setActiveStep("documents")}
          type="Primary"
          label="Next"
        />
      </div>
    </div>
  );
};

const DocumentStep = ({ setActiveStep }) => {
  return (
    <div className="flex flex-col justify-center w-full font-lato px-10">
      <h1 className="text-center text-3xl text-black pt-10 pb-3">Documents</h1>
      <p className="font-light text-xl text-center">
        We need the <span className="font-normal">most recent</span> versions of
        these documents to proceed with your application:
      </p>
      <div className="flex items-center justify-between font-light text-xl text-center py-5 px-32">
        <p>W2 Form</p>
        <p>Pay Stub</p>
        <p>Bank Statement</p>
      </div>
      <div className="grid grid-cols-2 gap-x-5 text-center text-xl py-5">
        <h1 className="text-[#007bff]">Select from Shared Documents</h1>
        <h1 className="text-[#17a2b8] ">Upload</h1>
      </div>
      <div className="grid grid-cols-2 gap-x-5">
        <div className="flex flex-col border border-blue-500">
          <div className="flex items-center gap-2 p-3 bg-[#fcfcfc] border-b border-[#ced4da]">
            <img
              src={"/uploads/logo-1736255560176-312280627.png"}
              alt={"logo"}
              className="h-[40px] mr-2"
            />
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
          <div className="flex items-center text-xs bg-[#fcfcfc] py-2 px-3 gap-2 border-b border-[#ced4da]">
            <Folder />
            <div>
              <p className="text-sm font-normal text-black">Loans</p>
              <p>Modified today by testUser@yopmail.com</p>
              <p>1.38 MB</p>
            </div>
          </div>
          <div className="flex items-center text-xs bg-[#fcfcfc] py-2 px-3 gap-2 border-b border-[#ced4da]">
            <Folder />
            <div>
              <p className="text-sm font-normal text-black">
                Personal Documents
              </p>
              <p>Modified Wed Jan 12 2025 by Wealthportal Service Account</p>
              <p>40.63 KB</p>
            </div>
          </div>
          <div className="flex items-center text-xs bg-[#fcfcfc] py-2 px-3 gap-2 border-b border-[#ced4da]">
            <Folder />
            <div>
              <p className="text-sm font-normal text-black">Text Prep 2019</p>
              <p>Modified Wed Jan 12 2025 by Wealthportal Service Account</p>
              <p>368.28 KB</p>
            </div>
          </div>
          {/* <div className="flex items-center text-xs bg-[#fcfcfc] py-2 px-3 gap-2 border-b border-[#ced4da]">
              <Folder />
              <div>
                <p className="text-sm font-normal text-black">pay-stub.pdf</p>
                <p>Modified Wed Jan 12 2025 by Wealthportal Service Account</p>
                <p>40.63 KB</p>
              </div>
            </div> */}
          <div className="flex items-center justify-between p-4">
            <p>0 Selected</p>
            <div className="flex gap-2">
              <Button
                type="Secondary"
                label="Cancel"
              />
              <Button
                type="Secondary"
                label="Choose"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col border border-[#17a2b8]">
          {/* File Upload Section */}
          <div className="p-6 flex flex-col items-center text-center border-b flex-1 justify-center text-sm">
            <UploadCloud className="h-12 w-12 text-blue-500 mb-2" />
            <p className="text-gray-600">Drag and drop files</p>
            <p className="text-blue-600 cursor-pointer underline">
              Browse your device
            </p>
          </div>

          {/* Footer with Buttons */}
          <div className="flex justify-between items-center p-4">
            <Button
              type="Secondary"
              label="Close"
            />
            <div className="flex space-x-2">
              <Button
                type="Secondary"
                label="Cancel"
              />
              <Button
                type="Primary"
                label="Upload"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between py-10">
        <Button
          onClick={() => setActiveStep("loanestimate")}
          type="Primary"
          label="Next"
        />
      </div>
    </div>
  );
};

const LoanEstimateStep = () => {
  const router = useRouter();
  const params = useParams();
  return (
    <div className="w-full font-lato px-10">
      <div className="w-full">
        <h1 className="text-center text-3xl text-black pt-10 pb-3">
          Loan Terms
        </h1>
        <p className="font-light text-xl text-center">
          Your Loan Term Form is ready! Please follow the below link to proceed.
        </p>
      </div>
      <div className="h-full border border-[#ced4da] rounded flex flex-col items-center justify-center pt-20 pb-10 mt-16 space-y-2">
        <button
          className="border border-black rounded-md py-3 px-4 text-xl"
          onClick={() =>
            router.push(
              params.portalid ? `/${params.portalid}/forms` : "/forms"
            )
          }
        >
          Review and Sign
        </button>
        <Signature className="text-[#0057ca] size-10" />
      </div>
    </div>
  );
};

function NewLoanPage() {
  const [activeStep, setActiveStep] = useState("application");

  useEffect(() => {
    localStorage.setItem("newLoan", true);
  }, []);

  const getActiveStepContent = () => {
    switch (activeStep) {
      case "application":
        return <ApplicationStep setActiveStep={setActiveStep} />;
      case "documents":
        return <DocumentStep setActiveStep={setActiveStep} />;
      case "loanestimate":
        return <LoanEstimateStep />;
      default:
        return null;
    }
  };
  return (
    <div className="bg-white rounded-lg flex flex-col relative w-full h-[80vh] lg:max-w-[1140px] md:max-w-[720px] max-w-[540px] mx-auto text-gray-700">
      <div className="flex items-center justify-between font-lato">
        <div className="w-2/5 md:w-64 h-full border-r border-[#dee2e6] pt-5 pr-2 bg-white text-gray-700">
          <h1 className="text-3xl text-black mb-5">New Mortgage Loan</h1>
          <div className="flex flex-col items-start space-y-4">
            <button
              onClick={() => setActiveStep("application")}
              className={`text-[#107fff] ${activeStep === "application"
                  ? "text-3xl transition-all ease-in-out"
                  : "text-xl"
                }`}
            >
              1. Application
            </button>
            <button
              onClick={() => setActiveStep("documents")}
              className={`text-[#107fff] ${activeStep === "documents"
                  ? "text-3xl transition-all ease-in-out"
                  : "text-xl"
                }`}
            >
              2. Documents
            </button>
            <button
              onClick={() => setActiveStep("loanestimate")}
              className={`text-[#107fff] ${activeStep === "loanestimate"
                  ? "text-2xl transition-all ease-in-out"
                  : "text-xl"
                }`}
            >
              3. Loan Estimate
            </button>
          </div>
        </div>
        <div className="w-full">{getActiveStepContent()}</div>
      </div>
    </div>
  );
}

export default NewLoanPage;
