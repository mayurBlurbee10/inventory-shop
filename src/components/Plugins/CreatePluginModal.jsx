import { Edit, PlusCircle, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import AddPageModal from "./AddPageModal";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import { PluginType } from "@/config/constants";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import Button from "../Common/Elements/Button";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";

const LoadingSpinner = () => (
  <div className="flex justify-center py-8">
    <LoaderSpinner size={32} className="text-blue-500" />
  </div>
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
    pageId: []
  });

  const handleModalClose = async () => {
    setPages([]);
    setEditData(null);
    onClose();
    return;
  };

  const handleDone = async () => {
    setPages([]);
    setEditData(null);
    onClose();
    return;
  };


  useEffect(() => {
    if (isOpen && params.portalId && plugin.type) {
      fetchPlugin();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPlugin();
    }
  }, [isOpen]);

  useEffect(() => {
    if (onPageCreated) {
      fetchPlugin();
      setOnPageCreated(false);
    }
  }, [onPageCreated]);

  const fetchPlugin = async () => {
    try {
     
      const encodedType = encodeURIComponent(plugin?.type);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid || "root"}&type=${encodedType}`,
        {},
        "fetch-plugins"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();
      const existingPagesData = data?.data?.[0]?.pages || [];
      console.log("Existing pages:", existingPagesData);

      const customPages = existingPagesData.filter(
        (item) => item.isCustomPage === true
      );
      // setPlugin(data.data);

      setPages(customPages);
      // setPages((prev) => [...prev, ...pageCreated]);
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
        "delete-page"
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
      setError("Failed to delete Page. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderPagesList = (pagesList) => {
    return pagesList?.map((page, index) => (
      <div
        className={`py-2 text-base flex gap-2 w-full justify-between items-center`}
        key={index}
      >
        {page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}
          <>
            <div className="flex items-center ml-auto gap-2">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  if (editData) {
                    setEditData(null);
                  }
                  setEditData(page);
                  setIsOpenAddPageModal(true);
                }}
              >
                <Edit className="size-5 text-blue-700" />
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  setIsDeleteModalOpen((prev) => !prev);
                  setPageSelected(page);
                }}
              >
                <Trash2 className="size-5 text-red-700" />
              </button>
            </div>
            {pageSelected?.id === page?.id && (
              <DeleteConfirmDialog
                isModalOpen={isDeleteModalOpen}
                setIsModalOpen={setIsDeleteModalOpen}
                handleDelete={() => handleDeletePage(page)}
                title="Delete Page"
                isLoading={deleteLoading}
              />
            )}
          </>
      </div>
    ));
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 min-h-screen text-gray-700 bg-black/15 bg-opacity-80 flex items-center justify-center z-10"
          style={{ marginTop: 0 }}
        >
          <div className="bg-white rounded-lg flex flex-col relative max-w-[500px] w-full">
            <div className="flex -items-center justify-between border-b border-solid p-4">
              <label className="text-xl font-semibold text-gray-700">
                {plugin?.type === PluginType.TNC ? plugin?.type.toUpperCase() : plugin?.type.charAt(0).toUpperCase() + plugin?.type.slice(1)}
              </label>
              <button
                onClick={handleModalClose}
                className="text-gray-600 hover:bg-gray-100 p-1 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 text-gray-900 max-h-[40vh] overflow-y-auto">
              {loading ? (
                <LoadingSpinner />
              ) : !pages.length ? (
                <p>No pages found.</p>
              ) : (
                renderPagesList(pages)
              )}
            </div>

            <div className="flex justify-between items-center w-full space-x-4 p-4">
              {(plugin?.type === PluginType.TNC &&
                plugin.pages &&
                plugin.pages?.length < 1) ||
              plugin.type !== PluginType.TNC ? (
                <Button
                  onClick={() => {
                    setEditData(null);
                    if (!editData) {
                      setIsOpenAddPageModal((prev) => !prev);
                    }
                  }}
                  icon={PlusCircle}
                  type="Secondary"
                  label="Add Page"
                />
              ) : null}
              <Button
                onClick={handleDone}
                type="Primary"
                label="Done"
                isLoading={loading}
                className="ml-auto"
              />
            </div>
          </div>
        </div>
      )}
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

export const CreatePluginModal = ({ isOpen, onClose, onPluginCreated, pluginOptions }) => {
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
    pageId: []
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
    return;
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

      // Save plugin
      const pluginResponse = await fetchWrapper(
        "/api/plugins",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pluginPayload),
        },
        "save-plugin"
      );

      if (!pluginResponse.ok) {
        const pluginErrorData = await pluginResponse.json();
        throw new Error(pluginErrorData.error || "Failed to save plugin");
      }

      const savedPluginData = await pluginResponse.json();

      // Close modal and show success toast
      setPageCreated([]);
      setPluginData({
        type: "",
        pageId: []
      });
      setPages([]);
      setEditData(null);
      onPluginCreated();
      onClose();
      toast.success(`Plugin ${savedPluginData.message} successfully`);
    } catch (error) {
      // Log and display error
      toast.error(error.message);
      console.error("Error creating plugin:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      // Reset loading state
      setIsSubmitLoading(false)
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
        "delete-page"
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
      setLoading(true)
      console.log("Fetching plugins with type:", pluginData.type);
      setPages([]);
      const encodedType = encodeURIComponent(pluginData.type);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid || "root"}&type=${encodedType}`,
        {},
        "fetch-plugins"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }

      const data = await response.json();
      console.log("API response data:", data);
      console.log("Page created:", pageCreated);
      const pageToAdd = pageCreated.filter(
        (item) => item.type === pluginData.type
      );
      console.log("Filtered pageToAdd:", pageToAdd);

      const existingPagesData = data?.data?.[0]?.pages || [];
      console.log("Existing pages:", existingPagesData);

      const customPages = existingPagesData.filter(
        (item) => item.isCustomPage === true
      );

      // Avoiding duplicates before updating state
      const updatedPages = [...customPages, ...pageToAdd].filter(
        (page, index, self) => index === self.findIndex((p) => p.id === page.id)
      );

      setPages(updatedPages);
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setOnPageCreated(false);
      setLoading(false);
    }
  };

  const renderPagesList = (pagesList) => {
    return pagesList?.map((page, index) => (
      <div
        className={`py-2 text-base flex gap-2 w-full justify-between items-center`}
        key={index}
      >
        {page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}

        <>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                setEditData(page);
                setIsOpenAddPageModal(true);
              }}
            >
              <Edit className="size-5 text-blue-700" />
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                setIsDeleteModalOpen(true);
                setPageSelected(page);
              }}
            >
              <Trash2 className="size-5 text-red-700" />
            </button>
          </div>
          {pageSelected?.id === page?.id && (
            <DeleteConfirmDialog
              isModalOpen={isDeleteModalOpen}
              setIsModalOpen={setIsDeleteModalOpen}
              handleDelete={() => handleDeletePage(page)}
              title="Delete Page"
              isLoading={deleteLoading}
            />
          )}
        </>
      </div>
    ));
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 min-h-screen text-gray-700 bg-black/15 bg-opacity-80 flex items-center justify-center"
          style={{ marginTop: 0 }}
        >
          <div className="bg-white rounded-lg flex flex-col relative p-5 max-w-[500px] w-full">
            <div className="flex -items-center justify-between border-b border-solid">
              <label className="text-xl font-semibold text-gray-700 mb-3">
                Add Widget
              </label>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="mb-2 pt-3">
              <div className="w-full mb-3">
                <label className="text-base font-semibold text-gray-700 ">
                  Widget Types
                </label>
                <select
                  className="block w-full mt-1 tracking-wide rounded-lg border border-solid border-gray-200 text-gray-600 focus:border-blue-500 focus:ring-blue-500 p-3 outline-none"
                  value={pluginData.type}
                  onChange={(e) =>
                    setPluginData({ ...pluginData, type: e.target.value })
                  }
                >
                  <option value="" disabled>
                    Select Widget Type
                  </option>
                  {pluginOptions &&
                    pluginOptions.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                </select>
              </div>
              {(pluginData.type === PluginType.TNC &&
                pages &&
                pages?.length < 1) ||
              pluginData.type !== PluginType.TNC ? (
                <div className="flex items-center gap-2 w-full">
                    {
                      pluginData?.type && (
                        <Button
                          onClick={() => {
                            setEditData(null);
                            if (!editData) {
                              setIsOpenAddPageModal((prev) => !prev);
                            }
                          }}
                          icon={PlusCircle}
                          type="Primary"
                          label="Add"
                        />
                      )
                    }
                </div>
              ) : null}

              <div className="py-2 text-gray-900 max-h-[40vh] overflow-y-auto">
                {loading ? (
                  <LoadingSpinner />
                ) : !pages.length ? (
                  <p>No pages found.</p>
                ) : (
                  renderPagesList(pages)
                )}
              </div>

              <div className="flex justify-end w-full space-x-4 mt-12">
                <Button
                  onClick={handleModalClose}
                  disabled={loading}
                  type="Secondary"
                  label="Cancel"
                />
                <Button
                  buttonType="submit"
                  disabled={isSubmitLoading || loading}
                  isLoading={isSubmitLoading}
                  type="Primary"
                  label="Done"
                />
              </div>
            </form>
          </div>
        </div>
      )}
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
