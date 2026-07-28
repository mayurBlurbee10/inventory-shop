import { Readable } from "stream";
import { getBoxClient } from "../utils/boxClient.ts";
import portalService from "./portal.service.ts";
import { parseWorkbookBuffer } from "../utils/reportsParser.ts";

const client = getBoxClient();

export const REPORT_TYPES = {
  holdings: "Holdings",
  sector_returns: "Sector Returns",
} as const;

export type ReportType = keyof typeof REPORT_TYPES;

const REPORTS_FOLDER_NAME = "Reports";
const LEGACY_REPORTS_FOLDER_NAME = "Accounts";

const BOX_LIST_FIELDS = [
  "id",
  "description",
  "name",
  "type",
  "owned_by",
  "modified_at",
  "size",
  "parent",
].join(",");

async function getChildFolderByName(parentId: string, name: string) {
  const items = await client.folders.getFolderItems(parentId, {
    queryParams: {
      fields: ["name", "id", "type"],
      limit: 1000,
    },
  });

  return items.entries?.find(
    (item: any) =>
      item.type === "folder" && item.name?.toLowerCase() === name.toLowerCase(),
  );
}

async function createFolderIfNotExists(parentId: string, name: string) {
  const existing = await getChildFolderByName(parentId, name);
  if (existing) {
    return existing.id as string;
  }

  const created = await client.folders.createFolder({
    name,
    parent: { id: parentId },
  });

  return created.id as string;
}

async function ensureFolderPath(rootId: string, pathSegments: string[]) {
  let parentId = rootId;
  for (const segment of pathSegments) {
    parentId = await createFolderIfNotExists(parentId, segment);
  }
  return parentId;
}

async function getReportsRootFolder(adminFolderId: string) {
  return (
    (await getChildFolderByName(adminFolderId, REPORTS_FOLDER_NAME)) ||
    (await getChildFolderByName(adminFolderId, LEGACY_REPORTS_FOLDER_NAME))
  );
}

export async function getPortalAdminFolderId(portalId: string) {
  const admin = await portalService.getPortalCreatedAdmin(portalId);
  if (!admin?.folderId) {
    throw new Error("Portal admin folder not found.");
  }
  return admin.folderId as string;
}

export async function ensureReportTypeFolder(
  portalId: string,
  reportType: ReportType,
) {
  if (!REPORT_TYPES[reportType]) {
    throw new Error("Invalid report type.");
  }

  const adminFolderId = await getPortalAdminFolderId(portalId);
  const reportsFolderId = await ensureFolderPath(adminFolderId, [
    REPORTS_FOLDER_NAME,
  ]);
  const typeFolderId = await createFolderIfNotExists(
    reportsFolderId,
    REPORT_TYPES[reportType],
  );

  return typeFolderId;
}

async function listFilesInFolder(folderId: string) {
  const result = await client.folders.getFolderItems(folderId, {
    queryParams: {
      fields: BOX_LIST_FIELDS.split(","),
      limit: 1000,
    },
  });

  return (result.entries || []).filter((item: any) => item.type === "file");
}

function extractUploadedFileEntry(uploaded: unknown) {
  const payload = uploaded as { entries?: Array<Record<string, unknown>> };
  if (Array.isArray(payload.entries) && payload.entries.length > 0) {
    return payload.entries[0];
  }

  return uploaded as Record<string, unknown>;
}

export async function listReportFiles(
  portalId: string,
  page = 1,
  limit = 10,
) {
  const adminFolderId = await getPortalAdminFolderId(portalId);
  const reportsFolder = await getReportsRootFolder(adminFolderId);

  if (!reportsFolder) {
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  const [holdingsFolder, sectorReturnsFolder] = await Promise.all([
    getChildFolderByName(reportsFolder.id, REPORT_TYPES.holdings),
    getChildFolderByName(reportsFolder.id, REPORT_TYPES.sector_returns),
  ]);

  const [holdingsFiles, sectorReturnsFiles] = await Promise.all([
    holdingsFolder ? listFilesInFolder(holdingsFolder.id) : [],
    sectorReturnsFolder ? listFilesInFolder(sectorReturnsFolder.id) : [],
  ]);

  const allFiles = [
    ...holdingsFiles.map((file: any) => ({
      ...file,
      reportType: "holdings",
      reportTypeLabel: REPORT_TYPES.holdings,
    })),
    ...sectorReturnsFiles.map((file: any) => ({
      ...file,
      reportType: "sector_returns",
      reportTypeLabel: REPORT_TYPES.sector_returns,
    })),
  ].sort(
    (a, b) =>
      new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime(),
  );

  const total = allFiles.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * limit;
  const items = allFiles.slice(start, start + limit);

  return {
    items,
    total,
    page: safePage,
    limit,
    totalPages,
  };
}

export async function uploadReportFile(
  portalId: string,
  reportType: ReportType,
  file: Express.Multer.File,
  uploadedByEmail = "",
) {
  const folderId = await ensureReportTypeFolder(portalId, reportType);
  const existingFiles = await listFilesInFolder(folderId);

  if (existingFiles.length > 0) {
    throw new Error(
      `A ${REPORT_TYPES[reportType]} file already exists. Delete the existing file before uploading a new one.`,
    );
  }

  const parseResult = parseWorkbookBuffer(file.buffer, reportType);
  if (!parseResult.success) {
    throw new Error(parseResult.error);
  }

  const createStream = () => {
    const stream = new Readable();
    stream.push(file.buffer);
    stream.push(null);
    return stream;
  };

  try {
    const uploaded = await client.uploads.uploadFile({
      attributes: {
        name: file.originalname,
        parent: { id: folderId },
      },
      file: createStream(),
    });
    const uploadedFile = extractUploadedFileEntry(uploaded);
    const uploadedFileId = uploadedFile.id as string | undefined;

    if (uploadedByEmail && uploadedFileId) {
      const updatedFile = await client.files.updateFileById(uploadedFileId, {
        requestBody: { description: uploadedByEmail },
      });

      return {
        ...(updatedFile as unknown as Record<string, unknown>),
        reportType,
        reportTypeLabel: REPORT_TYPES[reportType],
      };
    }

    return {
      ...uploadedFile,
      reportType,
      reportTypeLabel: REPORT_TYPES[reportType],
    };
  } catch (uploadErr: any) {
    const conflicts = uploadErr.response?.body?.context_info?.conflicts;
    if (conflicts?.length) {
      throw new Error(
        `A ${REPORT_TYPES[reportType]} file already exists. Delete the existing file before uploading a new one.`,
      );
    }
    throw uploadErr;
  }
}

async function downloadFileBuffer(fileId: string) {
  const stream = await client.downloads.downloadFile(fileId);
  if (!stream) {
    throw new Error("Failed to download file from Box.");
  }

  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve());
    stream.on("error", reject);
  });

  return Buffer.concat(chunks);
}

async function getLatestFileInReportFolder(
  portalId: string,
  reportType: ReportType,
) {
  const folderId = await ensureReportTypeFolder(portalId, reportType);
  const files = await listFilesInFolder(folderId);

  if (!files.length) {
    return null;
  }

  return files.sort(
    (a: any, b: any) =>
      new Date(b.modified_at).getTime() - new Date(a.modified_at).getTime(),
  )[0];
}

export async function getReportData(
  portalId: string,
  reportType: ReportType,
) {
  const latestFile = await getLatestFileInReportFolder(portalId, reportType);

  if (!latestFile) {
    return {
      file: null,
      data: null,
    };
  }

  const buffer = await downloadFileBuffer(latestFile.id);
  const parseResult = parseWorkbookBuffer(buffer, reportType);

  if (!parseResult.success) {
    return {
      file: {
        id: latestFile.id,
        name: latestFile.name,
        modifiedAt: (latestFile as any).modified_at,
      },
      data: null,
      formatError: parseResult.error,
    };
  }

  return {
    file: {
      id: latestFile.id,
      name: latestFile.name,
      modifiedAt: (latestFile as any).modified_at,
    },
    data: parseResult.data,
    formatError: null,
  };
}
