"use client";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Documents from "@/components/Documents";
import SignRequestModal from "@/components/SignRequestModal";
import {
  ArrowDownUp,
  CircleCheckBig,
  Folder,
  ListChecks,
  Loader2,
  Plus,
  Signature,
  UploadCloud,
  X,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const ApplicationStep = ({
  setActiveStep,
  type,
  setLoanFolderId,
  loanFolderId,
  filesList,
  userData,
  setUserData,
  uniqueNo,
  fileListLoading
}) => {
  const [isLoading, setIsLoading] = useState(false);
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

  const handelNext = async () => {
    try {
      if (loanFolderId) {
        setActiveStep("documents");
        return;
      }
      setIsLoading(true);
      let loansId = null;
      const item = findFolderWithName(filesList, "Loans");
      console.log("filesList", filesList)
      if (!item) {
        // make loan folder
        const userData = getUserData();
        let obj = {
          name: "Loans",
          boxFolderId: userData.boxFolderId,
        };
        const response = await fetchWrapper(
          "/api/box/folders",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(obj),
          },
          "create-folder"
        );

        const folderResponse = await response.json();

        if (!response.ok)
          throw new Error(folderResponse.error || "Failed to create folder");
        loansId = folderResponse.id;
      } else {
        loansId = item.id;
      }
      const res = await fetchWrapper(
        "/api/box/folders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `${type} - ${uniqueNo}`,
            boxFolderId: loansId,
          }),
        },
        "create-folder"
      );

      const loanTypeFolder = await res.json();
      if (!res.ok)
        throw new Error(folderResponse.error || "Failed to create folder");

      setLoanFolderId(loanTypeFolder.id);
      setActiveStep("documents");
    } catch (error) {
      console.error("Error creating folder files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const findFolderWithName = (data, targetName) => {
    for (const item of data) {
      if (item.type === "folder" && item.name === targetName) {
        return item;
      }
      if (item.children) {
        const found = findFolderWithName(item.children, targetName);
        if (found) return found; 
      }
    }
    return null; 
  };

  return (
    <div className="flex flex-col justify-center w-full font-lato sm:border-l overflow-hidden border-l border-[#dee2e6]">
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
        <button
          className="px-3 py-2 border border-black rounded flex gap-2"
          disabled={isLoading || fileListLoading}
          onClick={handelNext}
        >
          {(isLoading) && (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          )}
          {fileListLoading ?  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /> : "Next"}
        </button>
      </div>
    </div>
  );
};

const DocumentStep = ({ setActiveStep, loanFolderId, filesList }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [isRest, setIsRest] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handelChoose = async () => {
    try {
    const selectedItemsDetails = await new Promise((resolve) => {
      const foundItems = findItemsById(filesList, selectedItems);
      resolve(foundItems);
    });
    let obj = {
      items: selectedItemsDetails,
      destinationFolderId: loanFolderId,
    };
   
      setIsLoading(true);
      const requestOptions = {
        method: "POST",
        body: JSON.stringify(obj),
      };
      const response = await fetchWrapper(
        `/api/box/bulk/copy`,
        requestOptions,
        "bulk-copy"
      );
      if (!response.ok) throw new Error("Error bulk copy files or folders");
      setIsRest(true)
    } catch (error) {
      console.log("error: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const findItemsById = (items, idArray, result = []) => {
    items.forEach((item) => {
      if (idArray.includes(item.id)) {
        if (item.type !== "folder") {
          result.push({ id: item.id, type: item.type });
        }
      }
      if (item.children && item.children.length > 0) {
        findItemsById(item.children, idArray, result);
      }
    });
    return result;
  };

  const handleDragEvent = (e, isEntering) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  }

  const handleFileSelect = async (event) => {
    setFiles((prev) => [...prev, ...Array.from(event.target.files)]);
  }

  const uploadFiles = async () => {
    if (files.length === 0) return;
    try {
      setIsUploadLoading(true);
      const uploadData = new FormData();
      files.forEach((file) => {
        uploadData.append("file", file);
      });
      uploadData.append("boxFolderId", loanFolderId);
      const userData = getUserData();
      uploadData.append("email", userData.email);
      const requestOptions = {
        method: "POST",
        body: uploadData,
      };
      const response = await fetchWrapper(
        "/api/box/files",
        requestOptions,
        "uploadFile"
      );
      if (!response.ok) throw new Error("Failed to upload files");
      toast.success("File uploaded successfully");
      setUploadSuccess(true);
      handleCancel();
    } catch (error) {
      toast.error(error.message);
      console.error("Error uploading files:", error);
    } finally {
      setIsUploadLoading(false);
    }
  }

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  }

  const handleCancel = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  useEffect(() => {
    setIsRest(false);
  }, [selectedItems]);

  return (
    <div className="flex flex-col justify-center w-full font-lato px-5 sm:px-10 border-l border-[#dee2e6]">
      <h1 className="text-center text-3xl text-black pt-10 pb-3">Documents</h1>
      <p className="font-light text-xl text-center">
        We need the <span className="font-normal">most recent</span> versions of
        these documents to proceed with your application:
      </p>
      <div className="flex justify-between gap-5 items-center font-light text-base sm:text-lg md:text-xl text-center py-5 px-4 sm:px-10 md:px-20 lg:px-32 whitespace-nowrap overflow-x-auto">
        <p>W2 Form</p>
        <p>Pay Stub</p>
        <p>Bank Statement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-y-5 sm:gap-x-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-[#007bff] text-center text-xl">Select from Shared Documents</h1>
          <div className="border border-blue-500">
            <Documents
              fileType={"loan"}
              setSelectedItems={setSelectedItems}
              selectedItems={selectedItems}
              isRest={isRest}
            />
            <div className="flex items-center justify-between p-4">
              <p>{selectedItems.length} Selected</p>
              <div className="flex gap-2">
                <button
                  className="text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100"
                  onClick={() => {
                    setIsRest(true);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-md"
                  onClick={handelChoose}
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    {isLoading && <div className="spinner"></div>}
                    Choose
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-[#007bff] text-center text-xl">Upload</h1>
          {/* File Upload Section */}
          <div className="border  border-[#17a2b8] h-full flex flex-col">
            {uploadSuccess ? (
              <div className="p-6 flex flex-col flex-1 justif-center items-center text-center border-b text-sm">
                <CircleCheckBig className="h-12 w-12 text-blue-500 mb-2" />
                <p className="text-gray-600">Success! Your files have been uploaded.</p>
                <p className="text-blue-600 cursor-pointer underline" onClick={() => fileInputRef.current?.click()}>
                  Select More Files
                </p>
              </div>
            ) : (
              <div
                className={`p-6 flex flex-col min-h-[200px] flex-1 justify-center items-center text-center text-sm ${isDragging ? "bg-blue-50" : "bg-gray-50"
                  } ${files.length > 0 ? "hidden" : ""}`}
                onDragEnter={(e) => handleDragEvent(e, true)}
                onDragLeave={(e) => handleDragEvent(e, false)}
                onDragOver={(e) => handleDragEvent(e, true)}
                onDrop={handleDrop}
              >
                <UploadCloud className="h-12 w-12 text-blue-500 mb-2" />
                <p className="text-gray-600">Drag and drop files</p>
                <p className="text-blue-600 cursor-pointer underline" onClick={() => fileInputRef.current?.click()}>
                  Browse your device
                </p>
              </div>
            )}

            {files.length > 0 && (
              <div className="p-6 text-sm min-h-[200px] flex flex-1 flex-col">
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center border-b py-2">
                    <span>{file.name}</span>
                    <X className="cursor-pointer text-black-500" onClick={() => removeFile(index)} />
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              multiple
            />

            {/* Footer with Buttons */}
            <div className="flex justify-between border-t items-center p-4">
              <button
                className="text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100"
                disabled={files.length > 0}
              >
                Close
              </button>
              <div className="flex space-x-2">
                <button
                  className="text-gray-500 px-4 py-2 rounded-lg hover:bg-gray-100"
                  onClick={handleCancel}
                  disabled={isUploadLoading || files.length == 0}
                >
                  Cancel
                </button>
                <button
                  className="text-white px-4 py-2 rounded-md border-gray bg-blue-500 hover:bg-blue-600"
                  disabled={isUploadLoading || files.length == 0}
                  onClick={uploadFiles}
                >
                  <div className="flex items-center gap-2">
                    {isUploadLoading
                      ? <><div className="spinner"></div> Uploading</>
                      : "Upload"
                    }
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end py-10">
        <button
          className="px-3 py-2 border border-black rounded"
          disabled={isLoading || isUploadLoading}
          onClick={() => setActiveStep("loanestimate")}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const LoanEstimateStep = ({ finalStep, params, loanFolderId }) => {

  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedSignUrl, setSelectedSignUrl] = useState(null);
  const [filesToSign, setFilesToSign] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilesLoading, setIsFilesLoading] = useState(false);

  const refreshFiles = async () => {
    try {
      setIsFilesLoading(true);

      const requestOptions = {
        method: "GET",
      };

      if (loanFolderId) {
        const response = await fetchWrapper(
          `/api/box/folders?folderId=${loanFolderId}`,
          requestOptions,
          "fetchFile"
        );
        if (!response.ok) throw new Error("Failed to fetch files");
        const data = await response.json();
        const newFilesList = data?.items || [];
        setFilesToSign(newFilesList);
      }
    } catch (error) {
      console.error("Error refreshing files:", error);
    } finally {
      setIsFilesLoading(false);
    }
  };


  const handelSelfSign = async () => {
    try {
      finalStep()
      setIsLoading(true);
      const userData = getUserData();
      const response = await fetchWrapper(
        "/api/box/e-sign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: filesToSign[0].id,
            signers: [{
              signerEmail: userData.email,
              signerId: userData.id,
            }],
            boxUserId: userData.boxUserId,
            portal: params.portalid,
            onSameDoc: false,
          }),
        },
        "self-esign-request"
      );
      const data = await response.json();
      console.log('data: ', data)
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate e-sign request");
      }
      toast.success("E-sign request generated successfully.");
      const currentUserReq = data.data[0].signers.find(
        (item) => item.email === userData.email
      );
      if (currentUserReq) {
        setTimeout(() => {
          setSelectedSignUrl(currentUserReq.iframeable_embed_url);
          setIsSignModalOpen(true);
          setIsLoading(false);
        }, 2500);
      }
    } catch (error) {
      // setIsLoading(false);
      toast.error(error.message);
    }
  };

  const LoadingSpinner = () => (
    <div className="w-full inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
      <div className="text-center space-y-3">
        <div className="mx-auto h-8 w-8 animate-spin">
          <div className="h-full w-full rounded-full border-4 border-gray-200 border-t-gray-800"></div>
        </div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );

  useEffect(() => {
    refreshFiles();
  }, [loanFolderId]);

  return (
    <div className="w-full font-lato px-10 border-l border-[#dee2e6]">
      <div className="w-full">
        <h1 className="text-center text-3xl text-black pt-10 pb-3">
          Loan Terms
        </h1>
        <p className="font-light text-xl text-center">
          Your Loan Term Form is ready! Please follow the below link to proceed.
        </p>
      </div>
      <div className="h-full border border-[#ced4da] rounded flex flex-col items-center justify-center pt-20 pb-10 mt-16 space-y-2">
      {isFilesLoading ? (
          <LoadingSpinner />
        ) : (
          filesToSign?.length === 0 && (
            <h1 className="text-xl mb-3">
              Please select at least one file from previous step
            </h1>
          )
        )}

        <button
          className="border border-black rounded-md py-3 px-4 text-xl disabled:bg-gray-100 w-48 disabled:text-gray-400"
          onClick={handelSelfSign}
          disabled={filesToSign?.length === 0 || isFilesLoading}
        >
          {isLoading ? (
            <div className="spinner mx-auto"></div>
          ) : (
            "Review and Sign"
          )}
        </button>
        <Signature className="text-[#0057ca] size-10" />
        {/* <p className="font-light text-lg text-center">Your Loan has been created successfully.</p>
        <button
          onClick={finalStep}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Loan Origination
        </button> */}
      </div>
      <SignRequestModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        signUrl={selectedSignUrl}
        redirect_url={`/${params?.portalid}/loans`}
      />
    </div>
  );
};

function NewLoanPage() {
  const [activeStep, setActiveStep] = useState("application");
  const [loanFolderId, setLoanFolderId] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [shareFilesList, setShareFilesList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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
  const [uniqueNo, setUniqueNo] = useState(null);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  useEffect(() => {
    const uniqueNo = Math.floor(Date.now() % 1000000);
    setUniqueNo(uniqueNo);
    getFile();
    getShareFile();
  }, []);

  const getFile = async () => {
    try {
      setIsLoading(true);
      const userData = getUserData();
      const requestOptions = {
        method: "GET",
      };
      const response = await fetchWrapper(
        `/api/box/folders?folderId=${userData?.boxFolderId}`,
        requestOptions,
        "fetchFile"
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      const newFilesList = data?.items || [];
      setFilesList(newFilesList);
    } catch (error) {
      console.error("Error get files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getShareFile = async () => {
    try {
      setIsLoading(true);
      const userData = getUserData();
      if (userData?.collaborationIds && userData.collaborationIds.length > 0) {
        const requestOptions = {
          method: "POST",
          body: JSON.stringify({ collaborated: userData.collaborationIds }),
        };
        const response = await fetchWrapper(
          `/api/box/collaborations`,
          requestOptions,
          "fetchCollaboratedFolder"
        );
        if (!response.ok) throw new Error("Failed to get collaborated folder");
        const data = await response.json();
        const newFilesList = data?.items;
        setShareFilesList(newFilesList);
      }
    } catch (error) {
      console.error("Error get files:", error);
    } finally {
      // setIsLoading(false);
    }
  };

  const finalStep = () => {
    localStorage.setItem("newLoan", true);
    // const loans = JSON.parse(localStorage.getItem("loan") || "[]");
    // const obj = {
    //   id: uniqueNo,
    //   icon: type == 'personal' ? 'User' : (type == 'auto' ? 'CarFront' : 'Home'),
    //   name: `${type} - ${uniqueNo}`,
    //   type: type,
    //   status: "Processing",
    //   folderId: loanFolderId,
    //   complete: 30,
    //   paid: "In process"
    // }
    // if(loans.length < 3){
    //   loans.push(obj)
    // }
    // localStorage.setItem("loan", JSON.stringify(loans));
  };

  const getActiveStepContent = () => {
    switch (activeStep) {
      case "application":
        return (
          <ApplicationStep
            setActiveStep={setActiveStep}
            type={type}
            setLoanFolderId={setLoanFolderId}
            loanFolderId={loanFolderId}
            filesList={filesList}
            userData={userData}
            setUserData={setUserData}
            uniqueNo={uniqueNo}
            fileListLoading={isLoading}
          />
        );
      case "documents":
        return (
          <DocumentStep
            setActiveStep={setActiveStep}
            loanFolderId={loanFolderId}
            filesList={filesList}
          />
        );
      case "loanestimate":
        return <LoanEstimateStep finalStep={finalStep} params={params} loanFolderId={loanFolderId}/>;
      default:
        return null;
    }
  };

  // if (isLoading)
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  //     </div>
  //   );
  return (
    <div className="bg-white rounded-lg flex flex-col relative w-full min-h-[70vh] lg:max-w-[1140px] md:max-w-[720px] max-w-[540px] mx-auto text-gray-700">
      <div className="flex flex-col sm:flex-row justify-between font-lato">
        <div className="w-full sm:w-64 h-full pb-5 sm:pb-0 border-b sm:border-b-0 pt-5 px-2 bg-white text-gray-700 ">
          <h1 className="text-2xl sm:text-3xl text-black mb-5">New {type} Loan</h1>
          <div className="flex sm:items-start justify-around sm:flex-col sm:gap-4 gap-2">
            <button
              onClick={() => setActiveStep("application")}
              className={`text-[#107fff] text-sm sm:text-lg md:text-xl ${activeStep === "application"
                ? "font-bold scale-[1.1] transition-all ease-in-out"
                : ""
                }`}
            >
              1. Application
            </button>
            <button
              onClick={() => setActiveStep("documents")}
              className={`text-[#107fff] text-sm sm:text-lg md:text-xl ${activeStep === "documents"
                ? "font-bold scale-[1.1] transition-all ease-in-out"
                : ""
                }`}
            >
              2. Documents
            </button>
            <button
              onClick={() => setActiveStep("loanestimate")}
              className={`text-[#107fff] text-sm sm:text-lg md:text-xl ${activeStep === "loanestimate"
                ? "font-bold scale-[1.1] transition-all ease-in-out"
                : ""
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
