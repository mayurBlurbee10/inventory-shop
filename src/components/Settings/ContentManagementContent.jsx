import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const ContentManagementContent = () => {
  const params = useParams();
  const [content, setContent] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newContent, setNewContent] = useState({
    title: "",
    type: "",
    value: "",
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
  }, []);

  const fetchContentType = async () => {
    const typesRequest = await fetchWrapper(
      `/api/contentManagement/type?portalId=${params.portalid ?? "default"}`,
      { method: "GET" },
      "fetchContentType"
    );
    if (!typesRequest.ok) throw new Error("Failed to fetch Content type");
    const typesData = await typesRequest.json();
    setContentTypes(typesData);
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
      const content = data.filter((item) => item.value !== null);
      setContent(content);
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

      console.log("newContent : ", newContent);

      const requestOptions = {
        method: isEditMode ? "PUT" : "POST",
        body: JSON.stringify(
          imageUrl
            ? {
                ...newContent,
                value: imageUrl,
                portalId: params.portalid ?? "default",
              }
            : { ...newContent, portalId: params.portalid ?? "default" }
        ),
      };

      const apiType = isEditMode
        ? "updateContentManagement"
        : "addContentManagement";

      const response = await fetchWrapper(
        `/api/contentManagement`,
        requestOptions,
        apiType
      );

      if (!response.ok) throw new Error(response.error);

      fetchData();
      handleModalClose();
    } catch (error) {
      console.error("Error adding content:", error);
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalOpenForEdit = (contentId) => {
    const contentToEdit = content.find((item) => item.id === contentId);
    setNewContent(contentToEdit);
    setIsEditMode(true);
    setIsDialogOpen(true);
    setFile(null);
    if (contentToEdit.type == "Image") {
      setPreviewUrl(contentToEdit.value || "");
    }
  };

  const handleModalClose = () => {
    setNewContent({
      title: "",
      type: "",
      value: "",
    });
    setIsEditMode(false);
    setIsDialogOpen(false);
    setError("");
    setPreviewUrl("");
    setFile(null);
  };

  const handleTitleChange = (e) => {
    const selectedTitle = e.target.value;
    if (selectedTitle === "add-new") {
      setIsNewTitleDialogOpen(true);
      setNewContent((prev) => ({
        ...prev,
        title: "",
        type: "",
      }));
    } else {
      const selectedType =
        contentTypes.find((type) => type.title === selectedTitle)?.type || "";
      setNewContent((prev) => ({
        ...prev,
        title: selectedTitle,
        type: selectedType,
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
    } catch (error) {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Content Management
        </h3>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => setIsDialogOpen(true)}
        >
          Add Content
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {content.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-4 bg-white">
              <div className="flex justify-between items-start">
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
                  className="text-blue-600 hover:text-blue-900"
                  onClick={() => handleModalOpenForEdit(item.id)}
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Dialog Box */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-gray-800 font-semibold">
                Add Content
              </h2>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAddEditContent}>
              <div className="mb-4">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <select
                  id="title"
                  name="title"
                  value={newContent.title}
                  onChange={handleTitleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                >
                  <option value="" disabled>
                    Select a Content Title
                  </option>
                  {contentTypes.map((type) => (
                    <option key={type.id} value={type.title}>
                      {type.title}
                    </option>
                  ))}
                  {/* <option value="add-new">+ Add New</option> */}
                </select>
              </div>
              {/* <div className="mb-4">
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700"
                >
                  Type
                </label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  value={newContent.type}
                  readOnly
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 text-gray-500"
                />
              </div> */}
              {newContent.type === "Text" && (
                <div className="mb-4">
                  <label
                    htmlFor="value"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Content
                  </label>
                  <textarea
                    id="value"
                    name="value"
                    value={newContent.value}
                    onChange={handleValueChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                  />
                </div>
              )}
              {newContent.type === "Image" && (
                <div className="mb-4">
                  <label
                    htmlFor="value"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Upload Image
                  </label>
                  <input
                    type="file"
                    id="value"
                    name="value"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              )}
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="Logo preview"
                    className="h-20 w-20 object-contain rounded border"
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleModalClose} // Close the dialog
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {isSubmitting
                    ? isEditMode
                      ? "Updating..."
                      : "Adding..."
                    : isEditMode
                    ? "Update"
                    : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
              <button
                onClick={handleNewTitleModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewTitle}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add Title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManagementContent;
