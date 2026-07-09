 "use client";

import React, { useEffect, useState } from "react";
import {
  Trash2,
  Eye,
  Edit,
  PlusCircle,
  Plus,
  Copy,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import NDAcreation from "./NDAcreation";
import PreviewModal from "../FileExplorer/PreviewModal";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TermsAndConditionCreation = () => {
  const params = useParams();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [agreementToDelete, setAgreementToDelete] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isToggleDefault, setIsToggleDefault] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [isCopying, setIsCopying] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const response = await fetchWrapper(
        `/api/nda-agreements?portalId=${params.portalid || "root"}&page=${page}&limit=${limit}`,
        {},
        "fetch-nda-agreements",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch NDA agreements");
      }

      const data = await response.json();
      setAgreements(data.data || []);
      const pagination = data.pagination || {};
      setTotalItems(pagination.total || 0);
      setTotalPages(pagination.totalPages || 1);
    } catch (error) {
      toast.error(error.message);
      console.error("Error fetching NDA agreements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.portalid) {
      fetchAgreements();
    }
  }, [params.portalid, page, limit]);

  const handleLimitChange = (nextLimit) => {
    setPage(1);
    setLimit(nextLimit);
  };

  const handleCreate = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditData(row);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setAgreementToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setIsDeleteLoading(true);
    try {
      const response = await fetchWrapper(
        "/api/nda-agreements",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: agreementToDelete }),
        },
        "delete-nda-agreement",
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }

      toast.success("NDA deleted successfully");
      fetchAgreements();
      setIsDeleteModalOpen(false);
      setAgreementToDelete(null);
    } catch (error) {
      toast.error(error.message);
      console.error("Error deleting NDA:", error);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleDefaultToggle = async (agreementId) => {
    setIsToggleDefault(agreementId);
    try {
      const response = await fetchWrapper(
        "/api/nda-agreements/default",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            agreementId,
            portalId: params.portalid || "root",
          }),
        },
        "set-default-nda-agreement",
      );

      if (!response.ok) {
        throw new Error("Failed to update default NDA");
      }

      toast.success("Default NDA updated successfully");
      fetchAgreements();
    } catch (error) {
      toast.error(error.message);
      console.error("Error setting default NDA:", error);
    } finally {
      setIsToggleDefault(null);
    }
  };

  const handleCopy = async (row) => {
    setIsCopying(row.id);
    try {
      const response = await fetchWrapper(
        "/api/nda-agreements/copy",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: row.id }),
        },
        "copy-nda-agreement",
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to copy NDA");
      }

      toast.success("NDA copied successfully");
      fetchAgreements();
    } catch (error) {
      toast.error(error.message);
      console.error("Error copying NDA:", error);
    } finally {
      setIsCopying(null);
    }
  };

  const handleView = (row) => {
    if (row.ndaType === "esign" && row.fileId) {
      setPreviewFileId(row.fileId);
      setPreviewFileName(row.originalFileName || row.title || "NDA document");
      setIsPreviewOpen(true);
      return;
    }
    setViewData(row);
    setIsViewModalOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewFileId(null);
    setPreviewFileName("");
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditData(null);
    fetchAgreements();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typeLabel = (ndaType) =>
    ndaType === "esign" ? "E-sign" : "NDA editor";

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="p-2">
      <div className="flex flex-col items-center justify-center gap-2 pb-5 sm:flex-row sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-medium text-foreground">NDA Pages</h3>
          <p className="text-sm text-muted-foreground">
            Manage your NDA agreements.
          </p>
        </div>
        <Button type="button" variant="default" onClick={handleCreate} className="px-3 py-3">
          <PlusCircle className="h-4 w-4" />
          Create NDA
        </Button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <LoaderSpinner size={28} className="text-secondary-foreground" />
        </div>
      ) : agreements.length === 0 ? (
        <Card className="bg-muted/40">
          <CardContent className="py-12 text-center">
            <div className="mb-4 text-muted-foreground">
              <Button
                type="button"
                variant="icons"
                size="icon"
                className="rounded-full text-secondary-foreground hover:text-secondary-foreground"
                onClick={handleCreate}
              >
                <Plus className="size-4" />
              </Button>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                No NDA agreements found
              </h3>
              <p className="text-muted-foreground">
                Create your first NDA (editor or e-sign) to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="hidden-scrollbar max-h-[400px] overflow-x-auto overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/50">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                      Title
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                      Created
                    </TableHead>
                    <TableHead className="px-6 py-3 text-xs uppercase tracking-wider text-muted-foreground">
                      Default
                    </TableHead>
                    <TableHead className="px-6 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreements.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {row.title}
                        </div>
                      </TableCell>
                      <TableCell className="bg-transparent px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <span className="inline-flex items-center rounded-sm bg-transparent px-2 py-1 text-secondary-foreground">
                          {typeLabel(row.ndaType)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {isToggleDefault === row?.id ? (
                            <LoaderSpinner size={24} className="text-secondary-foreground" />
                          ) : (
                            <ThemeSwitch
                              checked={row.isDefault === true}
                              onCheckedChange={() => handleDefaultToggle(row.id)}
                            />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {row.isDefault ? "Default" : "Set as default"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="icons"
                            size="icon"
                            className="rounded-full"
                            onClick={() => handleCopy(row)}
                            title="Copy"
                            disabled={isCopying === row.id}
                          >
                            {isCopying === row.id ? (
                              <LoaderSpinner size={18} className="text-muted-foreground" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="icons"
                            size="icon"
                            className="rounded-full text-secondary-foreground hover:text-secondary-foreground"
                            onClick={() => handleView(row)}
                            title="View"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="icons"
                            size="icon"
                            className="rounded-full text-secondary-foreground hover:text-secondary-foreground"
                            onClick={() => handleEdit(row)}
                            title="Edit"
                          >
                            <Edit className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="icons"
                            size="icon"
                            className="rounded-full text-destructive hover:text-destructive"
                            onClick={() => handleDelete(row.id)}
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 border-t border-border bg-muted/30 p-4 lg:justify-end">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-foreground">Rows per page:</span>
                <Select
                  value={String(limit)}
                  onValueChange={(value) => handleLimitChange(Number(value))}
                >
                  <SelectTrigger className="h-10 w-[80px] !bg-background text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-foreground">
                Page {page} of {Math.max(totalPages, 1)}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(1)}
                  disabled={page === 1 || loading}
                >
                  <ChevronsLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={!hasPrev || loading}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, Math.max(totalPages, 1)))
                  }
                  disabled={!hasNext || loading}
                >
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(Math.max(totalPages, 1))}
                  disabled={page === Math.max(totalPages, 1) || loading}
                >
                  <ChevronsRight className="size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <NDAcreation
        isOpen={isModalOpen}
        onClose={handleModalClose}
        editData={editData}
        setEditData={setEditData}
      />

      <Dialog
        open={isViewModalOpen && !!viewData}
        onOpenChange={(open) => {
          if (!open) {
            setIsViewModalOpen(false);
            setViewData(null);
          }
        }}
      >
        <DialogContent
          className="max-h-[80vh] w-[90%] max-w-[800px] overflow-y-auto sm:max-w-[800px]"
        >
          {viewData && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl text-foreground">
                  {viewData.title}
                </DialogTitle>
              </DialogHeader>
              <div className="p-2">
                <div className="prose max-w-none">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: viewData.description || "",
                    }}
                    className="text-foreground"
                  />
                </div>
                <div className="mt-4 border-t border-border pt-2 text-sm text-muted-foreground">
                  <p>Created: {formatDate(viewData.createdAt)}</p>
                  <p>Last updated: {formatDate(viewData.updatedAt)}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={closePreview}
        fileId={previewFileId}
        fileName={previewFileName}
      />

      <DeleteConfirmDialog
        isModalOpen={isDeleteModalOpen}
        setIsModalOpen={setIsDeleteModalOpen}
        handleDelete={confirmDelete}
        title="Delete NDA"
        content="Deleting this NDA cannot be undone. Do you want to continue?"
        buttonText="Delete"
        isLoading={isDeleteLoading}
      />
    </div>
  );
};

export default TermsAndConditionCreation;
