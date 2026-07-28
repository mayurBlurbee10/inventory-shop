"use client";

import { cn } from "@/app/lib/utils";
import { ChevronRight, FileSpreadsheet } from "lucide-react";
import { useMemo, useState } from "react";
import ReportFormatError from "./ReportFormatError";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const RETURN_FIELDS = [
  "yearToDateNetReturn",
  "last1YearNetReturn",
  "last3YearsNetReturn",
  "last5YearsNetReturn",
  "inceptionToDateNetReturn",
];

const REPORT_TABS = [
  { id: "by_sector", label: "Managed Performance - By Sector" },
  { id: "allocation", label: "Managed Asset Allocation Over Time" },
  { id: "by_asset_class", label: "Managed Performance - By Asset Class" },
  { id: "by_year", label: "Managed Performance - By Year" },
  { id: "inception", label: "Managed Performance - Inception" },
];

const METRIC_PERIODS = [
  { id: "yearToDateNetReturn", label: "Year to Date" },
  { id: "last3YearsNetReturn", label: "Last 3 Years" },
  { id: "inceptionToDateNetReturn", label: "Inception to Date" },
];

const EMPTY_ROWS = [];

const DEFAULT_COLUMNS = [
  "Sector",
  "Last Market Close Value",
  "Year to Date Net Return",
  "Last 1 Year Net Return",
  "Last 3 Years Net Return",
  "Last 5 Years Net Return",
  "Inception to Date Net Return",
];

const getDisplayColumns = (columns) => {
  const source = columns?.length ? columns : DEFAULT_COLUMNS;

  return source.map((column, index) => ({
    key: `column-${index}`,
    label: column?.trim() || `Column ${index + 1}`,
    alignRight: index > 0,
  }));
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercent = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const percent = (Math.abs(value) * 100).toFixed(2);
  if (value < 0) {
    return `(${percent}%)`;
  }

  return `${percent}%`;
};

const computeWeightedReturn = (rows, field) => {
  const totalValue = rows.reduce(
    (sum, row) => sum + (row.lastMarketCloseValue || 0),
    0,
  );

  if (!totalValue) {
    return null;
  }

  const weightedSum = rows.reduce((sum, row) => {
    const value = row.lastMarketCloseValue || 0;
    const rate = row[field];
    if (typeof rate !== "number") {
      return sum;
    }
    return sum + value * rate;
  }, 0);

  return weightedSum / totalValue;
};

const computeInvestmentGain = (rows, field) => {
  return rows.reduce((sum, row) => {
    const value = row.lastMarketCloseValue || 0;
    const rate = row[field];
    if (typeof rate !== "number") {
      return sum;
    }
    return sum + value * rate;
  }, 0);
};

function SummaryCard({
  title,
  value,
  subtitle,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        "flex min-h-[88px] flex-col justify-between rounded-md px-4 py-3 text-white shadow-sm",
        className,
      )}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide opacity-90">
          {title}
        </p>
        <p className="mt-1 text-2xl font-semibold leading-none">{value}</p>
      </div>
      {subtitle && <p className="mt-2 text-[11px] opacity-90">{subtitle}</p>}
      {children}
    </div>
  );
}

function MetricPeriodTabs({ activePeriod, onChange }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {METRIC_PERIODS.map((period) => (
        <button
          key={period.id}
          type="button"
          onClick={() => onChange(period.id)}
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
            activePeriod === period.id
              ? "bg-white/25 text-white"
              : "text-white/80 hover:bg-white/10",
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}

function SectorRow({ row, variant = "default" }) {
  const isTotal = variant === "total";
  const isBenchmark = variant === "benchmark";

  return (
    <TableRow
      className={cn(
        isTotal && "border-y-2 border-border bg-muted/40 font-semibold",
        isBenchmark && "bg-muted/20 font-medium",
        !isTotal && !isBenchmark && "hover:bg-muted/50",
      )}
    >
      <TableCell className="px-4 py-2.5 text-sm text-foreground">
        <div className="flex items-center gap-2">
          {!isTotal && !isBenchmark && (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span>{row.sector}</span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-2.5 text-right text-sm text-foreground">
        {isBenchmark ? "" : formatCurrency(row.lastMarketCloseValue)}
      </TableCell>
      {RETURN_FIELDS.map((field) => (
        <TableCell
          key={field}
          className={cn(
            "px-4 py-2.5 text-right text-sm",
            row[field] < 0 ? "text-destructive" : "text-foreground",
            isTotal && "font-semibold",
          )}
        >
          {formatPercent(row[field])}
        </TableCell>
      ))}
    </TableRow>
  );
}

export default function SectorReturnsView({
  data,
  asOfDate,
  formatError,
  fileName,
}) {
  const [activeReportTab, setActiveReportTab] = useState("by_sector");
  const [metricPeriod, setMetricPeriod] = useState("yearToDateNetReturn");

  const rows = data?.rows ?? EMPTY_ROWS;
  const totals = data?.totals ?? null;
  const displayColumns = useMemo(
    () => getDisplayColumns(data?.columns),
    [data?.columns],
  );

  const rowsKey = useMemo(
    () => (rows.length ? rows.map((row) => row.sector).join("|") : ""),
    [rows],
  );

  const summary = useMemo(() => {
    const totalMarketValue = rows.reduce(
      (sum, row) => sum + (row.lastMarketCloseValue || 0),
      0,
    );
    const performance = computeWeightedReturn(rows, metricPeriod);
    const investmentGain = computeInvestmentGain(rows, metricPeriod);

    return {
      totalMarketValue,
      performance,
      investmentGain,
    };
  }, [rowsKey, metricPeriod]);

  if (formatError) {
    return (
      <ReportFormatError
        title="Unable to display Sector Returns data"
        message={formatError}
        fileName={fileName}
      />
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No sector returns data available. Upload a Sector Returns Excel file from
        Tools → Reports.
      </div>
    );
  }

  const performanceDisplay =
    summary.performance === null
      ? "-"
      : `${summary.performance >= 0 ? "↑" : "↓"}${formatPercent(Math.abs(summary.performance))}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          title="Managed Market Value"
          value={formatCurrency(summary.totalMarketValue)}
          className="bg-[#5a9e52]"
        />
        <SummaryCard
          title="Unmanaged Market Value"
          value="-"
          className="bg-[#9aa0a6]"
        />
        <SummaryCard
          title="Total Market Value"
          value={formatCurrency(summary.totalMarketValue)}
          className="bg-[#5a9e52]"
        />
        <SummaryCard
          title="Performance"
          value={performanceDisplay}
          className="bg-[#6eb5d9]"
        >
          <MetricPeriodTabs
            activePeriod={metricPeriod}
            onChange={setMetricPeriod}
          />
        </SummaryCard>
        <SummaryCard
          title="Investment Gain"
          value={formatCurrency(summary.investmentGain)}
          className="bg-[#3d85b8]"
        >
          <MetricPeriodTabs
            activePeriod={metricPeriod}
            onChange={setMetricPeriod}
          />
        </SummaryCard>
        <SummaryCard
          title="Net Worth"
          value="-"
          subtitle="Last Trade Date"
          className="bg-[#6eb5d9]"
        />
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-muted/50 p-1">
        <div className="flex min-w-max gap-1">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              disabled={tab.id !== "by_sector"}
              onClick={() => setActiveReportTab(tab.id)}
              className={cn(
                "whitespace-nowrap rounded px-4 py-2 text-xs font-medium transition-colors",
                activeReportTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-card/60 disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Performance - By Sector
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              Client, Sample (XXXX, Performance)
              {asOfDate ? ` | As of ${asOfDate}` : ""}
            </span>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 hover:bg-muted/50">
                {displayColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "h-10 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                      column.alignRight && "text-right",
                    )}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <SectorRow
                  key={`${row.sector || "sector"}-${index}`}
                  row={row}
                />
              ))}
              {totals && <SectorRow row={totals} variant="total" />}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
          * Returns greater than 12 months are annualized. Negative values are
          shown in parentheses.
        </div>
      </div>
    </div>
  );
}
