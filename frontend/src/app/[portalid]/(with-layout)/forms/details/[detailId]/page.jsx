"use client";

import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { cn } from "@/app/lib/utils";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import Documents from "@/components/Documents";
import { getUserData } from "@/lib/auth";
import { setLoans } from "@/store/services/loanService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const calculatePercentage = (value, totalValue) => {
  if (totalValue === 0) {
    return 0;
  }
  return (value / totalValue) * 100;
};

const getStatusBadgeClass = (status) => {
  if (status === "Fully Paid") return "border-success text-success";
  if (status === "Active") return "border-primary-solid text-secondary-foreground";
  return "border-warning text-warning";
};

const getProgressBarClass = (status) => {
  if (status === "Fully Paid") return "bg-success";
  if (status === "Active") return "bg-primary";
  return "bg-warning";
};

function DetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [loan, setLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { data: loanData } = useSelector((state) => state.loans);
  const dispatch = useDispatch();
  const fetchInProgressRef = useRef(false);

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

  const getFiles = async () => {
    try {
      const userData = getUserData();
      if (!userData) return;
      const response = await fetchWrapper(
        `/api/box/folders?folderId=${userData?.boxFolderId}`,
        { method: "GET" },
        "fetch-file",
      );
      if (!response.ok) throw new Error("Failed to fetch files");

      const data = await response.json();
      return data?.items || [];
    } catch (error) {
      console.error("Error fetching files:", error);
      return [];
    }
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const isRecoverableFolderError = (errorMsg) =>
    /same name|already exists|reserved by another processing|name is in use|wait and retry/i.test(
      errorMsg || "",
    );

  const handleGetFolderId = async (loanItem) => {
    try {
      setIsLoading(true);
      const files = await getFiles();
      const userData = getUserData();
      if (!userData || !files) return;

      let loansFolder = await new Promise((resolve) => {
        const foundItems = findFolderWithName(files, "Forms");
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
              name: "Forms",
              boxFolderId: userData?.boxFolderId,
            }),
          },
          "create-folder",
        );

        const folderData = await response.json();
        if (!response.ok) {
          const canRecover =
            response.status === 409 ||
            isRecoverableFolderError(folderData?.error);
          if (canRecover) {
            await sleep(1500);
            const refreshedFiles = await getFiles();
            const existingForms = findFolderWithName(
              refreshedFiles || [],
              "Forms",
            );
            loansId = existingForms?.id;
            if (existingForms) loansFolder = existingForms;
          }
          if (!loansId) {
            throw new Error(
              folderData?.error || "Failed to create or find Forms folder",
            );
          }
        } else {
          loansId = folderData.id;
        }
      }

      let loanFolder = await new Promise((resolve) => {
        const foundItems = findFolderWithName(
          loansFolder?.children || [],
          loanItem?.name,
        );
        resolve(foundItems);
      });
      if (!loanFolder) {
        const res = await fetchWrapper(
          "/api/box/folders",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: loanItem?.name,
              boxFolderId: loansId,
            }),
          },
          "create-folder",
        );

        const loanFolderData = await res.json();
        if (!res.ok) {
          const canRecover =
            res.status === 409 ||
            isRecoverableFolderError(loanFolderData?.error);
          if (canRecover) {
            await sleep(1500);
            const refreshedFiles = await getFiles();
            const refreshedForms = findFolderWithName(
              refreshedFiles || [],
              "Forms",
            );
            loanFolder = findFolderWithName(
              refreshedForms?.children || [],
              loanItem?.name,
            );
          }
          if (!loanFolder) {
            throw new Error(
              loanFolderData?.error || "Failed to create or find loan folder",
            );
          }
        } else {
          loanFolder = loanFolderData;
        }
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
    if (!params?.detailId) return;

    if (fetchInProgressRef.current) return;

    const foundLoan = loanData.find(
      (d) =>
        String(d.id) === String(params.detailId) ||
        d.id === Number(params.detailId),
    );
    if (!foundLoan) return;
    if (foundLoan.folderId) {
      setLoan(foundLoan);
      return;
    }

    fetchInProgressRef.current = true;
    setLoan(foundLoan);

    const fetchLoanFolder = async () => {
      try {
        const folderId = await handleGetFolderId(foundLoan);
        if (folderId != null) {
          foundLoan.folderId = folderId;
          const updatedLoans = loanData.map((loanItem) =>
            loanItem.id === foundLoan.id ? foundLoan : loanItem,
          );
          dispatch(setLoans(updatedLoans));
        }
      } finally {
        fetchInProgressRef.current = false;
      }
    };

    fetchLoanFolder();
  }, [params?.detailId, loanData]);

  if (!loan) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-background font-lato">
        <LoaderSpinner size={32} className="text-secondary-foreground" />
      </div>
    );
  }

  const detailRows = [
    { label: "Type", value: loan?.type },
    { label: "Start Date", value: "11/04/2016" },
    { label: "End Date", value: "04/04/2025" },
    { label: "Loan Amount", value: "$56,495" },
    { label: "Downpayment", value: "$10,000" },
    { label: "APR", value: "4.70%" },
  ];

  return (
    <div className="relative mx-auto flex w-full max-w-[540px] flex-col font-lato text-foreground md:max-w-[720px] lg:max-w-[1140px]">
      <Card className="border-border bg-card shadow-none">
        <CardHeader className="flex flex-col items-center justify-center gap-3 border-b border-border py-5 sm:flex-row sm:items-end sm:gap-5">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="h-auto gap-1 px-0 py-0 text-secondary-foreground hover:bg-transparent hover:text-secondary-foreground/80"
          >
            <ChevronLeft className="h-6 w-6" />
            Back to Forms
          </Button>
          <CardTitle className="text-center text-3xl font-light">
            Loan Detail
          </CardTitle>
          <p className="text-base italic text-muted-foreground">ID:{loan?.id}</p>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-6 p-0 sm:grid-cols-2 sm:gap-x-10">
          <div className="space-y-4 p-5">
            <h2 className="text-4xl font-light italic text-secondary-foreground sm:text-6xl">
              {loan?.name}
            </h2>

            <div className="h-5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "flex h-5 items-center justify-center rounded-full text-xs text-primary-foreground",
                  getProgressBarClass(loan?.status),
                )}
                style={{
                  width: `${calculatePercentage(loan?.complete, 100)}%`,
                }}
              >
                {loan?.paid}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xl text-secondary-foreground">
              <span>Status:</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-base font-light",
                  getStatusBadgeClass(loan?.status),
                )}
              >
                {loan?.status}
              </Badge>
            </div>

            {detailRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center gap-2 text-xl text-secondary-foreground"
              >
                <span>{row.label}:</span>
                <span className="font-light text-muted-foreground">
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col border-t border-border sm:border-l sm:border-t-0">
            <h3 className="my-5 text-center text-xl font-light text-secondary-foreground">
              Loan Documents
            </h3>
            {loan?.folderId ? (
              <Documents fileType={"loan"} loanFolderId={loan.folderId} />
            ) : (
              <div className="flex min-h-[50vh] items-center justify-center">
                <LoaderSpinner
                  size={28}
                  className="text-secondary-foreground"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DetailsPage;
