"use client";

import { Edit, PlusCircle, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import AddPageModal from "./AddPageModal";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/lib/auth";
import { PluginType } from "@/config/constants";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

const LoadingSpinner = () => (
  <div className="flex justify-center py-8">
    <LoaderSpinner size={32} className="text-secondary-foreground" />
  </div>
);

const PageListItem = ({
  page,
  onEdit,
  onDelete,
  deleteTarget,
  isDeleteModalOpen,
  setIsDeleteModalOpen,
  onConfirmDelete,
  deleteLoading,
}) => (
  <>
    <div className="flex w-full items-center justify-between gap-2 border-b border-border py-2 text-base text-foreground last:border-b-0">
      <span>
        {page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="icons"
          size="icon"
          className="rounded-full"
          onClick={() => onEdit(page)}
          title="Edit page"
        >
          <Edit className="size-5" />
        </Button>
        <Button
          type="button"
          variant="icons"
          size="icon"
          className="rounded-full text-destructive hover:text-destructive"
          onClick={() => onDelete(page)}
          title="Delete page"
        >
          <Trash2 className="size-5" />
        </Button>
      </div>
    </div>
    {deleteTarget?.id === page?.id && (
      <DeleteConfirmDialog
        isModalOpen={isDeleteModalOpen}
        setIsModalOpen={setIsDeleteModalOpen}
        handleDelete={() => onConfirmDelete(page)}
        title="Delete Page"
        isLoading={deleteLoading}
      />
    )}
  </>
);

export const UpdatePluginModal = ({ isOpen, onClose, plugin }) => {
  const params = useParams();
  const [isOpenAddPageModal, setIsOpenAddPageModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [onPageCreated, setOnPageCreated] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageSelected, setPageSelected] = useState(null);
  const [pluginData, setPluginData] = useState({
    type: plugin?.type,
    pageId: [],
  });

  const handleModalClose = async () => {
    setPages([]);
    setEditData(null);
    onClose();
  };

  const handleDone = async () => {
    setPages([]);
    setEditData(null);
    onClose();
  };

  useEffect(() => {
    if (isOpen && params.portalId && plugin?.type) {
      fetchPlugin();
    }
  }, []);

  useEffect(() => {
    if (isOpen && plugin?.type) {
      fetchPlugin();
    }
  }, [isOpen, plugin?.type]);

  useEffect(() => {
    if (onPageCreated) {
      fetchPlugin();
      setOnPageCreated(false);
    }
  }, [onPageCreated]);

  const fetchPlugin = async () => {
    if (!plugin?.type) return;

    try {
      const encodedType = encodeURIComponent(plugin?.type);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid || "root"}&type=${encodedType}`,
        {},
        "fetch-plugins",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();
      const existingPagesData = data?.data?.[0]?.pages || [];
      const customPages = existingPagesData.filter(
        (item) => item.isCustomPage === true,
      );
      setPages(customPages);
    } catch (error) {
      console.error("Error fetching plugins:", error);
    }
  };

  const handleDeletePage = async (page) => {
    try {
      setDeleteLoading(true);

      const response = await fetchWrapper(
        "/api/pages",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: page.id }),
        },
        "delete-page",
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete page");
      }
      setIsDeleteModalOpen(false);
      setPageSelected(null);
      fetchPlugin();
      toast.success("Page deleted successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const pluginTitle = !plugin?.type
    ? "Widget"
    : plugin.type === PluginType.TNC
      ? plugin.type.toUpperCase()
      : plugin.type.charAt(0).toUpperCase() + plugin.type.slice(1);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">{pluginTitle}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[40vh] overflow-y-auto text-foreground">
            {loading ? (
              <LoadingSpinner />
            ) : !pages.length ? (
              <p className="text-sm text-muted-foreground">No pages found.</p>
            ) : (
              pages.map((page) => (
                <PageListItem
                  key={page.id}
                  page={page}
                  onEdit={(selectedPage) => {
                    setEditData(selectedPage);
                    setIsOpenAddPageModal(true);
                  }}
                  onDelete={(selectedPage) => {
                    setIsDeleteModalOpen(true);
                    setPageSelected(selectedPage);
                  }}
                  deleteTarget={pageSelected}
                  isDeleteModalOpen={isDeleteModalOpen}
                  setIsDeleteModalOpen={setIsDeleteModalOpen}
                  onConfirmDelete={handleDeletePage}
                  deleteLoading={deleteLoading}
                />
              ))
            )}
          </div>

          <DialogFooter className="flex w-full items-center justify-between gap-2 sm:justify-between">
            {(plugin?.type === PluginType.TNC &&
              plugin?.pages &&
              plugin.pages?.length < 1) ||
            plugin?.type !== PluginType.TNC ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditData(null);
                  setIsOpenAddPageModal(true);
                }}
                className="px-3 py-3"
              >
                <PlusCircle className="h-4 w-4" />
                Add Page
              </Button>
            ) : (
              <span />
            )}
            <Button
              type="button"
              onClick={handleDone}
              disabled={loading}
              className="ml-auto px-3 py-3"
            >
              {loading ? (
                <LoaderSpinner size={18} className="text-primary-foreground" />
              ) : null}
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddPageModal
        isOpen={isOpenAddPageModal}
        onClose={() => setIsOpenAddPageModal(false)}
        setPluginData={setPluginData}
        editData={editData}
        setEditData={setEditData}
        setOnPageCreated={setOnPageCreated}
        plugin={plugin}
        pageType={pluginData.type}
      />
    </>
  );
};

export const CreatePluginModal = ({
  isOpen,
  onClose,
  onPluginCreated,
  pluginOptions,
}) => {
  const params = useParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isOpenAddPageModal, setIsOpenAddPageModal] = useState(false);
  const [pages, setPages] = useState([]);
  const [editData, setEditData] = useState(null);
  const [onPageCreated, setOnPageCreated] = useState(false);
  const [pageCreated, setPageCreated] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageSelected, setPageSelected] = useState(null);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [pluginData, setPluginData] = useState({
    type: "",
    pageId: [],
  });

  const handleModalClose = async () => {
    setPluginData({
      type: "",
      pageId: [],
    });
    setPages([]);
    setEditData(null);
    setError("");
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const user = getUserData();
      setIsSubmitLoading(true);
      const pluginPayload = {
        type: pluginData.type,
        portalId: params.portalid || "",
        pageId: pluginData.pageId,
        createdBy: user.id,
      };

      const pluginResponse = await fetchWrapper(
        "/api/plugins",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pluginPayload),
        },
        "save-plugin",
      );

      if (!pluginResponse.ok) {
        const pluginErrorData = await pluginResponse.json();
        throw new Error(pluginErrorData.error || "Failed to save plugin");
      }

      const savedPluginData = await pluginResponse.json();

      setPageCreated([]);
      setPluginData({
        type: "",
        pageId: [],
      });
      setPages([]);
      setEditData(null);
      onPluginCreated();
      onClose();
      toast.success(`Plugin ${savedPluginData.message} successfully`);
    } catch (error) {
      toast.error(error.message);
      console.error("Error creating plugin:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDeletePage = async (page) => {
    try {
      setDeleteLoading(true);

      const response = await fetchWrapper(
        "/api/pages",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: page.id }),
        },
        "delete-page",
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete page");
      }
      setPageCreated((prev) => prev.filter((item) => item?.id !== page?.id));
      setPluginData((prev) => ({
        ...prev,
        pageId: prev.pageId.filter((id) => id !== page?.id),
      }));
      setIsDeleteModalOpen(false);
      setPageSelected(null);
      fetchPlugin();
      toast.success("Page deleted successfully");
    } catch (error) {
      toast.error(error.message);
      setError("Failed to delete Page. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && pluginData.type) {
      fetchPlugin();
    }
  }, [isOpen, pluginData.type, onPageCreated, pageCreated]);

  const fetchPlugin = async () => {
    try {
      setLoading(true);
      setPages([]);
      const encodedType = encodeURIComponent(pluginData.type);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid || "root"}&type=${encodedType}`,
        {},
        "fetch-plugins",
      );

      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }

      const data = await response.json();
      const pageToAdd = pageCreated.filter(
        (item) => item.type === pluginData.type,
      );
      const existingPagesData = data?.data?.[0]?.pages || [];
      const customPages = existingPagesData.filter(
        (item) => item.isCustomPage === true,
      );
      const updatedPages = [...customPages, ...pageToAdd].filter(
        (page, index, self) => index === self.findIndex((p) => p.id === page.id),
      );

      setPages(updatedPages);
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setOnPageCreated(false);
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Widget</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-destructive/30">
                <AlertDescription className="text-destructive">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="widget-type" className="text-foreground">
                Widget Types
              </Label>
              <Select
                value={pluginData.type || undefined}
                onValueChange={(value) =>
                  setPluginData({ ...pluginData, type: value })
                }
              >
                <SelectTrigger id="widget-type" className="!bg-background h-11 w-full">
                  <SelectValue placeholder="Select Widget Type" />
                </SelectTrigger>
                <SelectContent>
                  {pluginOptions?.map((opt, idx) => (
                    <SelectItem key={idx} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(pluginData.type === PluginType.TNC &&
              pages &&
              pages?.length < 1) ||
            pluginData.type !== PluginType.TNC ? (
              <div className="flex items-center gap-2">
                {pluginData?.type && (
                  <Button
                    type="button"
                    onClick={() => {
                      setEditData(null);
                      setIsOpenAddPageModal(true);
                    }}
                    className="px-3 py-3"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Add
                  </Button>
                )}
              </div>
            ) : null}

            <div className="max-h-[40vh] overflow-y-auto text-foreground">
              {loading ? (
                <LoadingSpinner />
              ) : !pages.length ? (
                <p className="text-sm text-muted-foreground">No pages found.</p>
              ) : (
                pages.map((page) => (
                  <PageListItem
                    key={page.id}
                    page={page}
                    onEdit={(selectedPage) => {
                      setEditData(selectedPage);
                      setIsOpenAddPageModal(true);
                    }}
                    onDelete={(selectedPage) => {
                      setIsDeleteModalOpen(true);
                      setPageSelected(selectedPage);
                    }}
                    deleteTarget={pageSelected}
                    isDeleteModalOpen={isDeleteModalOpen}
                    setIsDeleteModalOpen={setIsDeleteModalOpen}
                    onConfirmDelete={handleDeletePage}
                    deleteLoading={deleteLoading}
                  />
                ))
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleModalClose}
                disabled={loading}
                className="px-3 py-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitLoading || loading}
                className="px-3 py-3"
              >
                {isSubmitLoading ? (
                  <LoaderSpinner size={18} className="text-primary-foreground" />
                ) : null}
                Done
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddPageModal
        isOpen={isOpenAddPageModal}
        onClose={() => setIsOpenAddPageModal(false)}
        setPluginData={setPluginData}
        setPageCreated={setPageCreated}
        editData={editData}
        setEditData={setEditData}
        setOnPageCreated={setOnPageCreated}
        pageType={pluginData.type}
      />
    </>
  );
};
