import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { PlusCircle, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { toast } from "react-toastify";

const AddContentModal = ({
  contentTypes,
  setContentTypes,
  originalContentTypes,
  setIsDialogOpen,
  setIsEditMode,
  isEditMode,
  setNewContent,
  newContent,
  fetchData,
  previewUrl,
  setPreviewUrl,
  file,
  setFile,
  setLinkFields,
  linkFields,
  setIsContentAdded
}) => {
  const params = useParams();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      await fetchData();
      setIsContentAdded && setIsContentAdded(true)
      handleModalClose();

      toast.success(
        `${
          apiType === "updateContentManagement"
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

  const handleTitleChange = (e) => {
    const selectedTitle = e.target.value;
    if (selectedTitle === "add-new") {
      //   setIsNewTitleDialogOpen(true);
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

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
      style={{ margin: 0 }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl text-gray-800 font-semibold">
            {`${isEditMode ? "Update" : "Add"} Content`}{" "}
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
              disabled={isEditMode}
            >
              <option value="" disabled>
                Select a Content Title
              </option>
              {contentTypes.map((type, idx) => (
                <option key={idx} value={type.title}>
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

          {newContent?.title === "Header Text" && (
            <div className="mb-4">
              <label
                htmlFor="fontSize"
                className="block text-sm font-medium text-gray-700"
              >
                Font Size
              </label>
              <select
                id="fontSize"
                name="fontSize"
                className="mt-1 block w-[100px] border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                value={newContent?.fontSize} // Default value
                onChange={(e) =>
                  setNewContent((prev) => ({
                    ...prev,
                    fontSize: e.target.value, // Add font size only for Header Text
                  }))
                }
                required
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="22px">22px</option>
                <option value="24px">24px</option>
                <option value="26px">26px</option>
                <option value="28px">28px</option>
                <option value="30px">30px</option>
                <option value="32px">32px</option>
                <option value="34px">34px</option>
                <option value="36px">36px</option>
              </select>
            </div>
          )}

          {/* Text */}
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
                className="mt-1 block w-full min-h-[150px] border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
              />
            </div>
          )}
          {/* Image */}
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

          {/* Links */}
          {newContent.type === "Links" && (
            <div className="space-y-4">
              {linkFields.map((item, index) => (
                <div key={index} className="flex space-x-2 items-center">
                  <input
                    type="text"
                    placeholder="Label"
                    value={item.label}
                    onChange={(e) =>
                      handleLinkChange(index, "label", e.target.value)
                    }
                    className="p-2 border rounded-md text-gray-700 max-w-[160px]"
                  />
                  <input
                    type="url"
                    placeholder="Link"
                    value={item.link}
                    onChange={(e) =>
                      handleLinkChange(index, "link", e.target.value)
                    }
                    className="p-2 border rounded-md text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLinkField(index)}
                  >
                    <X className="text-red-500 h-5 w-5" />
                  </button>
                </div>
              ))}
              {linkFields.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddLinkField}
                  className="flex items-center text-blue-600"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add More
                </button>
              )}
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
  );
};

export default AddContentModal;
