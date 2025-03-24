import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { PluginType } from "@/config/constants";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import AddPageModal from "../Plugins/AddPageModal";
import Button from "../Common/Elements/Button";
import { toast } from "react-toastify";
import { getUserData } from "@/lib/auth";
import { useDispatch, useSelector } from "react-redux";
 import { setPages } from "@/store/services/pageService";
import ContentManagementContent from "./ContentManagementContent";
import ProductsContent from "./ProductsContent";

const MyPageContent = ({ setIsQueryFetched=()=>{} }) => {
  const params = useParams();
  const [isOpenAddPageModal, setIsOpenAddPageModal] = useState(false);
  const [editData, setEditData] = useState(null);
  // const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [onPageCreated, setOnPageCreated] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pageSelected, setPageSelected] = useState(null);
  const [pluginData, setPluginData] = useState({
    type: PluginType.PAGES,
    pageId: [],
  });
  const [existingPages, setExistingPages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [plugin, setPlugin] = useState(null);
  const hasFetched = useRef(false);

  const { data : user } = useSelector((state) => state.user); 
  const { data : pages } = useSelector((state) => state.pages); 
  const [pagesData, setPagesData] = useState(pages);
  const dispatch = useDispatch();
  const [isUserData, setIsUserData] = useState("");
  const { data: config } = useSelector((state) => state.portal);

  useEffect(() => {
    const userData = getUserData();
    setIsUserData(userData?.isOnboardingRequired)
  }, []);
  useEffect(() => {
      fetchExistingPages();
  }, []);

  useEffect(() => {
    if (onPageCreated) {
      fetchPlugin();
      setOnPageCreated(false);
    }
  }, [onPageCreated]);

  const fetchPlugin = async () => {
    try {
      setLoading(true);
      const encodedType = encodeURIComponent(PluginType.PAGES);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid}&type=${encodedType}`,
        {},
        "fetch-plugins"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();
      const existingPagesData = data?.data[0]?.pages || [];
      console.log("Existing pages:", existingPagesData);

      setPlugin(data.data[0]);
      dispatch(setPages(existingPagesData));
      setPagesData(existingPagesData)
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async () => {
      try {
        setIsSubmitting(true);
        const pageIds = pages.map((item)=>item.id)
        const pluginPayload = {
          type: PluginType.PAGES,
          portalId: params.portalid ,
          pageId: pageIds,
          existingPages : pagesData,
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

        await fetchPlugin();
        toast.success("Plugin updated successfully")
      } catch (error) {
        console.error("Error fetching plugins:", error);
      } finally {
        setIsSubmitting(false);
      }
    };

    const fetchExistingPages = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;
      try {
        setLoading(true);
        const pluginPayload = {
          type: PluginType.PAGES,
          portalId: params.portalid || "default",
          createdBy: user?.id,
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
          return;
        }

        const savedPluginData = await pluginResponse.json();

        const response = await fetchWrapper(
          "/api/pages/bulk",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              portalId: params.portalid,
              pluginId: savedPluginData?.data?.id,
            }),
          },
          "fetch-page"
        );

        const data = await response.json();
        setIsQueryFetched(true);
        await fetchPlugin();
      } catch (error) {
        toast.error(error.message);
      }finally{
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

  const renderPagesList = (pagesList) => {
    return pagesList?.map((page, index) => (
      <React.Fragment key={page?.id}>
        {((!page?.isCustomPage && page?.visibility?.length > 0 ) || page?.isCustomPage) && (
      <div
        className={`text-base flex gap-2 w-full border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
          page?.isCustomPage ? "justify-between items-center" : "flex-col"
        }`}
        key={index}
      >
        <h3 className="font-lato font-semibold text-lg">
          {page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}
        </h3>
        {page?.isCustomPage && (
          <>
            <div className="flex items-center ml-auto gap-2 ">
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
        <div className="flex flex-col divide-y divide-gray-200">
          {!page?.isCustomPage &&
            page?.visibility &&
            page?.visibility.map((section, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between my-1 py-2 px-4"
              >
                <span>{section?.label}</span>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() =>
                      setPagesData((prevPages) =>
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
                        ${section?.visible ? "bg-blue-600" : "bg-gray-200"}
                      `}
                  >
                    <span
                      className={`
                          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                          ${section?.visible ? "translate-x-5" : "translate-x-0"}
                        `}
                    />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>
      )}
      </React.Fragment>
    ));
  };
console.log("pagesData:", pagesData);

  return (
    <div className="bg-white shadow-none md:shadow rounded-lg overflow-y-auto">
      <div className="bg-white rounded-lg flex flex-col relative md:p-3 lg:p-5 w-full">
        <div className="flex justify-center sm:justify-between items-center flex-wrap gap-2 ">
          <div className=" text-center sm:text-left">
            <h3 className="text-lg font-medium text-gray-900">
              Page Content
            </h3>
            <p className="text-gray-600 text-sm">
              Easily manage and customize the sections displayed on your page.
            </p>
          </div>
        </div>  
        <div className="py-2 text-gray-900">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {!pagesData?.length ? (
                <p>No page content found.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 p-1 md:p-2 lg:p-3">
                    {renderPagesList(
                      pagesData.filter((item) => !item.isCustomPage)
                    )}
                  </div>
                      {!loading && (
                        <div className="flex sm:justify-between justify-center items-center w-full space-x-4 flex-wrap gap-2">
                          <Button
                            onClick={handleDone}
                            type="Primary"
                            label="Save"
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                            className="ml-auto"
                          />
                        </div>
                      )}
                      <hr className="my-5"/>
                      {!loading && (
                        <div className="flex justify-end items-center w-full space-x-4 flex-wrap gap-2">
                          <Button
                            onClick={() => {
                              setEditData(null);
                              if (!editData) {
                                setIsOpenAddPageModal((prev) => !prev);
                              }
                            }}
                            icon={PlusCircle}
                            type="Primary"
                            label="Add Page"
                          />
                        </div>
                      )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 ">
                    {renderPagesList(pagesData.filter((item) => item.isCustomPage))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* {!loading && (
          <div className="flex sm:justify-between justify-center items-center w-full space-x-4 mt-12 p-1 md:p-2 lg:p-3 flex-wrap gap-2">
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
            <Button
              onClick={handleDone}
              type="Primary"
              label="Done"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="ml-auto"
            />
          </div>
        )} */}

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
      </div>
    </div>
  );
};

export default MyPageContent;
