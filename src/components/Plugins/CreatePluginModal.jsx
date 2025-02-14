import { Edit, PlusCircle, Trash2, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import AddPageModal from "./AddPageModal";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getUserData } from "@/app/lib/auth";
import { PluginType } from "@/config/constants";
import DeleteConfirmDialog from "../DeleteConfirmDialog";

const LoadingSpinner = () => (
  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
    <div className="text-center space-y-3">
      <div className="mx-auto h-8 w-8 animate-spin">
        <div className="h-full w-full rounded-full border-4 border-gray-200 border-t-gray-800"></div>
      </div>
      <p className="text-sm text-gray-500">Loading...</p>
    </div>
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
    type: PluginType.PAGES,
    pageId: [],
  });

  const handleModalClose = () => {
    setEditData(null);
    onClose();
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
      setLoading(true);
      const encodedType = encodeURIComponent(plugin?.type);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid}&type=${encodedType}`,
        {},
        "fetch-plugins"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();
      // setPlugin(data.data);
      if (data.data.length !== 0) {
        setPages([...data.data[0].pages]);
        // setPages((prev) => [...prev, ...pageCreated]);
      }
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setLoading(false);
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

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 min-h-screen text-gray-700 bg-black/15 bg-opacity-80 flex items-center justify-center mt-0">
          <div className="bg-white rounded-lg flex flex-col relative p-5 max-w-[500px] w-full">
            <div className="flex -items-center justify-between border-b border-solid">
              <label className="text-xl font-semibold text-gray-700 mb-3">
                {plugin?.type.charAt(0).toUpperCase() + plugin?.type.slice(1)}
              </label>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {pages && pages.length > 0 && (
              <div className="py-2 text-gray-900">
                {pages.map((page, index) => (
                  <div
                    className="py-2 text-base flex justify-between items-center gap-2 w-full"
                    key={index}
                  >
                    {page?.title.charAt(0).toUpperCase() + page?.title.slice(1)}
                    <div className="flex items-center gap-2">
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
                        {/* {deleteLoading === page?.id ? "Deleting" : "Delete"} */}
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
                  </div>
                ))}
              </div>
            )}
            {loading && <LoadingSpinner />}
            <div className="flex justify-between items-center w-full space-x-4 mt-12">
              {/* <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button> */}
              {/* <div className="flex items-center gap-2 w-full justify-end"> */}
              {(plugin?.type === PluginType.TNC &&
                plugin.pages &&
                plugin.pages?.length < 1) ||
              plugin.type !== PluginType.TNC ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-800 bg-gray-100 rounded-md border  disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    // Clear the editData state
                    setEditData(null);

                    // Toggle the modal only if there's no editData
                    if (!editData) {
                      setIsOpenAddPageModal((prev) => !prev);
                    }
                  }}
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Page
                </button>
              ) : null}
              {/* </div> */}
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                // disabled={loading}
                onClick={handleModalClose}
              >
                Done
              </button>
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

export const CreatePluginModal = ({ isOpen, onClose, onPluginCreated }) => {
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
  const [pluginData, setPluginData] = useState({
    type: "",
    pageId: [],
  });

  const handleModalClose = () => {
    setPluginData({
      type: "",
      pageId: [],
    });
    setPages([]);
    setEditData(null);
    setError("");
    onClose();
  };
  console.log("pages", pages);
  console.log("pluginData", pluginData);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate if pageId is present and is an array
      // if (Array.isArray(pluginData.pageId) && pluginData.pageId.length > 0) {
      // Bulk create pages
      // const bulkResponse = await fetchWrapper(
      //   "/api/pages/bulk",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({ items: pluginData.pageId }),
      //   },
      //   "save-page"
      // );

      // if (!bulkResponse.ok) {
      //   const bulkErrorData = await bulkResponse.json();
      //   throw new Error(
      //     bulkErrorData.error || "Failed to create pages in bulk"
      //   );
      // }

      // const bulkData = await bulkResponse.json();

      // Update page data and plugin data
      // setPages(bulkData.data);
      // setPluginData((prev) => ({
      //   ...prev,
      //   pageId: bulkData.data.map((item) => item.id),
      // }));
      // }

      // Fetch user data
      const user = getUserData();

      // Construct plugin data
      const pluginPayload = {
        type: pluginData.type,
        portalId: params.portalid || "",
        pageId: pluginData.pageId || [],
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
        pageId: [],
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
      setLoading(false);
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

  // useEffect(() => {
  //   if (isOpen && params.portalid && pluginData.type) {
  //     fetchPlugin();
  //   }
  // }, [pluginData.type]);

  // useEffect(() => {
  //   if (isOpen) {
  //     fetchPlugin();
  //   }
  // }, [isOpen]);

  // useEffect(() => {
  //   fetchPlugin();
  // }, [onPageCreated]);

  // const fetchPlugin = async () => {
  //   try {
  //     setPages([]);
  //     const encodedType = encodeURIComponent(pluginData.type);
  //     const response = await fetchWrapper(
  //       `/api/plugins?portalId=${params?.portalid}&type=${encodedType}`,
  //       {},
  //       "fetch-plugins"
  //     );
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch plugins");
  //     }
  //     const data = await response.json();
  //     // setPlugin(data.data);
  //     const pageToAdd = pageCreated.filter(
  //       (item) => item.type === pluginData.type
  //     );
  //     const existingPages =
  //       (data.data.length !== 0 && data.data[0].pages) || [];
  //     setPages([...existingPages, ...pageToAdd]);
  //     // const pageIds = pageCreated.map((item) => item.id);
  //     // setPluginData((prev) => ({
  //     //   ...prev,
  //     //   pageId: [...prev.pageId, ...pageIds],
  //     // }));
  //   } catch (error) {
  //     console.error("Error fetching plugins:", error);
  //   } finally {
  //     setOnPageCreated(false);
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    if (isOpen && params.portalid && pluginData.type) {
      fetchPlugin();
    }
  }, [isOpen, params.portalid, pluginData.type, onPageCreated, pageCreated]);

  const fetchPlugin = async () => {
    try {
      console.log("Fetching plugins with type:", pluginData.type);
      setPages([]);
      const encodedType = encodeURIComponent(pluginData.type);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid}&type=${encodedType}`,
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

      const existingPages =
        (data.data.length !== 0 && data.data[0].pages) || [];
      console.log("Existing pages:", existingPages);

      setPages([...existingPages, ...pageToAdd]);
      console.log("Updated pages state.");
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setOnPageCreated(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(pluginData);
  }, [pluginData]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 min-h-screen text-gray-700 bg-black/15 bg-opacity-80 flex items-center justify-center mt-0">
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
                  {/* {pluginData.type.charAt(0).toUpperCase() +
                    pluginData.type.slice(1)} */}
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
                  <option value={PluginType.PAGES}>Page</option>
                  <option value={PluginType.TNC}>Terms and Conditions</option>
                </select>
              </div>
              {(pluginData.type === PluginType.TNC &&
                pages &&
                pages?.length < 1) ||
              pluginData.type !== PluginType.TNC ? (
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      // Clear the editData state
                      setEditData(null);

                      // Toggle the modal only if there's no editData
                      if (!editData) {
                        setIsOpenAddPageModal((prev) => !prev);
                      }
                    }}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add
                  </button>
                </div>
              ) : null}
              {pluginData.type && pages && pages.length > 0 && (
                <div className="py-2 text-gray-900">
                  {pages.map((page, index) => (
                    <div
                      className="py-2 text-base flex justify-between items-center gap-2 w-full"
                      key={index}
                    >
                      {page?.title.charAt(0).toUpperCase() +
                        page?.title.slice(1)}
                      <div className="flex items-center gap-2">
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
                          {/* {deleteLoading === page?.id ? "Deleting" : "Delete"} */}
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
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end w-full space-x-4 mt-12">
                {/* <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button> */}
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="spinner"></div>
                    </div>
                  ) : (
                    "Done"
                  )}
                </button>
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
