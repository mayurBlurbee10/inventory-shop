import React, { useEffect, useState } from "react";
import {
  Trash2,
  Eye,
  Edit,
  PlusCircle,
  Plus,
  Loader2,
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
import Button from "../Common/Elements/Button";

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
        `/api/nda-agreements?portalId=${params.portalid}&page=${page}&limit=${limit}`,
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
            portalId: params.portalid,
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
      <div className="flex sm:flex-row flex-col justify-center sm:justify-between items-center gap-2 pb-5">
        <div className=" text-center sm:text-left">
          <h3 className="text-lg font-medium text-secondary">NDA Pages</h3>
          <p className="text-gray-600 text-sm">Manage your NDA agreements.</p>
        </div>
        <Button
          onClick={handleCreate}
          type="Primary"
          label="Create NDA"
          icon={PlusCircle}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agreements.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-4">
            <div className="mx-auto w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <Plus
                className="w-8 h-8 text-gray-400 cursor-pointer"
                onClick={handleCreate}
              />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No NDA agreements found
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first NDA (editor or e-sign) to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto hidden-scrollbar">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Default
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agreements.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {row.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {typeLabel(row.ndaType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.isDefault === true}
                          onChange={() => handleDefaultToggle(row.id)}
                          className="sr-only peer"
                        />
                        {isToggleDefault === row?.id ? (
                          <Loader2 className="size-4 text-blue-400 animate-spin" />
                        ) : (
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        )}
                        <span className="ml-3 text-sm font-medium text-gray-700">
                          {row.isDefault ? "Default" : "Set as default"}
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleCopy(row)}
                          className="p-2 rounded-md hover:bg-gray-100 transition"
                          title="Copy"
                          disabled={isCopying === row.id}
                        >
                          {isCopying === row.id ? (
                            <Loader2 className="size-4 text-gray-600 animate-spin" />
                          ) : (
                            <Copy className="size-4 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleView(row)}
                          className="p-2 rounded-md hover:bg-blue-100 transition"
                          title="View"
                        >
                          <Eye className="size-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleEdit(row)}
                          className="p-2 rounded-md hover:bg-blue-100 transition"
                          title="Edit"
                        >
                          <Edit className="size-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="p-2 rounded-md hover:bg-red-100 transition"
                          title="Delete"
                        >
                          <Trash2 className="size-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-center lg:justify-end items-center p-4 gap-5 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex items-center space-x-2 text-sm">
              <span className="text-gray-700">Rows per page:</span>
              <select
                className="border rounded px-2 py-1 bg-white text-gray-700"
                value={limit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <span className="text-gray-700 text-sm">
              Page {page} of {Math.max(totalPages, 1)}
            </span>
            <div className="flex gap-2 items-center">
              <button
                className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                onClick={() => setPage(1)}
                disabled={page === 1 || loading}
              >
                <ChevronsLeft className="size-4 text-gray-600" />
              </button>
              <button
                className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={!hasPrev || loading}
              >
                <ChevronLeft className="size-4 text-gray-600" />
              </button>
              <button
                className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, Math.max(totalPages, 1)))
                }
                disabled={!hasNext || loading}
              >
                <ChevronRight className="size-4 text-gray-600" />
              </button>
              <button
                className="p-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                onClick={() => setPage(Math.max(totalPages, 1))}
                disabled={page === Math.max(totalPages, 1) || loading}
              >
                <ChevronsRight className="size-4 text-gray-600" />
              </button>
              </div>
            </div>
        </div>
      )}

      <NDAcreation
        isOpen={isModalOpen}
        onClose={handleModalClose}
        editData={editData}
        setEditData={setEditData}
      />

      {isViewModalOpen && viewData && (
        <div
          className="fixed inset-0 min-h-screen text-gray-700 bg-black bg-opacity-50 flex items-center justify-center z-10"
          style={{ marginTop: 0 }}
        >
          <div className="bg-white rounded-lg w-[90%] max-w-[800px] flex flex-col relative max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{viewData.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                <div
                  dangerouslySetInnerHTML={{
                    __html: viewData.description || "",
                  }}
                  className="text-gray-700"
                />
              </div>
              <div className="mt-4 pt-2 border-t text-sm text-gray-500">
                <p>Created: {formatDate(viewData.createdAt)}</p>
                <p>Last updated: {formatDate(viewData.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
