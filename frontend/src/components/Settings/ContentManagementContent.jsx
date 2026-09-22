"use client";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { Pencil, Trash2, Edit, PlusCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useParams, useRouter, usePathname } from "next/navigation";
import AddContentModal from "./AddContentModal";
import { useDispatch, useSelector } from "react-redux";
import { setPortal } from "@/store/services/portalService";
import { getUserData } from "@/lib/auth";
import { fontSizes } from "@/app/lib/data/font_size";
import EditHeadingModal from "../Common/EditHeadingModal";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import { setContent as setReduxContent } from "@/store/services/contentService";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppTooltip } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ContentManagementContent = ({
  isAddRequired,
  isManageRequired,
  onContentLengthChange,
  setContentOnboard,
  onboardingStatus,
  isContentAdded,
  setIsContentAdded,
  colors,
  setColors
}) => {
  const params = useParams();
  const [content, setContent] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [originalContentTypes, setOriginalContentTypes] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newContent, setNewContent] = useState({
    title: "",
    type: "",
    value: "",
    fontSize: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [titleError, setTitleError] = useState("");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isNewTitleDialogOpen, setIsNewTitleDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkFields, setLinkFields] = useState([{ label: "", link: "" }]);
  const [contentLength, setContentLength] = useState("");
  const pathname = usePathname();
  const onBoarding = pathname.includes("/onboarding");
  const { data: config } = useSelector((state) => state.portal);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isLoadingRemoveContent, setIsLoadingRemoveContent] = useState(false);
  const { data: contentData } = useSelector((state) => state.content);

  const dispatch = useDispatch();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    fetchData();
    fetchContentType();
  }, [params.portalid]);

  useEffect(() => {
    if (onContentLengthChange) {
      onContentLengthChange(content.length);
    }
  }, [content]);

  useEffect(() => {
    if (isContentAdded) {
      fetchData();
      setIsContentAdded(false);
    }
  }, [isContentAdded]);

  const fetchContentType = async () => {
    const typesRequest = await fetchWrapper(
      `/api/contentManagement/type?portalId=${params.portalid || "root"}`,
      { method: "GET" },
      "fetch-content-type"
    );
    if (!typesRequest.ok) throw new Error("Failed to fetch Content type");
    const typesData = await typesRequest.json();
    setContentTypes(typesData);
    setOriginalContentTypes(typesData);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetchWrapper(
        `/api/contentManagement?portalId=${params.portalid || "root"}`,
        { method: "GET" },
        "fetch-content-management"
      );
      if (!response.ok) throw new Error("Failed to fetch Content Management");
      const data = await response.json();
      setContent(data.portalContent);
      setContentLength(data.portalContent.length);
      // console.log('content:' , data.portalContent.length)
      setContentOnboard && setContentOnboard(data.portalContent);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalOpenForEdit = (contentId) => {
    const contentToEdit = content.find((item) => item.id === contentId);
    const fontSize = fontSizes.find((item) => item.key === contentToEdit.title)
    setNewContent({
      ...contentToEdit,
      fontSize: contentToEdit.fontSize || fontSize?.size,
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
    setFile(null);
    if (contentToEdit.type == "Image") {
      setPreviewUrl(contentToEdit.value || "");
    }
    if (contentToEdit.type === "Links") {
      setLinkFields(
        JSON.parse(contentToEdit.value) || [{ label: "", link: "" }]
      );
    }
  };

  const handleAddNewTitle = async () => {
    try {
      const requestOptions = {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          portalId: params.portalid || "root",
        }),
      };
      const response = await fetchWrapper(
        `/api/contentManagement/type`,
        requestOptions,
        "add-content-title"
      );
      const newData = await response.json();
      if (!response.ok) throw new Error(newData.error);
      setContentTypes((prev) => [
        ...prev,
        { id: Date.now().toString(), title: newTitle, type: newType },
      ]);

      setNewContent((prev) => ({
        ...prev,
        title: newTitle,
        type: newType,
      }));
      setNewTitle("");
      setNewType("");
      setIsNewTitleDialogOpen(false);
      toast.success(newData.message);
    } catch (error) {
      toast.error(error.message);
      console.error("Error adding content:", error);
      setTitleError(error.message || "An unexpected error occurred");
    }
  };

  const handleNewTitleModalClose = () => {
    setNewTitle("");
    setNewType("");
    setIsNewTitleDialogOpen(false);
  };

  const addContent = () => {
    const filterTypes = originalContentTypes.filter(
      (ct) => !content.some((c) => c.title === ct.title)
    );
    setContentTypes(filterTypes);
    setIsDialogOpen(true);
  };

  const handleChange = (e) => {
    setColors({
      ...colors,
      [e.target.name]: e.target.value,
    });
  };

  const completeOnboarding = async (id) => {
    const requestOptions = {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    };
    const response = await fetchWrapper(
      `/api/users`,
      requestOptions,
      "change-onboarding"
    );

    if (!response.ok) throw new Error(response.error);
  };

  const handleSave = async () => {
    const userData = getUserData();
    setIsSubmitting(true);
    if (contentLength >= 11) {
      completeOnboarding(userData.id);
    }
    try {
      const portalData = {
        ...config,
        primaryColor: colors.primaryColor,
        secondaryColor: colors.secondaryColor,
        accentColor: colors.accentColor,
      };

      const response = await fetchWrapper(
        "/api/portal",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(portalData),
        },
        "update-portal"
      );

      if (!response.ok) throw new Error("Failed to update portal theme");

      dispatch(setPortal(params.portalid));
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const router = useRouter();
  const manageContentNavigate = () => {
    router.push("onboarding");
  }

  const filterValue = (title) => {
    if (!content) return "";
    const contentItem = contentData.portalContent.find(
      (item) => item.title === title
    );
    const value = contentItem ? contentItem.value : null;
    if (!value) {
      const defaultItem = contentData.defaultContent.find(
        (item) => item.title === title
      );
      return defaultItem ? defaultItem : null;
    }
    // setRemoveContent(true)
    return {
      ...contentItem,
      from: "portalContent"
    };
  };

  const handleRemoveHeading = async () => {
    try {
      setIsLoadingRemoveContent(true)
      const contentToRemove = deleteTarget === "dashboard"
        ? filterValue("Dashboard Heading")
        : filterValue("Shared Docs Heading")
      if (!contentToRemove) {
        toast.error("Content not found to delete");
        return;
      }
      const response = await fetchWrapper("/api/contentManagement", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: contentToRemove.title,
          portalId: params.portalid || "root",
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete content");
      }
      toast.success("Heading removed successfully");
      dispatch(setReduxContent(params.portalid || "root"));
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error("Something went wrong while deleting");
    } finally {
      setIsLoadingRemoveContent(false)
      setDeleteTarget(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-medium text-foreground">Home Page</h3>
            <p className="text-sm text-muted-foreground">
              Organize and edit your home page.
            </p>
          </div>
          {!isManageRequired && contentLength < 14 && (
            <Button onClick={addContent} disabled={loading} className="px-3 py-3">
              <PlusCircle className="h-4 w-4" />
              Add Content
            </Button>
          )}
          {isManageRequired && (
            <Button type="button" variant="default" onClick={manageContentNavigate} className="px-3 py-3">
              Edit Home Page
            </Button>
          )}
        </div>
        {isManageRequired ? (
          <></>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <LoaderSpinner size={32} className="text-secondary-foreground" />
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 gap-6 p-1 md:p-2 lg:p-3 ${onBoarding ? "" : "sm:grid-cols-2 lg:grid-cols-3"
              }`}
          >
            {content.map((item, idx) => (
              <Card
                key={idx}
                className="relative transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="pr-8">
                      <h4 className="text-lg font-medium text-foreground">
                        {item.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Type: {item.type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last Updated: {formatDate(item?.updatedAt)}
                      </p>
                    </div>

                    <AppTooltip label="Edit content">
                      <Button
                        type="button"
                        variant="icons"
                        size="icon"
                        className="absolute right-2 top-2 rounded-full"
                        aria-label="Edit content"
                        onClick={() => handleModalOpenForEdit(item.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </AppTooltip>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Separator />

        <div className="py-2 text-foreground">
          <div className="grid grid-cols-1 gap-3 pt-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            <Card>
              <CardContent className="flex items-center p-4">
                <h3 className="font-lato text-lg font-semibold text-foreground">
                  Dashboard Welcome Note
                </h3>
                <div className="ml-auto flex items-center gap-2">
                  <AppTooltip label="Edit welcome note">
                    <Button
                      type="button"
                      variant="icons"
                      size="icon"
                      className="rounded-full"
                      aria-label="Edit welcome note"
                      onClick={() => setEditTarget("dashboard")}
                    >
                      <Edit className="size-5" />
                    </Button>
                  </AppTooltip>
                  {filterValue("Dashboard Heading")?.from === "portalContent" && (
                    <AppTooltip label="Remove welcome note">
                      <Button
                        type="button"
                        variant="icons"
                        size="icon"
                        className="rounded-full text-destructive hover:text-destructive"
                        aria-label="Remove welcome note"
                        onClick={() => setDeleteTarget("dashboard")}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </AppTooltip>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-4">
                <h3 className="font-lato text-lg font-semibold text-foreground">
                  Shared Docs Welcome Note
                </h3>
                <div className="ml-auto flex items-center gap-2">
                  <AppTooltip label="Edit welcome note">
                    <Button
                      type="button"
                      variant="icons"
                      size="icon"
                      className="rounded-full"
                      aria-label="Edit welcome note"
                      onClick={() => setEditTarget("sharedDocs")}
                    >
                      <Edit className="size-5" />
                    </Button>
                  </AppTooltip>
                  {filterValue("Shared Docs Heading")?.from === "portalContent" && (
                    <AppTooltip label="Remove welcome note">
                      <Button
                        type="button"
                        variant="icons"
                        size="icon"
                        className="rounded-full text-destructive hover:text-destructive"
                        aria-label="Remove welcome note"
                        onClick={() => setDeleteTarget("sharedDocs")}
                      >
                        <Trash2 className="size-5" />
                      </Button>
                    </AppTooltip>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {deleteTarget && (
            <DeleteConfirmDialog
              isModalOpen={true}
              setIsModalOpen={() => setDeleteTarget(null)}
              handleDelete={() =>
                handleRemoveHeading(
                  deleteTarget === "dashboard"
                    ? filterValue("Dashboard Heading")
                    : filterValue("Shared Docs Heading")
                )
              }
              title="Remove Welcome Note"
              content="Confirm to remove the welcome note."
              isLoading={isLoadingRemoveContent}
            />
          )}
        </div>

        {isDialogOpen && (
          <AddContentModal
            contentTypes={contentTypes}
            setContentTypes={setContentTypes}
            originalContentTypes={originalContentTypes}
            setIsDialogOpen={setIsDialogOpen}
            setIsEditMode={setIsEditMode}
            isEditMode={isEditMode}
            setNewContent={setNewContent}
            newContent={newContent}
            fetchData={fetchData}
            file={file}
            setFile={setFile}
            previewUrl={previewUrl}
            setPreviewUrl={setPreviewUrl}
            linkFields={linkFields}
            setLinkFields={setLinkFields}
          />
        )}

        <Dialog
          open={isNewTitleDialogOpen}
          onOpenChange={(open) => {
            if (!open) handleNewTitleModalClose();
          }}
        >
          <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Title</DialogTitle>
            </DialogHeader>

            {titleError && (
              <Alert variant="destructive" className="border-destructive/30">
                <AlertDescription className="text-destructive">
                  {titleError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newTitle" className="text-foreground">
                  New Title
                </Label>
                <Input
                  type="text"
                  id="newTitle"
                  name="newTitle"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="!bg-background"
                  placeholder="Enter new title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newType" className="text-foreground">
                  Type
                </Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger id="newType" className="!bg-background h-11 w-full">
                    <SelectValue placeholder="Select a Title Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Text">Text</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 bg-transparent">
              <Button
                type="button"
                variant="outline"
                onClick={handleNewTitleModalClose}
                className="px-3 py-3"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddNewTitle}
                className="px-3 py-3"
              >
                Add Title
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {editTarget && (
        <EditHeadingModal
          isOpen={true}
          onClose={() => setEditTarget(null)}
          data={
            editTarget === "dashboard"
              ? filterValue("Dashboard Heading")
              : filterValue("Shared Docs Heading")
          }
        />
      )}
    </>
  );
};

export default ContentManagementContent;
