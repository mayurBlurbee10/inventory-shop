import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { X, Pencil, Trash2, Edit } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useParams, useRouter, usePathname } from "next/navigation";
import Button from "../Common/Elements/Button";
import AddContentModal from "./AddContentModal";
import { useDispatch, useSelector } from "react-redux";
import { setPortal } from "@/store/services/portalService";
import { getUserData } from "@/lib/auth";
import { fontSizes } from "@/app/lib/data/font_size";
import EditHeadingModal from "../Common/EditHeadingModal";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import { setContent as setReduxContent } from "@/store/services/contentService";

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
        <div className="flex justify-center sm:justify-between items-center flex-wrap gap-2 ">
          <div className=" text-center sm:text-left">
            <h3 className="text-lg font-medium text-gray-900">
              Home Page
            </h3>
            <p className="text-gray-600 text-sm">
              Organize and edit your home page.
            </p>
          </div>
          {!isManageRequired && contentLength < 14 && (
            <Button
              label="Add Content"
              type="Primary"
              onClick={addContent}
              buttonType="button"
              disabled={loading}
            />
          )}
          {/* {isManageRequired && onboardingStatus && ( */}
          {isManageRequired && (
            <Button
              label="Edit Home Page"
              type="Primary"
              onClick={manageContentNavigate}
              buttonType="button"
            />
          )}
        </div>
        {
          isManageRequired ? <></> : (
            loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div
                className={`grid grid-cols-1 gap-6 p-1 md:p-2 lg:p-3 ${onBoarding ? "" : " sm:grid-cols-2 lg:grid-cols-3"
                  }`}
              >
                {content.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-white relative shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start ">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-500">Type: {item.type}</p>
                        <p className="text-sm text-gray-500">
                          Last Updated: {formatDate(item?.updatedAt)}
                        </p>
                      </div>

                      <button
                        className="text-blue-600 hover:text-blue-900 px-2 absolute top-0 right-0 m-2"
                        onClick={() => handleModalOpenForEdit(item.id)}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )
        }

        <hr />

        <div className="max-w-4xl">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Theme</h2>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 sm:p-6 md:p-8 shadow-lg border border-white/50">
            <div className="flex items-center justify-center gap-4 flex-wrap flex-col sm:flex-row">
              <div className="flex-1 sm:mr-8">
                <label className="block text-base font-medium text-gray-600 mb-4">
                  Theme colour
                </label>
                <div className="space-y-3">
                  <div className="relative w-48 h-12">
                    <div
                      className="absolute w-full h-full rounded-lg shadow-sm cursor-pointer"
                      style={{ backgroundColor: colors?.primaryColor }}
                    ></div>
                    <input
                      type="color"
                      name="primaryColor"
                      value={colors?.primaryColor}
                      onChange={handleChange}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div
                className="w-full sm:w-0.5 h-0.5 sm:h-20"
                style={{ backgroundColor: colors?.primaryColor }}
              ></div>
              <div className="flex-1 sm:mr-8">
                <label className="block text-base font-medium text-gray-600 mb-4">
                  Font colour
                </label>
                <div className="space-y-3">
                  <div className="relative w-48 h-12">
                    <div
                      className="absolute w-full h-full rounded-lg shadow-sm cursor-pointer"
                      style={{ backgroundColor: colors?.secondaryColor }}
                    ></div>
                    <input
                      type="color"
                      name="secondaryColor"
                      value={colors?.secondaryColor}
                      onChange={handleChange}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div
                className="w-full sm:w-0.5 h-0.5 sm:h-20"
                style={{ backgroundColor: colors?.primaryColor }}
              ></div>

              <div className="flex-1 sm:mr-8">
                <label className="block text-base font-medium text-gray-600 mb-4">
                  Hover colour
                </label>
                <div className="space-y-3">
                  <div className="relative w-48 h-12">
                    <div
                      className="absolute w-full h-full rounded-lg shadow-sm cursor-pointer"
                      style={{ backgroundColor: colors?.accentColor }}
                    ></div>
                    <input
                      type="color"
                      name="accentColor"
                      value={colors?.accentColor}
                      onChange={handleChange}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              {onBoarding ? (
                <></>
              ) : (
                <div className="md:ml-8">
                  <Button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    label={"Save"}
                    type="Primary"
                    className="ml-auto"
                    isLoading={isSubmitting}
                  />
                </div>
              )}
            </div>

          </div>
        </div>
        <hr />
        <div className="py-2 text-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 pt-3">
            {/* Dashboard Heading */}
            <div className="pl-3">
              <div className="border flex justify-center items-center p-4 rounded-md">
                <h3 className="font-lato font-semibold text-lg">Dashboard Welcome Note</h3>
                <div className="flex items-center ml-auto gap-2">
                  <button onClick={() => setEditTarget("dashboard")}>
                    <Edit className="size-5 text-blue-700" />
                  </button>
                  {filterValue("Dashboard Heading")?.from === "portalContent" && (
                    <button onClick={() => setDeleteTarget("dashboard")}>
                      <Trash2 className="size-5 text-red-700" />
                    </button>
                  )}
                </div>
              </div>
            </div>


            {/* Shared Docs Heading */}
            <div className="pl-3">
              <div className="border flex justify-center items-center p-4 rounded-md">
                <h3 className="font-lato font-semibold text-lg">Shared Docs Welcome Note</h3>
                <div className="flex items-center ml-auto gap-2">
                  <button onClick={() => setEditTarget("sharedDocs")}>
                    <Edit className="size-5 text-blue-700" />
                  </button>
                  {filterValue("Shared Docs Heading")?.from === "portalContent" && (
                    <button onClick={() => setDeleteTarget("sharedDocs")}>
                      <Trash2 className="size-5 text-red-700" />
                    </button>
                  )}

                </div>
              </div>
            </div>
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
        {/* Dialog Box */}
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
        {isNewTitleDialogOpen && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-gray-800 font-semibold">
                  Add New Title
                </h2>
                <button
                  onClick={handleNewTitleModalClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              {titleError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                  {titleError}
                </div>
              )}
              <div className="mb-4">
                <label
                  htmlFor="newTitle"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Title
                </label>
                <input
                  type="text"
                  id="newTitle"
                  name="newTitle"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                  placeholder="Enter new title"
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="newType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type
                </label>
                <select
                  id="newType"
                  name="newType"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                >
                  <option value="" disabled>
                    Select a Title Type
                  </option>
                  <option value="Text">Text</option>
                  <option value="Image">Image</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  onClick={handleNewTitleModalClose}
                  type="Secondary"
                  label="Cancel"
                />
                <Button
                  onClick={handleAddNewTitle}
                  type="Primary"
                  label="Add Title"
                />
              </div>
            </div>
          </div>
        )}
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
