"use client";

import React, { useEffect, useState } from "react";
import {
  PlusCircle,
  Workflow,
  Fingerprint,
  Code,
  Trash2,
  Edit,
  File,
} from "lucide-react";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import {
  CreatePluginModal,
  UpdatePluginModal,
} from "../Plugins/CreatePluginModal";
import { useParams } from "next/navigation";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import { PluginType } from "@/config/constants";
import { useDispatch, useSelector } from "react-redux";
import { setPages } from "@/store/services/pageService";
import AllTaskModal from "../Common/AllTaskModal";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppTooltip } from "@/components/ui/tooltip";

const options = [
  {
    key: "t&c",
    label: "Terms and Conditions",
    value: PluginType.TNC,
  },
];

const placeholderWidgets = [
  {
    name: "Workflow Builder",
    description: "Create and manage custom workflows",
    icon: Workflow,
    status: "Ready",
  },
  {
    name: "Signature Integration",
    description: "Add digital signature capabilities",
    icon: Fingerprint,
    status: "Beta",
  },
  {
    name: "Custom API",
    description: "Configure custom API endpoints",
    icon: Code,
    status: "Ready",
  },
];

const formatPluginTitle = (type) =>
  type === PluginType.TNC
    ? type.toUpperCase()
    : type.charAt(0).toUpperCase() + type.slice(1);

const CardActionLinks = () => (
  <div className="mt-4 flex gap-2">
    <Button
      type="button"
      variant="link"
      className="h-auto p-0 text-secondary-foreground"
    >
      Configure
    </Button>
    <Button
      type="button"
      variant="link"
      className="h-auto p-0 text-muted-foreground"
    >
      Documentation
    </Button>
  </div>
);

const ProductsContent = () => {
  const params = useParams();
  const [isOpenCreatePlugin, setIsOpenCreatePlugin] = useState(false);
  const [isOpenUpdatePlugin, setIsOpenUpdatePlugin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plugins, setPlugins] = useState(null);
  const [pluginEdit, setPluginEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pluginSelected, setPluginSelected] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pluginOptions, setPluginOptions] = useState(options);
  const [pagesData, setPagesData] = useState([]);
  const [isUpdateLoading, setIsUpdateLoading] = useState(null);
  const [isAllTaskModalOpen, setIsAllTaskModalOpen] = useState(false);
  const [defaultPageAlert, setDefaultPageAlert] = useState(false);
  const { data: allPages } = useSelector((state) => state.pages);
  const dispatch = useDispatch();

  const fetchPlugins = async () => {
    try {
      setLoading(true);
      const response = await fetchWrapper(
        `/api/plugins?portalId=${params?.portalid || "root"}`,
        {},
        "fetch-plugins",
      );
      if (!response.ok) {
        throw new Error("Failed to fetch plugins");
      }
      const data = await response.json();
      const filterTncPlugin = data.data.filter(
        (item) => item.type !== PluginType.PAGES,
      );
      console.log('filterTncPlugin', filterTncPlugin);
      setPlugins(filterTncPlugin);

      const filterPagePlugin = data.data
        .find((item) => item.type === PluginType.PAGES)
        .pages.filter((item) => !item.isCustomPage);

      dispatch(
        setPages(data.data.find((item) => item.type === PluginType.PAGES).pages),
      );

      setPagesData(filterPagePlugin);
      setPluginOptions((prevOptions) =>
        prevOptions.filter(
          (option) => !data.data.some((plugin) => plugin?.type === option.key),
        ),
      );
    } catch (error) {
      console.error("Error fetching plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePageStatus = async (pageId, pageStatus) => {
    try {
      setDefaultPageAlert(false);
      setIsUpdateLoading(pageId);
      setPagesData((prevPages) =>
        prevPages.map((p) =>
          p.id === pageId ? { ...p, isPageVisible: pageStatus } : p,
        ),
      );
      const response = await fetchWrapper(
        `/api/pages/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: pageId, isPageVisible: pageStatus }),
        },
        "update-page",
      );
      if (!response.ok) {
        throw new Error("Failed to update page");
      }
      dispatch(
        setPages(
          allPages.map((p) =>
            p.id === pageId ? { ...p, isPageVisible: pageStatus } : p,
          ),
        ),
      );
    } catch (error) {
      console.error("Error fetching plugins:", error);
      setPagesData((prevPages) =>
        prevPages.map((p) =>
          p.id === pageId ? { ...p, isPageVisible: !pageStatus } : p,
        ),
      );
    } finally {
      setIsUpdateLoading(null);
    }
  };

  const handleDeletePlugin = async (plugin) => {
    try {
      setDeleteLoading(true);

      const response = await fetchWrapper(
        "/api/plugins",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: plugin.id }),
        },
        "delete-page",
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete page");
      }
      setPluginOptions((prev) => [
        ...prev,
        ...options.filter((opt) => opt.key === plugin?.type),
      ]);
      setIsDeleteModalOpen(false);
      setPluginSelected(null);
      fetchPlugins();
      toast.success("Plugin deleted successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const isDefaultPageVisible = (toggleToPage) => {
    if (toggleToPage?.title === "dashboard") {
      const sharedDocsPage = pagesData.find(
        (item) => item?.title === "shared-docs",
      );
      if (!sharedDocsPage?.isPageVisible) {
        setDefaultPageAlert(true);
        return false;
      }
    } else if (toggleToPage?.title === "shared-docs") {
      const documentsPage = pagesData.find(
        (item) => item?.title === "dashboard",
      );
      if (!documentsPage?.isPageVisible) {
        setDefaultPageAlert(true);
        return false;
      }
    }
    return true;
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-medium text-foreground">
            Workflow Widgets
          </h3>
          <p className="text-sm text-muted-foreground">
            Easily manage and customize the workflow widgets on your application.
          </p>
        </div>
        {pluginOptions && pluginOptions.length > 0 && (
          <Button
            onClick={() => setIsOpenCreatePlugin((prev) => !prev)}
            className="px-3 py-3"
          >
            <PlusCircle className="h-4 w-4" />
            Add Widget
          </Button>
        )}
      </div>

      {loading || !pagesData?.length ? (
        <div className="flex justify-center py-8">
          <LoaderSpinner size={28} className="text-secondary-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 p-1 sm:grid-cols-2 md:p-2 lg:grid-cols-3 lg:p-3">
            {placeholderWidgets.map((widget) => {
              const Icon = widget.icon;
              return (
                <Card
                  key={widget.name}
                  className="pointer-events-none select-none bg-muted/50 opacity-50 shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className="h-6 w-6 text-secondary-foreground" />
                        <div>
                          <h4 className="text-lg font-medium text-muted-foreground">
                            {widget.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {widget.description}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          widget.status === "Beta"
                            ? "bg-warning/15 text-warning"
                            : "bg-success/15 text-success"
                        }
                      >
                        {widget.status}
                      </Badge>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <span className="text-sm font-medium text-secondary-foreground">
                        Configure
                      </span>
                      <span className="text-sm font-medium text-muted-foreground">
                        Documentation
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {plugins?.map((plugin) => (
              <Card
                key={plugin.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <File className="h-6 w-6 text-secondary-foreground" />
                      <div>
                        <h4 className="text-lg font-medium text-foreground">
                          {formatPluginTitle(plugin?.type)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Create and manage custom pages
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <AppTooltip label="Edit plugin">
                        <Button
                          type="button"
                          variant="icons"
                          size="icon"
                          className="rounded-full"
                          aria-label="Edit plugin"
                          onClick={() => {
                            setIsOpenUpdatePlugin((prev) => !prev);
                            setPluginEdit(plugin);
                          }}
                        >
                          <Edit className="size-4" />
                        </Button>
                      </AppTooltip>
                      <AppTooltip label="Delete plugin">
                        <Button
                          type="button"
                          variant="icons"
                          size="icon"
                          className="rounded-full text-destructive hover:text-destructive"
                          aria-label="Delete plugin"
                          onClick={() => {
                            setIsDeleteModalOpen((prev) => !prev);
                            setPluginSelected(plugin);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </AppTooltip>
                    </div>
                  </div>
                  <CardActionLinks />
                  {pluginSelected?.id === plugin?.id && (
                    <DeleteConfirmDialog
                      isModalOpen={isDeleteModalOpen}
                      setIsModalOpen={setIsDeleteModalOpen}
                      handleDelete={() => handleDeletePlugin(plugin)}
                      title="Delete Plugin"
                      isLoading={deleteLoading}
                    />
                  )}
                </CardContent>
              </Card>
            ))}

            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <File className="h-6 w-6 text-secondary-foreground" />
                    <div>
                      <h4 className="text-lg font-medium text-foreground">
                        Tasks
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Edit and manage user tasks
                      </p>
                    </div>
                  </div>

                  <AppTooltip label="Edit tasks">
                    <Button
                      type="button"
                      variant="icons"
                      size="icon"
                      className="rounded-full"
                      aria-label="Edit tasks"
                      onClick={() => setIsAllTaskModalOpen((prev) => !prev)}
                    >
                      <Edit className="size-4" />
                    </Button>
                  </AppTooltip>
                </div>
                <CardActionLinks />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 p-1 sm:grid-cols-2 md:p-2 lg:grid-cols-3 lg:p-3">
            {pagesData?.map((page, idx) => {
              if (page?.title.includes("advisor shared-docs")) {
                return null;
              }

              const PageIcon =
                page?.title === "esignature" ? Fingerprint : File;

              return (
                <Card
                  key={page.id || idx}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <PageIcon className="h-6 w-6 shrink-0 text-secondary-foreground" />
                        <div>
                          <h4 className="text-lg font-medium text-foreground">
                            {page?.title.charAt(0).toUpperCase() +
                              page?.title.slice(1)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {page?.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {isUpdateLoading === page?.id && (
                          <LoaderSpinner
                            size={24}
                            className="mr-3 text-secondary-foreground"
                          />
                        )}
                        <ThemeSwitch
                          checked={!!page?.isPageVisible}
                          onCheckedChange={() => {
                            if (isDefaultPageVisible(page)) {
                              handleUpdatePageStatus(
                                page?.id,
                                !page?.isPageVisible,
                              );
                            }
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {defaultPageAlert && (
            <Alert variant="destructive" className="mx-1 border-destructive/30 md:mx-2 lg:mx-4 lg:mt-4">
              <AlertDescription className="text-destructive">
                <span className="font-semibold">Note*:</span> You cannot turn off
                both the Dashboard and Shared Docs pages. At least one page should
                remain enabled.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      <CreatePluginModal
        isOpen={isOpenCreatePlugin}
        onClose={() => setIsOpenCreatePlugin(false)}
        onPluginCreated={fetchPlugins}
        pluginOptions={pluginOptions}
      />
      <UpdatePluginModal
        isOpen={isOpenUpdatePlugin}
        onClose={() => setIsOpenUpdatePlugin(false)}
        plugin={pluginEdit}
      />
      {isAllTaskModalOpen && (
        <AllTaskModal
          isOpen={isAllTaskModalOpen}
          onClose={() => setIsAllTaskModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductsContent;
