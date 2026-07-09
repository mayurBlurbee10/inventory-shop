"use client";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { PluginType } from "@/config/constants";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import AddPageModal from "../Plugins/AddPageModal";
import { toast } from "react-toastify";
import { getUserData } from "@/lib/auth";
import { useDispatch, useSelector } from "react-redux";
import { setPages } from "@/store/services/pageService";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { cn } from "@/app/lib/utils";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const MyPageContent = () => {
  const params = useParams();
  const [isOpenAddPageModal, setIsOpenAddPageModal] = useState(false);
  const [editData, setEditData] = useState(null);
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
  const [isUserPageSubmitting, setIsUserPageSubmitting] = useState(false);
  const [plugin, setPlugin] = useState(null);
  const hasFetched = useRef(false);

  const { data: user } = useSelector((state) => state.user);
  const { data: pages } = useSelector((state) => state.pages);
  const [pagesData, setPagesData] = useState(pages);
  const dispatch = useDispatch();
  const [isUserData, setIsUserData] = useState("");

  useEffect(() => {
    const userData = getUserData();
    setIsUserData(userData?.isOnboardingRequired);
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
        `/api/plugins?portalId=${params?.portalid || "root"}&type=${encodedType}`,
        {},
        "fetch-plugins",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();
      const existingPagesData = data?.data[0]?.pages || [];

      setPlugin(data.data[0]);
      dispatch(setPages(existingPagesData));
      setPagesData(existingPagesData);
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async (state) => {
    try {
      if (state === "Advisor") {
        setIsSubmitting(true);
      } else {
        setIsUserPageSubmitting(true);
      }
      const pageIds = pages.map((item) => item.id);
      const pluginPayload = {
        type: PluginType.PAGES,
        portalId: params.portalid || "root",
        pageId: pageIds,
        existingPages: pagesData,
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
        throw new Error(pluginErrorData.error || "Failed to update plugin");
      }

      await fetchPlugin();
      toast.success("Plugin updated successfully");
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setIsSubmitting(false);
      setIsUserPageSubmitting(false);
    }
  };

  const fetchExistingPages = async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    try {
      setLoading(true);
      const pluginResponse = await fetchWrapper(
        `/api/plugins?portalId=${params.portalid || "root"}&&type=${PluginType.PAGES}`,
        {
          method: "GET",
        },
        "fetch-plugin",
      );

      if (!pluginResponse.ok) {
        return;
      }

      const savedPluginData = await pluginResponse.json();

      await fetchWrapper(
        "/api/pages/bulk",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            portalId: params.portalid || "root",
            pluginId: savedPluginData?.data?.id,
          }),
        },
        "fetch-page",
      );

      await fetchPlugin();
    } catch (error) {
      toast.error(error.message);
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

  const renderPagesList = (pagesList, showItem) => {
    return pagesList?.map((page, index) => (
      <React.Fragment key={page?.id}>
        {((page?.visibility?.length > 0) || page?.isCustomPage) && (
          <Card
            className={cn(
              "transition-shadow hover:shadow-md",
              showItem === "pages" ? "" : "h-full",
            )}
            key={index}
          >
            <CardContent
              className={cn(
                "p-4",
                showItem === "pages"
                  ? "flex items-center justify-between gap-2"
                  : "flex flex-col",
              )}
            >
              <h3 className="font-lato text-lg font-semibold text-foreground">
                {page?.title?.charAt(0).toUpperCase() + page?.title?.slice(1)}
              </h3>

              {showItem === "pages" && page?.isCustomPage && (
                <>
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      type="button"
                      variant="icons"
                      size="icon"
                      className="rounded-full"
                      onClick={() => {
                        if (editData) {
                          setEditData(null);
                        }
                        setEditData(page);
                        setIsOpenAddPageModal(true);
                      }}
                      title="Edit page"
                    >
                      <Edit className="size-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="icons"
                      size="icon"
                      className="rounded-full text-destructive hover:text-destructive"
                      onClick={() => {
                        setIsDeleteModalOpen((prev) => !prev);
                        setPageSelected(page);
                      }}
                      title="Delete page"
                    >
                      <Trash2 className="size-5" />
                    </Button>
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

              {showItem === "sections" && page?.visibility && (
                <div className="flex flex-col divide-y divide-border">
                  {page.visibility.map((section, idx) => (
                    <div
                      key={idx}
                      className="my-1 flex items-center justify-between px-2 py-2"
                    >
                      <span className="text-sm text-foreground">
                        {section?.label}
                      </span>
                      <ThemeSwitch
                        checked={!!section?.visible}
                        onCheckedChange={() =>
                          setPagesData((prevPages) =>
                            prevPages.map((p) =>
                              p.id === page.id
                                ? {
                                    ...p,
                                    visibility: p.visibility.map((sec, secIdx) =>
                                      secIdx === idx
                                        ? { ...sec, visible: !sec.visible }
                                        : sec,
                                    ),
                                  }
                                : p,
                            ),
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </React.Fragment>
    ));
  };

  return (
    <Card className="overflow-y-auto shadow-none md:shadow-sm">
      <CardContent className="relative flex w-full flex-col md:p-3 lg:p-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoaderSpinner size={28} className="text-secondary-foreground" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-medium text-foreground">
                  User Page Content
                </h3>
                <p className="text-sm text-muted-foreground">
                  Easily manage and customize the sections displayed on your page.
                </p>
              </div>
            </div>

            <div className="py-2 text-foreground">
              <div className="grid grid-cols-1 gap-3 p-1 md:grid-cols-2 md:p-2 lg:grid-cols-3 lg:gap-5 lg:p-3">
                {renderPagesList(
                  pagesData.filter(
                    (item) =>
                      item.visibility.length > 0 &&
                      !item.title.includes("advisor"),
                  ),
                  "sections",
                )}
              </div>
              {!loading && (
                <div className="flex w-full flex-wrap items-center justify-center gap-2 space-x-4 sm:justify-between">
                  <Button
                    onClick={handleDone}
                    disabled={isUserPageSubmitting}
                    className="ml-auto px-3 py-3"
                  >
                    {isUserPageSubmitting ? (
                      <LoaderSpinner size={18} className="text-primary-foreground" />
                    ) : null}
                    Save
                  </Button>
                </div>
              )}
              <Separator className="my-5" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-medium text-foreground">
                  Advisor Page Content
                </h3>
                <p className="text-sm text-muted-foreground">
                  Easily manage and customize the sections displayed on your page.
                </p>
              </div>
            </div>

            <div className="py-2 text-foreground">
              <div className="grid grid-cols-1 gap-3 p-1 md:grid-cols-2 md:p-2 lg:grid-cols-3 lg:gap-5 lg:p-3">
                {renderPagesList(
                  pagesData.filter(
                    (item) =>
                      item.visibility.length > 0 &&
                      item.title.includes("advisor"),
                  ),
                  "sections",
                )}
              </div>
              {!loading && (
                <div className="flex w-full flex-wrap items-center justify-center gap-2 space-x-4 sm:justify-between">
                  <Button
                    onClick={() => handleDone("Advisor")}
                    disabled={isSubmitting}
                    className="ml-auto px-3 py-3"
                  >
                    {isSubmitting ? (
                      <LoaderSpinner size={18} className="text-primary-foreground" />
                    ) : null}
                    Save
                  </Button>
                </div>
              )}
              <Separator className="my-5" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pb-5 sm:justify-between">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-medium text-foreground">
                  Custom Pages
                </h3>
                <p className="text-sm text-muted-foreground">
                  Easily create and view custom pages tailored to your needs.
                </p>
              </div>
              <Button
                onClick={() => {
                  setEditData(null);
                  if (!editData) {
                    setIsOpenAddPageModal((prev) => !prev);
                  }
                }}
                className="px-3 py-3"
              >
                <PlusCircle className="h-4 w-4" />
                Add Page
              </Button>
            </div>

            <div className="py-2 text-foreground">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {renderPagesList(
                  pagesData.filter((item) => item.isCustomPage),
                  "pages",
                )}
              </div>
            </div>
          </>
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
      </CardContent>
    </Card>
  );
};

export default MyPageContent;
