"use client";

import { cn } from "@/app/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ReportFormatError from "./ReportFormatError";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(value);
};

const formatWeight = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${(value * 100).toFixed(2)}%`;
};

const formatGainLoss = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const formatted = formatCurrency(Math.abs(value));
  if (value < 0) {
    return <span className="text-destructive">({formatted})</span>;
  }

  return <span className="text-success">{formatted}</span>;
};

function collectGroupIds(nodes, ids = new Set()) {
  nodes.forEach((node) => {
    if (node.type === "group") {
      ids.add(node.id);
      collectGroupIds(node.children || [], ids);
    }
  });
  return ids;
}

const EMPTY_TREE = [];

const DEFAULT_COLUMNS = [
  "Symbol",
  "Description",
  "Quantity",
  "Price",
  "Value",
  "Cost Basis",
  "Unrealized Gain/Loss",
  "Weight",
];

const getDisplayColumns = (columns) => {
  const source = columns?.length ? columns : DEFAULT_COLUMNS;

  return source.map((column, index) => ({
    key: `column-${index}`,
    label: column?.trim() || `Column ${index + 1}`,
    alignRight: index >= 2,
  }));
};

function HoldingRow({ row, depth, expandedIds, onToggle }) {
  const { node } = row;
  const isGroup = node.type === "group";
  const isTotal = node.type === "total";
  const isSubtotal = node.type === "subtotal";
  const isExpanded = expandedIds.has(node.id);
  const label = node.symbol || node.description;

  return (
    <TableRow
      className={cn(
        (isSubtotal || isTotal) && "bg-muted/40 font-semibold",
        isGroup && "bg-muted/20 font-medium",
      )}
    >
      <TableCell className="px-4 py-3 whitespace-nowrap">
        <div
          className="flex items-center gap-2"
          style={{ paddingLeft: `${depth * 20}px` }}
        >
          {isGroup ? (
            <button
              type="button"
              onClick={() => onToggle(node.id)}
              className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
              aria-label={isExpanded ? "Collapse group" : "Expand group"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="inline-block h-5 w-5" />
          )}
          <span
            className={cn(
              "text-foreground",
              isGroup || isSubtotal || isTotal ? "font-semibold" : "text-secondary-foreground",
            )}
          >
            {node.type === "holding" ? node.symbol : label}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
        {node.type === "holding" ? node.description : ""}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-sm text-foreground">
        {formatNumber(node.quantity)}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-sm text-foreground">
        {formatNumber(node.price)}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-sm text-foreground">
        {formatCurrency(node.value)}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-sm text-foreground">
        {formatCurrency(node.costBasis)}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-sm">
        {formatGainLoss(node.unrealizedGainLoss)}
      </TableCell>
      <TableCell className="px-4 py-3 text-right text-sm text-foreground">
        {formatWeight(node.weight)}
      </TableCell>
    </TableRow>
  );
}

export default function HoldingsTable({ data, formatError, fileName }) {
  const tree = data?.tree ?? EMPTY_TREE;
  const displayColumns = useMemo(
    () => getDisplayColumns(data?.columns),
    [data?.columns],
  );

  const groupIdsKey = useMemo(() => {
    const ids = collectGroupIds(tree);
    return [...ids].sort().join("|");
  }, [tree]);

  const [expandedIds, setExpandedIds] = useState(() => collectGroupIds(tree));

  useEffect(() => {
    setExpandedIds(collectGroupIds(tree));
  }, [groupIdsKey]);

  const visibleRows = useMemo(() => {
    const rows = [];

    const walk = (nodes, depth = 0) => {
      nodes.forEach((node) => {
        rows.push({ node, depth });

        if (
          node.type === "group" &&
          expandedIds.has(node.id) &&
          node.children?.length
        ) {
          walk(node.children, depth + 1);
        }
      });
    };

    walk(tree);
    return rows;
  }, [tree, expandedIds]);

  const toggleGroup = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (formatError) {
    return (
      <ReportFormatError
        title="Unable to display Holdings data"
        message={formatError}
        fileName={fileName}
      />
    );
  }

  if (!tree.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No holdings data available. Upload a Holdings Excel file from Tools → Reports.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {displayColumns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground",
                    column.alignRight && "text-right",
                  )}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map(({ node, depth }) => (
              <HoldingRow
                key={node.id}
                row={{ node, depth }}
                depth={depth}
                expandedIds={expandedIds}
                onToggle={toggleGroup}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      {data?.asOfNote && (
        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          {data.asOfNote}
        </div>
      )}
    </div>
  );
}
