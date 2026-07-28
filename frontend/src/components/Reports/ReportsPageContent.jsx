"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import ReportDocumentSelector from "./ReportDocumentSelector";
import ReportFormatError from "./ReportFormatError";
import HoldingsTable from "./HoldingsTable";
import SectorReturnsView from "./SectorReturnsView";

const formatAsOfDate = (value) => {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

export default function ReportsPageContent() {
  const params = useParams();
  const portalId = params?.portalid || "root";
  const [activeType, setActiveType] = useState("holdings");
  const [loading, setLoading] = useState(true);
  const [holdingsData, setHoldingsData] = useState(null);
  const [sectorReturnsData, setSectorReturnsData] = useState(null);
  const [holdingsFile, setHoldingsFile] = useState(null);
  const [sectorReturnsFile, setSectorReturnsFile] = useState(null);
  const [holdingsFormatError, setHoldingsFormatError] = useState(null);
  const [sectorReturnsFormatError, setSectorReturnsFormatError] = useState(null);

  const fetchReportData = useCallback(
    async (reportType) => {
      const response = await fetchWrapper(
        `/api/reports/data?portalId=${encodeURIComponent(portalId)}&reportType=${reportType}`,
        { method: "GET" },
        `reports-data-${reportType}`,
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to fetch report data.");
      }

      return payload;
    },
    [portalId],
  );

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [holdingsResult, sectorReturnsResult] = await Promise.all([
        fetchReportData("holdings"),
        fetchReportData("sector_returns"),
      ]);

      setHoldingsData(holdingsResult.data);
      setSectorReturnsData(sectorReturnsResult.data);
      setHoldingsFile(holdingsResult.file);
      setSectorReturnsFile(sectorReturnsResult.file);
      setHoldingsFormatError(holdingsResult.formatError || null);
      setSectorReturnsFormatError(sectorReturnsResult.formatError || null);
    } catch (error) {
      toast.error(error.message);
      setHoldingsData(null);
      setSectorReturnsData(null);
      setHoldingsFile(null);
      setSectorReturnsFile(null);
      setHoldingsFormatError(null);
      setSectorReturnsFormatError(null);
    } finally {
      setLoading(false);
    }
  }, [fetchReportData]);

  useEffect(() => {
    if (portalId) {
      loadAllData();
    }
  }, [portalId, loadAllData]);

  const activeFile =
    activeType === "holdings" ? holdingsFile : sectorReturnsFile;
  const asOfDate = formatAsOfDate(activeFile?.modifiedAt);
  const hasHoldingsData = Boolean(
    holdingsData?.tree?.length && !holdingsFormatError,
  );

  return (
    <div className="w-full">
      <ReportDocumentSelector
        value={activeType}
        onChange={setActiveType}
        holdingsFile={holdingsFile}
        sectorReturnsFile={sectorReturnsFile}
      />

      <div className="mx-auto w-full max-w-[1400px] space-y-4 bg-background px-4 py-6 md:px-6">
        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-border bg-card">
            <LoaderSpinner size={32} className="text-secondary-foreground" />
          </div>
        ) : activeType === "holdings" ? (
          <div className="space-y-3">
            {hasHoldingsData && (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="text-3xl font-normal text-foreground">Holdings</h1>
                {asOfDate && (
                  <p className="text-sm text-muted-foreground">
                    Client, Sample Charitable Fund (0000000001, Charitable Fund) | As
                    of {asOfDate}
                  </p>
                )}
              </div>
            )}
            <HoldingsTable
              key={holdingsFile?.id ?? "no-holdings"}
              data={holdingsData}
              formatError={holdingsFormatError}
              fileName={holdingsFile?.name}
            />
          </div>
        ) : (
          <SectorReturnsView
            key={sectorReturnsFile?.id ?? "no-sector-returns"}
            data={sectorReturnsData}
            asOfDate={asOfDate}
            formatError={sectorReturnsFormatError}
            fileName={sectorReturnsFile?.name}
          />
        )}
      </div>
    </div>
  );
}
