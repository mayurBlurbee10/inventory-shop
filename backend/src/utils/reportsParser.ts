import * as XLSX from "xlsx";

type RawRow = (string | number | null | undefined)[];

const isBlank = (value: unknown) =>
  value === null || value === undefined || String(value).trim() === "";

const toNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (isBlank(value)) {
    return null;
  }
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const hasNumericValues = (row: RawRow, startIndex = 2) =>
  row.slice(startIndex).some((cell) => toNumber(cell) !== null);

export type SectorReturnRow = {
  sector: string;
  lastMarketCloseValue: number | null;
  yearToDateNetReturn: number | null;
  last1YearNetReturn: number | null;
  last3YearsNetReturn: number | null;
  last5YearsNetReturn: number | null;
  inceptionToDateNetReturn: number | null;
};

export type ParsedSectorReturns = {
  columns: string[];
  rows: SectorReturnRow[];
  totals: SectorReturnRow | null;
};

export type HoldingTreeNode = {
  id: string;
  type: "group" | "holding" | "subtotal" | "total";
  symbol: string;
  description: string;
  quantity: number | null;
  price: number | null;
  value: number | null;
  costBasis: number | null;
  unrealizedGainLoss: number | null;
  weight: number | null;
  children: HoldingTreeNode[];
};

export type ParsedHoldings = {
  columns: string[];
  tree: HoldingTreeNode[];
  asOfNote?: string;
};

export type ReportParseResult =
  | { success: true; data: ParsedHoldings | ParsedSectorReturns }
  | { success: false; error: string };

const normalizeColumns = (columns: string[]) =>
  columns.map((cell, index) => {
    const trimmed = String(cell ?? "").trim();
    return trimmed || `Column ${index + 1}`;
  });

const countTreeNodes = (nodes: HoldingTreeNode[]): number =>
  nodes.reduce(
    (count, node) =>
      count + 1 + (node.children?.length ? countTreeNodes(node.children) : 0),
    0,
  );

const hasHoldingsRows = (nodes: HoldingTreeNode[]): boolean =>
  nodes.some(
    (node) =>
      node.type === "holding" ||
      (node.children?.length ? hasHoldingsRows(node.children) : false),
  );

function validateSectorReturns(parsed: ParsedSectorReturns): string | null {
  const headerColumns = parsed.columns.filter((column) => column.trim());
  if (headerColumns.length < 2) {
    return "The uploaded Sector Returns file must include a header row with a Sector column and at least one return column.";
  }

  if (!parsed.columns[0]?.trim()) {
    return "The uploaded Sector Returns file is missing the Sector column in the header row.";
  }

  if (!parsed.rows.length) {
    return "The uploaded Sector Returns file does not contain any sector rows. Please verify the file format.";
  }

  const hasNumericData = parsed.rows.some(
    (row) =>
      row.lastMarketCloseValue !== null ||
      row.yearToDateNetReturn !== null ||
      row.last1YearNetReturn !== null ||
      row.last3YearsNetReturn !== null ||
      row.last5YearsNetReturn !== null ||
      row.inceptionToDateNetReturn !== null,
  );

  if (!hasNumericData) {
    return "The uploaded Sector Returns file does not contain readable numeric values. Please verify the column layout.";
  }

  return null;
}

function validateHoldings(parsed: ParsedHoldings): string | null {
  const headerColumns = parsed.columns.filter((column) => column.trim());
  if (headerColumns.length < 2) {
    return "The uploaded Holdings file must include a header row with Symbol and Description columns.";
  }

  if (!parsed.columns[0]?.trim()) {
    return "The uploaded Holdings file is missing the Symbol column in the header row.";
  }

  if (!parsed.tree.length) {
    return "The uploaded Holdings file does not contain any holdings rows. Please verify the file format.";
  }

  if (!hasHoldingsRows(parsed.tree)) {
    return "The uploaded Holdings file does not contain any valid holding entries. Please verify the file format.";
  }

  if (countTreeNodes(parsed.tree) === 0) {
    return "The uploaded Holdings file could not be parsed into a holdings table. Please verify the file format.";
  }

  return null;
}

export function parseSectorReturnsSheet(rows: RawRow[]): ParsedSectorReturns {
  const columns = normalizeColumns(
    (rows[0] || []).map((cell) => String(cell ?? "").trim()),
  );
  const dataRows = rows.slice(1).filter((row) => {
    const sector = String(row[0] ?? "").trim();
    return (
      sector &&
      !sector.toLowerCase().startsWith("note:") &&
      sector.toLowerCase() !== "total"
    );
  });

  const parsedRows: SectorReturnRow[] = dataRows.map((row) => ({
    sector: String(row[0] ?? "").trim(),
    lastMarketCloseValue: toNumber(row[1]),
    yearToDateNetReturn: toNumber(row[2]),
    last1YearNetReturn: toNumber(row[3]),
    last3YearsNetReturn: toNumber(row[4]),
    last5YearsNetReturn: toNumber(row[5]),
    inceptionToDateNetReturn: toNumber(row[6]),
  }));

  const totalValue = parsedRows.reduce(
    (sum, row) => sum + (row.lastMarketCloseValue || 0),
    0,
  );

  const weightedAverage = (field: keyof SectorReturnRow) => {
    if (!totalValue) {
      return null;
    }

    const weightedSum = parsedRows.reduce((sum, row) => {
      const value = row.lastMarketCloseValue || 0;
      const rate = row[field];
      if (typeof rate !== "number") {
        return sum;
      }
      return sum + value * rate;
    }, 0);

    return weightedSum / totalValue;
  };

  const totals: SectorReturnRow = {
    sector: "Total",
    lastMarketCloseValue: totalValue || null,
    yearToDateNetReturn: weightedAverage("yearToDateNetReturn"),
    last1YearNetReturn: weightedAverage("last1YearNetReturn"),
    last3YearsNetReturn: weightedAverage("last3YearsNetReturn"),
    last5YearsNetReturn: weightedAverage("last5YearsNetReturn"),
    inceptionToDateNetReturn: weightedAverage("inceptionToDateNetReturn"),
  };

  return {
    columns,
    rows: parsedRows,
    totals,
  };
}

export function parseHoldingsSheet(rows: RawRow[]): ParsedHoldings {
  const columns = normalizeColumns(
    (rows[0] || []).map((cell) => String(cell ?? "").trim()),
  );
  const tree: HoldingTreeNode[] = [];
  const stack: HoldingTreeNode[] = [];
  let idCounter = 0;

  const createNode = (
    type: HoldingTreeNode["type"],
    row: RawRow,
  ): HoldingTreeNode => ({
    id: `row-${idCounter++}`,
    type,
    symbol: String(row[0] ?? "").trim(),
    description: String(row[1] ?? "").trim(),
    quantity: toNumber(row[2]),
    price: toNumber(row[3]),
    value: toNumber(row[4]),
    costBasis: toNumber(row[5]),
    unrealizedGainLoss: toNumber(row[6]),
    weight: toNumber(row[7]),
    children: [],
  });

  let asOfNote: string | undefined;

  for (const row of rows.slice(1)) {
    const symbol = String(row[0] ?? "").trim();
    const description = String(row[1] ?? "").trim();
    const label = description || symbol;

    if (
      !symbol &&
      !description &&
      row.slice(2).every((cell) => isBlank(cell))
    ) {
      continue;
    }

    if (label.toLowerCase().startsWith("note:")) {
      asOfNote = label;
      continue;
    }

    const isSubtotalOrTotal =
      label.toLowerCase().includes("total") && hasNumericValues(row);
    const isHolding = Boolean(symbol) && hasNumericValues(row);
    const isGroup = Boolean(symbol) && !hasNumericValues(row);

    if (isHolding) {
      const node = createNode("holding", row);
      if (stack.length) {
        stack[stack.length - 1].children.push(node);
      } else {
        tree.push(node);
      }
      continue;
    }

    if (isSubtotalOrTotal) {
      const node = createNode(
        label.toLowerCase() === "total" ? "total" : "subtotal",
        row,
      );

      if (stack.length) {
        stack[stack.length - 1].children.push(node);
      } else {
        tree.push(node);
      }

      if (label.toLowerCase() !== "total") {
        const currentGroup = stack[stack.length - 1];
        const normalizedLabel = label.toLowerCase();
        const normalizedGroup = currentGroup?.symbol?.toLowerCase() || "";
        if (
          currentGroup &&
          normalizedLabel === `${normalizedGroup} total`.toLowerCase()
        ) {
          stack.pop();
        }
      }
      continue;
    }

    if (isGroup) {
      const node = createNode("group", row);
      if (stack.length) {
        stack[stack.length - 1].children.push(node);
      } else {
        tree.push(node);
      }
      stack.push(node);
    }
  }

  return {
    columns,
    tree,
    asOfNote,
  };
}

export function parseWorkbookBuffer(
  buffer: Buffer,
  reportType: "holdings" | "sector_returns",
): ReportParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return {
      success: false,
      error: "The uploaded file does not contain any worksheet data.",
    };
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: true,
  }) as RawRow[];

  if (!rows.length) {
    return {
      success: false,
      error: "The uploaded file is empty. Please upload a valid Excel file.",
    };
  }

  if (reportType === "holdings") {
    const data = parseHoldingsSheet(rows);
    const error = validateHoldings(data);
    if (error) {
      return { success: false, error };
    }
    return { success: true, data };
  }

  const data = parseSectorReturnsSheet(rows);
  const error = validateSectorReturns(data);
  if (error) {
    return { success: false, error };
  }

  return { success: true, data };
}
