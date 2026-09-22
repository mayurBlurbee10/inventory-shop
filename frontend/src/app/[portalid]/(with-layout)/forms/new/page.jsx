"use client";
import { getUserData } from "@/app/lib/auth";
import { newLoanData } from "@/app/lib/data/loan-data";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import Documents from "@/components/Documents";
import SignRequestModal from "@/components/SignRequestModal";
import { setNewLoan } from "@/store/services/loanService";
import {
  Check,
  ChevronRight,
  CircleCheckBig,
  ListChecks,
  Signature,
  UploadCloud,
  X,
} from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getIconForType = (t) =>
  t === "auto" ? "CarFront" : t === "personal" ? "User" : "Home";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRecoverableFolderError = (msg) =>
  /same name|already exists|reserved by another processing|name is in use|wait and retry/i.test(
    msg || ""
  );

// Currency input with a "$" prefix. Defined at module scope so it isn't
// recreated on every parent render (which would drop focus while typing).
const MoneyInput = ({ id, value, onChange }) => (
  <div className="flex h-10 w-3/5 items-center overflow-hidden rounded-lg border border-input bg-background lg:w-1/2">
    <span className="flex h-full items-center bg-muted px-3 text-sm text-muted-foreground">
      $
    </span>
    <Input
      id={id}
      type="text"
      value={value}
      onChange={onChange}
      className="h-full flex-1 rounded-none border-0 border-l border-input !bg-background focus-visible:ring-0"
    />
  </div>
);

// Wrapper that maps the legacy Button API (label / isLoading / type) onto the
// shadcn Button while showing an inline spinner during loading states.
const FormButton = ({
  label,
  isLoading = false,
  disabled = false,
  variant = "default",
  children,
  ...props
}) => (
  <Button variant={variant} disabled={disabled || isLoading} {...props}>
    {isLoading && <LoaderSpinner size={16} className="text-current" />}
    {label ?? children}
  </Button>
);

const ApplicationStep = ({
  setActiveStep,
  type,
  setLoanFolderId,
  loanFolderId,
  userData,
  setUserData,
  uniqueNo,
  onLoanCreated,
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
  const { data: filesList, loading: fileListLoading } = useSelector(
    (state) => state.files
  );
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
        "fetch-file"
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      const newFilesList = data?.items || [];
      return newFilesList;
    } catch (error) {
      console.error("Error get files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handelNext = async () => {
    try {
      if (loanFolderId) {
        setActiveStep("documents");
        return;
      }
      setIsLoading(true);
      let files =
        filesList && filesList.length > 0 ? filesList : await getFile();
      let loansFolder = findFolderWithName(files, "Forms");
      let loansId = loansFolder?.id;
      console.log("filesList", filesList);

      if (!loansId) {
        // make loan folder
        const userData = getUserData();
        let obj = {
          name: "Forms",
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

        const folderData = await response.json();
        if (!response.ok) {
          const canRecover =
            response.status === 409 ||
            isRecoverableFolderError(folderData?.error);
          if (canRecover) {
            await sleep(1500);
            const refreshed = await getFile();
            const existingForms = findFolderWithName(
              refreshed || [],
              "Forms"
            );
            loansFolder = existingForms;
            loansId = existingForms?.id;
          }
          if (!loansId) {
            throw new Error(
              folderData.error || "Failed to create or find Forms folder"
            );
          }
        } else {
          loansId = folderData.id;
        }
      }

      const randomId = Math.floor(100000 + Math.random() * 900000);
      const typeKey = (type || "mortgage").toLowerCase().trim();
      const typeLabel =
        typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
      const loanName = `${typeLabel} - ${randomId}`;
      const loanFolderExist = findFolderWithName(
        loansFolder?.children || [],
        loanName
      );
      if (!loanFolderExist) {
        const res = await fetchWrapper(
          "/api/box/folders",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: loanName,
              boxFolderId: loansId,
            }),
          },
          "create-folder"
        );

        const loanTypeFolder = await res.json();
        if (!res.ok) {
          const canRecover =
            res.status === 409 ||
            isRecoverableFolderError(loanTypeFolder?.error);
          if (canRecover) {
            await sleep(1500);
            const refreshed = await getFile();
            const refreshedForms = findFolderWithName(
              refreshed || [],
              "Forms"
            );
            const existingLoanFolder = refreshedForms
              ? findFolderWithName(
                refreshedForms.children || [],
                loanName
              )
              : null;
            if (existingLoanFolder) {
              setLoanFolderId(existingLoanFolder.id);
              onLoanCreated?.({
                id: existingLoanFolder.id,
                name: existingLoanFolder.name,
                folderId: existingLoanFolder.id,
                type:
                  (type || "Mortgage").charAt(0).toUpperCase() +
                  (type || "mortgage").slice(1),
                icon: getIconForType((type || "").toLowerCase()),
                status: "Processing",
              });
              setActiveStep("documents");
              return;
            }
          }
          throw new Error(
            loanTypeFolder.error || "Failed to create loan folder"
          );
        }

        setLoanFolderId(loanTypeFolder.id);
        onLoanCreated?.({
          id: loanTypeFolder.id,
          name: loanName,
          folderId: loanTypeFolder.id,
          type:
            (type || "Mortgage").charAt(0).toUpperCase() +
            (type || "mortgage").slice(1),
          icon: getIconForType((type || "").toLowerCase()),
          status: "Processing",
        });
        setActiveStep("documents");
      } else {
        setLoanFolderId(loanFolderExist.id);
        onLoanCreated?.({
          id: loanFolderExist.id,
          name: loanFolderExist.name,
          folderId: loanFolderExist.id,
          type: (type || "Mortgage").charAt(0).toUpperCase() + (type || "mortgage").slice(1),
          icon: getIconForType((type || "").toLowerCase()),
          status: "Processing",
        });
        setActiveStep("documents");
      }
    } catch (error) {
      console.error("Error creating folder files:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const findFolderWithName = (data, targetName) => {
    for (const item of data) {
      if (
        item.type === "folder" &&
        item.name.toLowerCase() === targetName.toLowerCase()
      ) {
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
    <div className="flex w-full flex-col justify-center overflow-hidden">
      <h1 className="p-10 text-3xl text-foreground">Application</h1>
      <form className="space-y-3">
        <div className="flex items-center justify-between pl-10 pr-20 text-sm text-foreground lg:pr-40">
          <Label htmlFor="firstName" className="w-2/5">
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            value={userData.firstName}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, firstName: e.target.value }))
            }
            className="h-10 w-3/5 lg:w-1/2 !bg-background"
          />
        </div>
        <div className="flex items-center justify-between pl-10 pr-20 text-sm text-foreground lg:pr-40">
          <Label htmlFor="lastName" className="w-2/5">
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            value={userData.lastName}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, lastName: e.target.value }))
            }
            className="h-10 w-3/5 lg:w-1/2 !bg-background"
          />
        </div>
        <div className="flex items-center justify-between pl-10 pr-20 text-sm text-foreground lg:pr-40">
          <Label htmlFor="phoneNumber" className="w-2/5">
            Phone Number
          </Label>
          <Input
            id="phoneNumber"
            type="text"
            value={userData.phoneNumber}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            className="h-10 w-3/5 lg:w-1/2 !bg-background"
          />
        </div>
        <Separator className="mx-10 w-auto" />
        <div className="flex items-center justify-between pl-10 pr-20 text-sm text-foreground lg:pr-40">
          <Label htmlFor="SSN_1">SSN</Label>
          <div className="flex w-3/5 gap-2 lg:w-1/2">
            <Input
              id="SSN_1"
              type="password"
              value={userData.SSN_1}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, SSN_1: e.target.value }))
              }
              className="h-10 w-3/5 lg:w-1/2 !bg-background"
            />
            <Input
              type="password"
              value={userData.SSN_2}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, SSN_2: e.target.value }))
              }
              className="h-10 w-3/5 lg:w-1/2 !bg-background"
            />
            <Input
              type="password"
              value={userData.SSN_3}
              onChange={(e) =>
                setUserData((prev) => ({ ...prev, SSN_3: e.target.value }))
              }
              className="h-10 w-3/5 lg:w-1/2 !bg-background"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pl-10 pr-20 text-sm text-foreground lg:pr-40">
          <Label htmlFor="employer" className="w-2/5">
            Employer
          </Label>
          <Input
            id="employer"
            type="text"
            value={userData.employer}
            onChange={(e) =>
              setUserData((prev) => ({ ...prev, employer: e.target.value }))
            }
            className="h-10 w-3/5 lg:w-1/2 !bg-background"
          />
        </div>
        <div className="flex items-center justify-between pl-10 pr-20 text-sm text-foreground lg:pr-40">
          <Label htmlFor="annualIncome" className="w-2/5">
            Annual Income
          </Label>
          <MoneyInput
            id="annualIncome"
            value={userData.annualIncome}
            onChange={(e) =>
              setUserData((prev) => ({
                ...prev,
                annualIncome: e.target.value,
              }))
            }
          />
        </div>
        <Separator className="mx-10 w-auto" />
        <div className="flex items-center justify-between pl-10 pr-20 text-sm text-foreground lg:pr-40">
          <Label htmlFor="purchasePrice" className="w-2/5">
            Expected Purchase Price
          </Label>
          <MoneyInput
            id="purchasePrice"
            value={userData.purchasePrice}
            onChange={(e) =>
              setUserData((prev) => ({
                ...prev,
                purchasePrice: e.target.value,
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between pl-10 pr-20 text-sm text-foreground lg:pr-40">
          <Label htmlFor="mortgageAmount" className="w-2/5">
            Desired Mortgage Amount
          </Label>
          <MoneyInput
            id="mortgageAmount"
            value={userData.mortgageAmount}
            onChange={(e) =>
              setUserData((prev) => ({
                ...prev,
                mortgageAmount: e.target.value,
              }))
            }
          />
        </div>
        <div className="flex items-center justify-between pl-10 pr-20 text-sm text-foreground lg:pr-40">
          <Label htmlFor="propertyLocation" className="w-2/5">
            Property Location
          </Label>
          <Select
            value={userData.propertyLocation}
            onValueChange={(value) =>
              setUserData((prev) => ({ ...prev, propertyLocation: value }))
            }
          >
            <SelectTrigger id="propertyLocation" className="h-10 w-3/5 !bg-background lg:w-1/2">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CA">CA</SelectItem>
              <SelectItem value="NY">NY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>

      <div className="flex items-center justify-between py-10 pl-10">
        <AppTooltip label="Prefill sample data">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Prefill sample data"
            onClick={() => setUserData((prev) => ({ ...prev, ...preUserData }))}
          >
            <ListChecks className="size-5" />
          </Button>
        </AppTooltip>
        <FormButton
          type="button"
          variant="default"
          className="px-3 py-3"
          onClick={handelNext}
          disabled={isLoading || fileListLoading}
          isLoading={isLoading || fileListLoading}
          label="Next"
        />
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj),
      };
      const response = await fetchWrapper(
        `/api/box/bulk/copy`,
        requestOptions,
        "bulk-copy"
      );
      if (!response.ok) throw new Error("Error bulk copy files or folders");
      setIsRest(true);
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
  };

  const handleFileSelect = async (event) => {
    setFiles((prev) => [...prev, ...Array.from(event.target.files)]);
  };

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
      uploadData.append("userId", userData.boxUserId);
      const requestOptions = {
        method: "POST",
        body: uploadData,
      };
      const response = await fetchWrapper(
        "/api/box/files",
        requestOptions,
        "upload-file"
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
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

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
    <div className="flex w-full flex-col justify-center px-5 sm:px-10">
      <h1 className="pb-3 pt-10 text-3xl text-foreground">Documents</h1>
      <p className="text-xl font-light text-muted-foreground">
        We need the{" "}
        <span className="font-normal text-foreground">most recent</span>{" "}
        versions of these documents to proceed with your application:
      </p>
      <div className="flex items-center justify-between gap-5 overflow-x-auto whitespace-nowrap px-4 py-5 text-center text-base font-light text-foreground sm:px-10 sm:text-lg md:px-20 md:text-xl lg:px-32">
        <p>W2 Form</p>
        <p>Pay Stub</p>
        <p>Bank Statement</p>
      </div>

      <div className="grid grid-cols-1 gap-y-5 md:grid-cols-1 lg:grid-cols-2 sm:gap-x-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-center text-xl text-secondary-foreground">
            Select from Shared Documents
          </h1>
          <div className="rounded-xl border border-border">
            <Documents
              fileType={"loan"}
              setSelectedItems={setSelectedItems}
              selectedItems={selectedItems}
              isRest={isRest}
            />
            <div className="flex items-center justify-between border-t border-border p-4">
              <p className="text-muted-foreground">
                {selectedItems.length} Selected
              </p>
              <div className="flex gap-2">
                <FormButton
                  type="button"
                  variant="outline"
                  className="px-3 py-3"
                  onClick={() => {
                    setIsRest(true);
                  }}
                  disabled={isLoading}
                  label="Cancel"
                />
                <FormButton
                  onClick={handelChoose}
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="px-3 py-3"
                  label="Choose"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h1 className="text-center text-xl text-secondary-foreground">Upload</h1>
          {/* File Upload Section */}
          <div className="flex h-full flex-col rounded-xl border border-border">
            {uploadSuccess ? (
              <div className="flex flex-1 flex-col items-center border-b border-border p-6 text-center text-sm">
                <CircleCheckBig className="mb-2 h-12 w-12 text-success" />
                <p className="text-muted-foreground">
                  Success! Your files have been uploaded.
                </p>
                <p
                  className="cursor-pointer text-secondary-foreground underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select More Files
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "flex min-h-[200px] flex-1 flex-col items-center justify-center p-6 text-center text-sm transition-colors",
                  isDragging ? "bg-accent" : "bg-muted/40",
                  files.length > 0 && "hidden"
                )}
                onDragEnter={(e) => handleDragEvent(e, true)}
                onDragLeave={(e) => handleDragEvent(e, false)}
                onDragOver={(e) => handleDragEvent(e, true)}
                onDrop={handleDrop}
              >
                <UploadCloud className="mb-2 h-12 w-12 text-secondary-foreground" />
                <p className="text-muted-foreground">Drag and drop files</p>
                <p
                  className="cursor-pointer text-secondary-foreground underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse your device
                </p>
              </div>
            )}

            {files.length > 0 && (
              <div className="flex min-h-[200px] flex-1 flex-col p-6 text-sm">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-border py-2"
                  >
                    <span className="text-foreground">{file.name}</span>
                    <X
                      className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => removeFile(index)}
                    />
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
            <div className="flex items-center justify-between border-t border-border p-4">
              <FormButton
                disabled={files.length > 0 || isUploadLoading}
                variant="outline"
                className="px-3 py-3"
                label="Close"
              />
              <div className="flex gap-2">
                <FormButton
                  onClick={handleCancel}
                  disabled={isUploadLoading || files.length == 0}
                  variant="outline"
                  className="px-3 py-3"
                  label="Cancel"
                />
                <FormButton
                  onClick={uploadFiles}
                  disabled={isUploadLoading || files.length == 0}
                  isLoading={isUploadLoading}
                  className="px-3 py-3"
                  label="Upload"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-5 py-10">
        <FormButton
          onClick={() => setActiveStep("application")}
          disabled={isLoading || isUploadLoading}
          variant="outline"
          className="px-3 py-3"
          label="Back"
        />
        <FormButton
          onClick={() => setActiveStep("loanestimate")}
          disabled={isLoading || isUploadLoading}
          className="px-3 py-3"
          label="Next"
        />
      </div>
    </div>
  );
};

const LoanEstimateStep = ({ finalStep, params, loanFolderId, setActiveStep }) => {
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
          "fetch-file"
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
      finalStep();
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
            signers: [
              {
                signerEmail: userData.email,
                signerId: userData.id,
              },
            ],
            boxUserId: userData.boxUserId,
            portal: params.portalid || "root",
            onSameDoc: false,
          }),
        },
        "self-esign-request"
      );
      const data = await response.json();
      console.log("data: ", data);
      if (!response.ok) {
        setIsLoading(false);
        throw new Error(data.error || "Failed to generate e-sign request");
      }
      toast.success("E-sign request generated successfully.");
      const currentUserReq = data.data[0].signers.find(
        (item) => item.email === userData.email
      );
      if (currentUserReq) {
        setTimeout(() => {
          setSelectedSignUrl(currentUserReq.iframeableEmbedUrl);
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
    <div className="inset-0 z-10 flex w-full items-center justify-center bg-background/90">
      <div className="space-y-3 text-center">
        <LoaderSpinner size={32} className="text-secondary-foreground" />
      </div>
    </div>
  );

  useEffect(() => {
    refreshFiles();
  }, [loanFolderId]);

  return (
    <div className="w-full px-10">
      <div className="w-full">
        <h1 className="pb-3 pt-10 text-3xl text-foreground">Loan Terms</h1>
        <p className="text-xl font-light text-muted-foreground">
          Your Loan Term Form is ready! Please follow the below link to proceed.
        </p>
      </div>
      <div className="mt-16 flex h-full flex-col items-center justify-center space-y-2 rounded-xl border border-border pb-10 pt-20">
        {isFilesLoading ? (
          <LoadingSpinner />
        ) : (
          filesToSign?.length === 0 && (
            <h1 className="mb-3 text-xl text-foreground">
              Please select at least one file from previous step
            </h1>
          )
        )}

        <Button
          variant="outline"
          size="lg"
          className="w-48 py-3 text-xl"
          onClick={handelSelfSign}
          disabled={filesToSign?.length === 0 || isFilesLoading}
        >
          {isLoading ? (
            <LoaderSpinner size={20} className="text-current" />
          ) : (
            "Review and Sign"
          )}
        </Button>
        <Signature className="size-10 text-secondary-foreground" />
      </div>
      <SignRequestModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        signUrl={selectedSignUrl}
        redirect_url={`/${params?.portalid}/forms`}
      />
      <div className="mt-5 flex w-full justify-end">
        <FormButton
          onClick={() => setActiveStep("documents")}
          variant="outline"
          label="Back"
        />
      </div>
    </div>
  );
};

function NewLoanPage() {
  const [activeStep, setActiveStep] = useState("application");
  const [loanFolderId, setLoanFolderId] = useState(null);
  const [createdLoan, setCreatedLoan] = useState(null);
  const [filesList, setFilesList] = useState([]);
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
  const params = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const dispatch = useDispatch();

  useEffect(() => {
    const uniqueNo = Math.floor(Date.now() % 1000000);
    setUniqueNo(uniqueNo);
    getFile();
    // getShareFile();
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
        "fetch-file"
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

  const finalStep = () => {
    dispatch(setNewLoan(createdLoan ? [createdLoan] : newLoanData));
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
            userData={userData}
            setUserData={setUserData}
            uniqueNo={uniqueNo}
            onLoanCreated={setCreatedLoan}
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
        return (
          <LoanEstimateStep
            setActiveStep={setActiveStep}
            finalStep={finalStep}
            params={params}
            loanFolderId={loanFolderId}
          />
        );
      default:
        return null;
    }
  };

  const WizardStep = ({ step, currentStep }) => {
    const isCompleted = currentStep > step;
    const isActive = currentStep === step;

    return (
      <div className="flex w-40 items-center">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border",
            isCompleted
              ? "border-transparent bg-primary-solid text-primary-foreground"
              : isActive
                ? "border-secondary-foreground bg-background text-secondary-foreground"
                : "border-border bg-background text-muted-foreground"
          )}
        >
          {isCompleted ? (
            <Check size={16} className="text-primary-foreground" />
          ) : (
            <span className={isActive ? "text-secondary-foreground" : "text-accent"}>
              {step + 1}
            </span>
          )}
        </div>
        <div
          className={cn(
            "ml-3",
            isActive || isCompleted ? "text-secondary-foreground" : "text-accent"
          )}
        >
          {["Application", "Documents", "Loan Estimate"][step]}
        </div>
      </div>
    );
  };
  const steps = ["application", "documents", "loanestimate"];
  const activeStepIndex = steps.indexOf(activeStep);
  const stepRefs = useRef([]);
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    if (activeStepIndex >= 0 && stepRefs.current[activeStepIndex]) {
      stepRefs.current[activeStepIndex].scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeStepIndex]);

  return (
    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-[540px] flex-col bg-background text-foreground md:max-w-[720px] lg:max-w-[1140px]">
      <div className="flex flex-col justify-between">
        <div className="flex h-full w-full flex-col justify-start px-2 pb-5 text-foreground sm:pb-0">
          <div className="border-b border-border pb-5 pt-12">
            <p className="text-sm">
              <span className="mb-2 mr-10 block text-xl font-light text-foreground sm:text-center md:mb-0 md:inline">
                New {type.charAt(0).toUpperCase() + type.slice(1)} Loan
              </span>
            </p>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex w-full overflow-auto px-6 py-4 sm:justify-center"
          >
            <div className="flex items-center justify-between space-x-8">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className="flex items-center"
                  ref={(el) => (stepRefs.current[step] = el)}
                >
                  <WizardStep step={step} currentStep={activeStepIndex} />
                  {step < 2 && (
                    <ChevronRight size={16} className="mx-2 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="w-full">{getActiveStepContent()}</div>
      </div>
    </div>
  );
}

export default NewLoanPage;
