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
  <div className="flex justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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
    pageId: [],
    existingPageIds : []
  });
  const [pageType, setPageType] = useState("");
  const [existingPages, setExistingPages] = useState([]);
  const [isExistingPageLoading, setIsExistingPageLoading] = useState(false);

  const handleModalClose = async () => {
    setPages([]);
    setEditData(null);
    setExistingPages([]);
    setPageType("");
    onClose();
    return;
  };

  const handleDone = async () => {
    if(plugin.type !== PluginType.PAGES){
      setPages([]);
      setEditData(null);
      setExistingPages([]);
      setPageType("");
      onClose();
      return;
    }
    try {
      setLoading(true);
      const pluginPayload = {
        type: PluginType.PAGES,
        portalId: params.portalid || "",
        pageId: [...pluginData.existingPageIds],
        existingPages,
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
        "save-plugin"
      );
      if (!pluginResponse.ok) {
        const pluginErrorData = await pluginResponse.json();
        throw new Error(pluginErrorData.error || "Failed to update plugin");
      }
      const savedPluginData = await pluginResponse.json();

      setPages([]);
      setEditData(null);
      setExistingPages([]);
      setPageType("");
      onClose();
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (isOpen && params.portalId && plugin.type) {
      fetchPlugin();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchPlugin();
      fetchExistingPages();
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
        `/api/plugins?portalId=${params?.portalid}&type=${encodedType}`,
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
      setPageType((prevPageType) =>
        plugin?.type !== PluginType.PAGES ? "customPages" : prevPageType
      );
      // setPages((prev) => [...prev, ...pageCreated]);
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } 
  };

  const fetchExistingPages = async () => {
    try {
      setIsExistingPageLoading(true);
      const response = await fetchWrapper(
        "/api/pages/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ portalId: params.portalid, pluginId : plugin?.id }),
        },
        "fetch-page"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete page");
      }

      setExistingPages(data.data);
      setPluginData((prev) => ({
        ...prev,
        existingPageIds: data.data.map((item) => item.id),
      }));

      fetchPlugin();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsExistingPageLoading(false);
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
        className={`py-2 text-base flex gap-2 w-full ${
          pageType === "pages"
            ? "flex-col justify-center"
            : "justify-between items-center"
        }`}
        key={index}
      >
        {page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}
        {pageType === "customPages" && (
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
        )}
        <div className="flex flex-col">
          {pageType === "pages" &&
            page?.visibility.map((section, idx) => (
              <div
                key={idx}
                className="ml-5 flex items-center justify-between my-1 bg-gray-50 py-2 px-4 rounded"
              >
                <span>{section.label}</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setExistingPages((prevPages) =>
                        prevPages.map((p) =>
                          p.id === page.id
                            ? {
                                ...p,
                                visibility: p.visibility.map((sec, secIdx) =>
                                  secIdx === idx
                                    ? { ...sec, visible: !sec.visible }
                                    : sec
                                ),
                              }
                            : p
                        )
                      )
                    }
                    className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${section.visible ? "bg-blue-600" : "bg-gray-200"}
                `}
                  >
                    <span
                      className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${section.visible ? "translate-x-5" : "translate-x-0"}
                  `}
                    />
                  </button>
                </div>
              </div>
            ))}
        </div>
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
                {plugin?.type.charAt(0).toUpperCase() + plugin?.type.slice(1)}
              </label>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {plugin?.type === "pages" && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex gap-2">
                  <input
                    type="radio"
                    id="pages"
                    name="pageType"
                    value="pages"
                    checked={pageType === "pages"}
                    onChange={(e) => setPageType(e.target.value)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="pages">Pages</label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="radio"
                    id="customPages"
                    name="pageType"
                    value="customPages"
                    checked={pageType === "customPages"}
                    onChange={(e) => setPageType(e.target.value)}
                    className="cursor-pointer"
                  />
                  <label htmlFor="customPages">CustomPages</label>
                </div>
              </div>
            )}

            <div className="py-2 text-gray-900 max-h-[40vh] overflow-y-auto">
              {!pageType ? (
                <p>Select page type.</p>
              ) : pageType === "customPages" ? (
                pages.length > 0 ? (
                  renderPagesList(pages)
                ) : (
                  <p>No custom pages found.</p>
                )
              ) : isExistingPageLoading ? (
                <LoadingSpinner />
              ) : existingPages.length > 0 ? (
                renderPagesList(existingPages)
              ) : (
                <p>No pages found.</p>
              )}
            </div>

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
              (plugin.type !== PluginType.TNC && pageType === "customPages") ? (
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
                className="px-6 py-2.5 ml-auto text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                disabled={loading}
                onClick={handleDone}
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
  const [pluginData, setPluginData] = useState({
    type: "",
    pageId: [],
    existingPageIds : []
  });
  const [pageType, setPageType] = useState("");
  const [existingPages, setExistingPages] = useState([]);
  const [isExistingPageLoading, setIsExistingPageLoading] = useState(false);

  const handleModalClose = async () => {
    if(pluginData.type !== PluginType.PAGES){
      setPluginData({
        type: "",
        pageId: [],
        existingPageIds : []
      });
      setPages([]);
      setEditData(null);
      setExistingPages([]);
      setPageType("");
      setError("")
      onClose();
      return;
    }
    try {
      setLoading(true);
      const pluginPayload = {
        items : existingPages,
      };
      const response = await fetchWrapper(
        "/api/pages/bulk",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(pluginPayload),
        },
        "delete-pages"
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete pages");
      }
      const savedPluginData = await response.json();
      setPluginData({
        type: "",
        pageId: [],
        existingPageIds : []
      });
      setPages([]);
      setEditData(null);
      setExistingPages([]);
      setPageType("");
      setError("")
      onClose();
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setLoading(false);
    }
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
        pageId: [...pluginData.pageId, ...pluginData.existingPageIds] || [],
        existingPages,
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
        existingPageIds : []
      });
      setPages([]);
      setEditData(null);
      setExistingPages([]);
      setPageType("");
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
      setPageType(pluginData.type !== PluginType.PAGES ? "customPages" : pageType)
      console.log("Updated pages state.", customPages);
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setOnPageCreated(false);
      setLoading(false);
    }
  };

  const fetchExistingPages = async () => {
    try {
      setIsExistingPageLoading(true);
      const response = await fetchWrapper(
        "/api/pages/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ portalId: params.portalid }),
        },
        "fetch-page"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete page");
      }

      setExistingPages(data.data);
      setPluginData((prev) => ({
        ...prev,
        existingPageIds: data.data.map((item) => item.id),
      }));

      fetchPlugin();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsExistingPageLoading(false);
    }
  };

  useEffect(() => {
    if (pageType === "pages") {
      fetchExistingPages();
    }
  }, [pageType]);

  useEffect(() => {
    console.log(pluginData);
  }, [pluginData]);

  const renderPagesList = (pagesList) => {
    return pagesList?.map((page, index) => (
      <div
        className={`py-2 text-base flex gap-2 w-full ${
          pageType === "pages"
            ? "flex-col justify-center"
            : "justify-between items-center"
        }`}
        key={index}
      >
        {page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}
        {pageType === "customPages" && (
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
        )}
        <div className="flex flex-col">
          {pageType === "pages" &&
            page?.visibility.map((section, idx) => (
              <div
                key={idx}
                className="ml-5 flex items-center justify-between my-1 bg-gray-50 py-2 px-4 rounded"
              >
                <span>{section.label}</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setExistingPages((prevPages) =>
                        prevPages.map((p) =>
                          p.id === page.id
                            ? {
                                ...p,
                                visibility: p.visibility.map((sec, secIdx) =>
                                  secIdx === idx
                                    ? { ...sec, visible: !sec.visible }
                                    : sec
                                ),
                              }
                            : p
                        )
                      )
                    }
                    className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${section.visible ? "bg-blue-600" : "bg-gray-200"}
                `}
                  >
                    <span
                      className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${section.visible ? "translate-x-5" : "translate-x-0"}
                  `}
                    />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
    ));
  };

  console.log("existingPages", existingPages);

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
                  {pluginOptions && pluginOptions.map((opt, idx)=>(
                    <option key={idx} value={opt.value}>{opt.label}</option>
                  ))}
                  {/* <option value={PluginType.PAGES}>Page</option>
                  <option value={PluginType.TNC}>Terms and Conditions</option> */}
                </select>
              </div>
              {pluginData.type === PluginType.PAGES && (
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex gap-2 cursor-pointer">
                    <input
                      type="radio"
                      id="pages"
                      name="pageType"
                      value="pages"
                      checked={pageType === "pages"}
                      onChange={(e) => setPageType(e.target.value)}
                      className="cursor-pointer"
                    />
                    <label htmlFor="pages">Pages</label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="radio"
                      id="customPages"
                      name="pageType"
                      value="customPages"
                      checked={pageType === "customPages"}
                      onChange={(e) => setPageType(e.target.value)}
                      className="cursor-pointer"
                    />
                    <label htmlFor="customPages">CustomPages</label>
                  </div>
                </div>
              )}
              {(pluginData.type === PluginType.TNC &&
                pages &&
                pages?.length < 1) ||
              (pluginData.type !== PluginType.TNC &&
                pageType === "customPages") ? (
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

              <div className="py-2 text-gray-900 max-h-[40vh] overflow-y-auto">
                {pluginData.type && pageType === "customPages"  ? (
                  pages.length > 0 ? (
                    renderPagesList(pages)
                  ) : (
                    <p>No custom pages found.</p>
                  )
                ) : isExistingPageLoading ? (
                  <LoadingSpinner />
                ) : existingPages.length > 0 ? (
                  renderPagesList(existingPages)
                ) : (
                  <>
                    {pluginData.title ? (
                      pageType ? (
                        <p>No pages found.</p>
                      ) : (
                        <p>Select page type.</p>
                      )
                    ) : null}
                  </>
                )}
              </div>

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
