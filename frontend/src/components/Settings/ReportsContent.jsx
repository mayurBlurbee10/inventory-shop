"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  FileSpreadsheet,
  Trash2,
  Upload,
} from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import PreviewModal from "../FileExplorer/PreviewModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReactSelect from "react-select";
import { getReactSelectStyles } from "../Common/reactSelectStyles";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const REPORT_TYPE_OPTIONS = [
  { value: "holdings", label: "Holdings" },
  { value: "sector_returns", label: "Sector Returns" },
];

const EXCEL_ACCEPT = ".xlsx,.xls";
const EXCEL_REGEX = /\.(xlsx|xls)$/i;

const reportsSelectStyles = getReactSelectStyles();
const paginationSelectStyles = {
  ...reportsSelectStyles,
  control: (base, state) => ({
    ...reportsSelectStyles.control(base, state),
    minHeight: "2.5rem",
    minWidth: "80px",
  }),
  valueContainer: (base) => ({
    ...reportsSelectStyles.valueContainer(base),
    padding: "0 0.5rem",
  }),
};

const LIMIT_OPTIONS = [5, 10, 20, 50].map((option) => ({
  value: option,
  label: String(option),
}));

const formatFileSize = (bytes) => {
  if (!bytes) return "0 KB";

  const units = ["Bytes", "KB", "MB", "GB"];
  const sizeIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const size = bytes / Math.pow(1024, sizeIndex);

  return `${size.toFixed(sizeIndex === 0 ? 0 : 1)} ${units[sizeIndex]}`;
};

const formatUploadedFile = (file, fallbackUploadedBy = "-") => ({
  id: file?.id,
  name: file?.name || "-",
  size: file?.size || 0,
  uploadedAt: file?.modified_at
    ? new Date(file.modified_at).toLocaleString()
    : "-",
  uploadedBy:
    file?.description ||
    file?.owned_by?.name ||
    file?.owned_by?.login ||
    fallbackUploadedBy,
  reportType: file?.reportType || "",
  reportTypeLabel: file?.reportTypeLabel || "-",
});

function ReportsContent() {
  const params = useParams();
  const fileInputRef = useRef(null);
  const portalId = params?.portalid || "root";

  const [reportType, setReportType] = useState("holdings");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [previewFileId, setPreviewFileId] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchReportFiles = useCallback(async () => {
    try {
      setIsFetchingFiles(true);
      setError("");

      const response = await fetchWrapper(
        `/api/reports?portalId=${encodeURIComponent(portalId)}&page=${page}&limit=${Math.max(limit, 100)}`,
        { method: "GET" },
        "reports-files",
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch uploaded files.");
      }

      const userData = getUserData();
      const uploadedBy = userData?.name || userData?.email || "-";

      setUploadedFiles(
        (data.items || []).map((item) => formatUploadedFile(item, uploadedBy)),
      );

      const pagination = data.pagination || {};
      setTotalItems(pagination.total || 0);
      setTotalPages(pagination.totalPages || 0);
    } catch (fetchError) {
      setError(fetchError?.message || "Failed to fetch uploaded files.");
      setUploadedFiles([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setIsFetchingFiles(false);
    }
  }, [portalId, page, limit]);

  useEffect(() => {
    if (portalId) {
      fetchReportFiles();
    }
  }, [portalId, fetchReportFiles]);

  const existingFileForType = uploadedFiles.find(
    (file) => file.reportType === reportType,
  );
  const uploadedTypeIds = new Set(
    uploadedFiles.map((file) => file.reportType).filter(Boolean),
  );
  const allTypesUploaded = REPORT_TYPE_OPTIONS.every((option) =>
    uploadedTypeIds.has(option.value),
  );
  const canUploadForSelectedType = !existingFileForType && !isFetchingFiles;

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReportTypeChange = (selectedOption) => {
    if (!selectedOption?.value) {
      return;
    }

    setReportType(selectedOption.value);
    clearSelectedFile();
  };

  const typeSelectOptions = useMemo(() => {
    const typeIds = new Set(
      uploadedFiles.map((file) => file.reportType).filter(Boolean),
    );

    return REPORT_TYPE_OPTIONS.map((option) => ({
      value: option.value,
      label: `${option.label}${typeIds.has(option.value) ? " (Uploaded)" : ""}`,
    }));
  }, [uploadedFiles]);

  const selectedTypeOption =
    typeSelectOptions.find((option) => option.value === reportType) || null;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!canUploadForSelectedType) {
      setSelectedFile(null);
      setError(
        "A file already exists for this type. Delete the existing file before uploading.",
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (!EXCEL_REGEX.test(file.name)) {
      setSelectedFile(null);
      setError("Please upload a valid Excel file (.xlsx or .xls).");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Choose an Excel file before uploading.");
      return;
    }

    if (!canUploadForSelectedType) {
      setError(
        "A file already exists for this type. Delete the existing file before uploading.",
      );
      return;
    }

    const userData = getUserData();

    try {
      setIsUploading(true);
      setError("");

      const uploadData = new FormData();
      uploadData.append("file", selectedFile);
      uploadData.append("portalId", portalId);
      uploadData.append("reportType", reportType);
      uploadData.append("email", userData?.email || "");

      const response = await fetchWrapper(
        "/api/reports",
        {
          method: "POST",
          body: uploadData,
        },
        "reports-file-upload",
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload the selected file.");
      }

      toast.success("File uploaded successfully.");
      clearSelectedFile();
      if (page !== 1) {
        setPage(1);
      } else {
        await fetchReportFiles();
      }
    } catch (uploadError) {
      setError(uploadError?.message || "Failed to upload the selected file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (file) => {
    setFileToDelete(file);
    setIsDeleteModalOpen(true);
  };

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete?.id) return;

    try {
      setDeletingFileId(fileToDelete.id);
      setError("");

      const response = await fetchWrapper(
        `/api/box/files?fileId=${encodeURIComponent(fileToDelete.id)}&portalId=${encodeURIComponent(portalId)}`,
        { method: "DELETE" },
        "reports-file-delete",
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete file.");
      }

      toast.success(data?.message || "File deleted successfully.");
      setIsDeleteModalOpen(false);
      setFileToDelete(null);
      await fetchReportFiles();
    } catch (deleteError) {
      setError(deleteError?.message || "Failed to delete file.");
    } finally {
      setDeletingFileId(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || (totalPages > 0 && newPage > totalPages)) {
      return;
    }
    setPage(newPage);
  };

  const handleLimitChange = (value) => {
    setLimit(Number(value));
    setPage(1);
  };

  return (
    <div className="space-y-6 p-2">
      <div>
        <h3 className="text-lg font-medium text-foreground">Reports</h3>
        <p className="text-sm text-muted-foreground">
          Upload Excel files for Holdings or Sector Returns.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="report-type" className="text-sm font-medium text-muted-foreground">
              Type
            </Label>
            <ReactSelect
              inputId="report-type"
              className="w-full max-w-md"
              classNamePrefix="reports-select"
              styles={reportsSelectStyles}
              isSearchable={false}
              value={selectedTypeOption}
              onChange={handleReportTypeChange}
              options={typeSelectOptions}
              placeholder="Select type"
              menuPortalTarget={
                typeof document !== "undefined" ? document.body : null
              }
              menuPosition="fixed"
            />
          </div>

          {allTypesUploaded && (
            <Alert>
              <AlertDescription>
                Holdings and Sector Returns files are already uploaded. Delete an
                existing file before uploading a replacement.
              </AlertDescription>
            </Alert>
          )}

          {!allTypesUploaded && existingFileForType && (
            <Alert>
              <AlertDescription>
                A {existingFileForType.reportTypeLabel} file (
                {existingFileForType.name}) is already uploaded. Delete it from
                the table below before uploading a new one.
              </AlertDescription>
            </Alert>
          )}

          <button
            type="button"
            onClick={() => {
              if (canUploadForSelectedType) {
                fileInputRef.current?.click();
              }
            }}
            disabled={!canUploadForSelectedType}
            className={`flex w-full flex-col items-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors ${
              canUploadForSelectedType
                ? "cursor-pointer border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
                : "cursor-not-allowed border-border/70 bg-muted/10 opacity-70"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={EXCEL_ACCEPT}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-6 w-6 text-secondary-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {selectedFile ? selectedFile.name : "Upload Excel File"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {canUploadForSelectedType
                ? "Supported formats: .xlsx and .xls. Upload one file at a time."
                : "Upload is disabled until the existing file for this type is deleted."}
            </p>
          </button>

          {selectedFile && canUploadForSelectedType && (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={clearSelectedFile}
                disabled={isUploading}
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <LoaderSpinner size={18} className="text-primary-foreground" />
                ) : null}
                Upload
              </Button>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden shadow-sm">
        <div className="border-b border-border px-6 py-4">
          <h4 className="text-base font-medium text-foreground">
            Uploaded Files
          </h4>
        </div>

        <div className="hidden-scrollbar max-h-[320px] overflow-x-auto overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/50">
              <TableRow>
                <TableHead className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                  File
                </TableHead>
                <TableHead className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Size
                </TableHead>
                <TableHead className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Uploaded At
                </TableHead>
                <TableHead className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                  Uploaded By
                </TableHead>
                <TableHead className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetchingFiles ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center py-8">
                      <LoaderSpinner size={32} className="text-secondary-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : uploadedFiles.length > 0 ? (
                uploadedFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-foreground">
                          {file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {file.reportTypeLabel}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {file.uploadedAt}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {file.uploadedBy}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePreview(file.id)}
                          aria-label="Preview file"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveFile(file)}
                          disabled={deletingFileId === file.id}
                          className="text-destructive hover:text-destructive"
                          aria-label="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    No files uploaded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 0 && uploadedFiles.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-5 border-t border-border bg-muted/30 p-4 lg:justify-end">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-foreground">Rows per page:</span>
              <ReactSelect
                className="w-[80px]"
                classNamePrefix="reports-pagination-select"
                styles={paginationSelectStyles}
                isSearchable={false}
                value={
                  LIMIT_OPTIONS.find((option) => option.value === limit) ||
                  LIMIT_OPTIONS[1]
                }
                onChange={(option) => handleLimitChange(option?.value || 10)}
                options={LIMIT_OPTIONS}
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
              />
            </div>
            <span className="text-sm text-foreground">
              {isFetchingFiles
                ? "-"
                : `Page ${page} of ${totalPages} (${totalItems} total records)`}
            </span>
            <div className="flex items-center overflow-hidden rounded-full border border-border">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(1)}
                disabled={page <= 1 || isFetchingFiles}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1 || isFetchingFiles}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages || isFetchingFiles}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handlePageChange(totalPages)}
                disabled={page >= totalPages || isFetchingFiles}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <DeleteConfirmDialog
        isModalOpen={isDeleteModalOpen}
        setIsModalOpen={(open) => {
          setIsDeleteModalOpen(open);
          if (!open) {
            setFileToDelete(null);
          }
        }}
        handleDelete={handleConfirmDelete}
        title="Delete File"
        content={`Are you sure you want to delete "${fileToDelete?.name || "this file"}"?`}
        buttonText="Delete"
        isLoading={Boolean(deletingFileId)}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        fileId={previewFileId}
      />
    </div>
  );
}

export default ReportsContent;
