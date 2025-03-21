import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { PlusCircle, X, Pencil, Trash2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useParams, useRouter , usePathname } from "next/navigation";
import Button from "../Common/Elements/Button";
import AddContentModal from "./AddContentModal";
import { useDispatch, useSelector } from "react-redux";
import { setPortal } from "@/store/services/portalService";
import { getUserData } from "@/lib/auth";

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
    fontSize: "30px",
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
  const pathname= usePathname();
  const onBoarding = pathname.includes("/onboarding");
  const { data: config } = useSelector((state) => state.portal);
  // const [colors, setColors] = useState({
  //   primaryColor : config.primaryColor,
  //   secondaryColor : config.secondaryColor,
  //   accentColor : config.accentColor
  // })

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
      `/api/contentManagement/type?portalId=${params.portalid ?? "default"}`,
      { method: "GET" },
      "fetchContentType"
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
        `/api/contentManagement?portalId=${params.portalid ?? "default"}`,
        { method: "GET" },
        "fetchContentManagement"
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

  // Handle form submission
  const handleAddEditContent = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let imageUrl = "";

      // Handle file upload if it exists
      if (file) {
        const uploadData = new FormData();
        uploadData.append("file", file);

        const uploadResponse = await fetchWrapper(
          "/api/upload",
          {
            method: "POST",
            body: uploadData,
          },
          "content-image"
        );

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo");
        }

        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.url;
      }


      // Construct payload with specific cases for fontSize and links
      const obj = imageUrl
        ? {
            ...newContent,
            fontSize: newContent.fontSize, // Add fontSize here
            portalId: params.portalid ?? "default",
          }
        : newContent.type === "Links"
        ? {
            ...newContent,
            value: JSON.stringify(linkFields),
            fontSize: newContent.fontSize, // Add fontSize here
            portalId: params.portalid ?? "default",
          }
        : {
            ...newContent,
            fontSize: newContent.fontSize, // Add fontSize here
            portalId: params.portalid ?? "default",
          };

      console.log("newContentPayload : ", obj);

      // Make the API request
      const requestOptions = {
        method: isEditMode ? "PUT" : "POST",
        body: JSON.stringify(obj),
      };

      const apiType = isEditMode
        ? "updateContentManagement"
        : "addContentManagement";

      const response = await fetchWrapper(
        `/api/contentManagement`,
        requestOptions,
        apiType
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Content length is too long");
      }

      // Refresh data and close the modal
      fetchData();
      handleModalClose();

      toast.success(
        `${apiType === "updateContentManagement"
            ? "Content updated successfully"
            : "Content added successfully"
        }`
      );
    } catch (error) {
      toast.error(error.message);
      console.error("Error adding content:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleModalOpenForEdit = (contentId) => {
    const contentToEdit = content.find((item) => item.id === contentId);
    setNewContent({
      ...contentToEdit,
      fontSize: contentToEdit.fontSize || "30px",
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

  const handleModalClose = () => {
    setNewContent({
      title: "",
      type: "",
      value: "",
      fontSize: "30px",
    });
    setLinkFields([{ label: "", link: "" }]);
    setIsEditMode(false);
    setIsDialogOpen(false);
    setError("");
    setPreviewUrl("");
    setFile(null);
    setContentTypes(originalContentTypes);
  };

  const handleTitleChange = (e) => {
    const selectedTitle = e.target.value;
    if (selectedTitle === "add-new") {
      setIsNewTitleDialogOpen(true);
      setNewContent((prev) => ({
        ...prev,
        title: "",
        type: "",
        fontSize: "30px",
      }));
    } else {
      const selectedType =
        contentTypes.find((type) => type.title === selectedTitle)?.type || "";
      setNewContent((prev) => ({
        ...prev,
        title: selectedTitle,
        type: selectedType,
        fontSize: newContent.fontSize,
      }));
      setPreviewUrl("");
      setFile(null);
    }
  };

  const handleAddNewTitle = async () => {
    try {
      const requestOptions = {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          portalId: params.portalid || "default",
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

  const handleValueChange = (e) => {
    setNewContent((prev) => ({ ...prev, value: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleLinkChange = (index, field, value) => {
    const updatedLinks = linkFields.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    setLinkFields(updatedLinks);
  };

  const handleRemoveLinkField = (index) => {
    const updatedLinks = linkFields.filter((_, idx) => idx !== index);
    setLinkFields(updatedLinks);
  };

  const handleAddLinkField = () => {
    if (
      linkFields.length < 10 &&
      linkFields[linkFields.length - 1].label != "" &&
      linkFields[linkFields.length - 1].link != ""
    ) {
      setLinkFields([...linkFields, { label: "", link: "" }]);
    }
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
      body: JSON.stringify({ id }),
    };
    const response = await fetchWrapper(
      `/api/users`,
      requestOptions,
      "changeOnboarding"
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
        //  accentColor: colors.accentColor,
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

  return (
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
          buttonType = "button"
          disabled={loading}
          />
        )}
        {/* {isManageRequired && onboardingStatus && ( */}
        {isManageRequired && (
          <Button
          label="Edit Home Page"
          type="Primary"
          onClick={manageContentNavigate}
          buttonType = "button"
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
              className={`grid grid-cols-1 gap-6 p-1 md:p-2 lg:p-3 ${
                onBoarding ? "" : " sm:grid-cols-2 lg:grid-cols-3"
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

      <hr/>

      <div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Set Colors</h3>
          {/* <p className="text-gray-600 text-sm">
            Organize and edit the information displayed across your platform.
          </p> */}
        </div>
        <div className="pt-6 p-1 md:p-2 lg:p-3">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Header Links
                </label>
                <input
                  type="color"
                  name="primaryColor"
                  value={colors?.primaryColor}
                  onChange={handleChange}
                  className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Buttons
                </label>
                <input
                  type="color"
                  name="secondaryColor"
                  value={colors?.secondaryColor}
                  onChange={handleChange}
                  className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300"
                />
              </div>
              {/* <div>
                <label className="block text-sm font-medium text-gray-700">
                  Accent Color
                </label>
                <input
                  type="color"
                  name="accentColor"
                  value={colors?.accentColor}
                  onChange={handleChange}
                  className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300"
                />
              </div> */}
            </div>
          </div>
        </div>
        {onBoarding ? (
          <></>
        ) : (
          <div className="my-5">
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
  );
};

export default ContentManagementContent;
