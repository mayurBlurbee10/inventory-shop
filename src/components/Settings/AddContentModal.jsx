import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { PlusCircle, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Home,
  User,
  Settings,
  Bell,
  Heart,
  Star,
  Camera,
  Music,
  Cloud,
  Sun
} from "lucide-react";
import Button from "../Common/Elements/Button";
import { useDispatch, useSelector } from "react-redux";
import { setPortal } from "@/store/services/portalService";
import { coverPhotoRatio, fontSizeOptions, fontSizes, fontWeightOptions, logoSizeRatio } from "@/app/lib/data/font_size";
import { setContent } from "@/store/services/contentService";

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
  setIsContentAdded,
  from=""
}) => {
  const params = useParams();
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: config } = useSelector((state) => state.portal);
  const dispatch = useDispatch();

  // Handle form submission
  const handleAddEditContent = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    if (((newContent?.type !== "Image" && newContent?.type !== "Links" && newContent?.title !== "Header Text") && !newContent?.value?.trim()) || (newContent?.type === "Links" && (linkFields.length > 0 &&
      linkFields[linkFields.length - 1].label === "" ||
      linkFields[linkFields.length - 1].link === ""))) {
      handleModalClose();
      return;
    }

    try {
      let imageUrl = "";

      // Handle file upload if it exists
      if (file && previewUrl) {
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
            value: imageUrl,
            fontSize: newContent.fontSize || "medium", // Add fontSize here
            portalId: params.portalid ?? "default",
          }
        : newContent.type === "Links"
        ? {
            ...newContent,
            value: JSON.stringify(linkFields),
            fontSize: "14px", // Add fontSize here
            portalId: params.portalid ?? "default",
          }
        : {
            ...newContent,
            value: newContent.value || " ",
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
        ? "edit-content"
        : "add-content";

      const response = await fetchWrapper(
        `/api/contentManagement`,
        requestOptions,
        apiType
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Content length is too long");
      }

      if(imageUrl && newContent?.title === "Logo"){
        const portalData = {
          ...config,
          logo: imageUrl,
          // primaryColor: selectedTheme.primaryColor,
          // secondaryColor: selectedTheme.secondaryColor,
          // accentColor: selectedTheme.accentColor,
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
      }

      // Refresh data and close the modal
      await fetchData();
      dispatch(setContent(params?.portalid));
      
      setIsContentAdded && setIsContentAdded(true)
      
        handleModalClose();
        setIsSubmitting(false);
        toast.success(
          `${apiType === "edit-content"
            ? "Content updated successfully"
            : "Content added successfully"
          }`
        );
    } catch (error) {
      toast.error(error.message);
      console.error("Error adding content:", error);
      setError(error.message || "An unexpected error occurred");
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
        fontSize: "",
      }));
    } else {
      const selectedType =
        contentTypes.find((type) => type.title === selectedTitle)?.type || "";
      const fontSize = fontSizes.find((item) => item.key === selectedTitle)
      setNewContent((prev) => ({
        ...prev,
        title: selectedTitle,
        type: selectedType,
        fontSize: fontSize ? fontSize.size : "",
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
    if (linkFields.length !== 1) {
      const updatedLinks = linkFields.filter((_, idx) => idx !== index);
      setLinkFields(updatedLinks);
    }
  };

  const handleAddLinkField = () => {
    if (
      linkFields.length > 0 &&
      linkFields[linkFields.length - 1].label != "" &&
      linkFields[linkFields.length - 1].link != ""
    ) {
      setLinkFields([...linkFields, { label: "", link: "" }]);
    }else if(linkFields.length === 0){
      setLinkFields([...linkFields, { label: "", link: "" }]);
    }
  };

  const handleModalClose = () => {
    setNewContent({
      title: "",
      type: "",
      value: "",
      fontSize: "",
    });
    setLinkFields([{ label: "", link: "" }]);
    setIsEditMode(false);
    setIsDialogOpen(false);
    setError("");
    setPreviewUrl("");
    setFile(null);
    setContentTypes(originalContentTypes);
  };

  const isValidJSON = (str) => {
    try {
      JSON.parse(str);
      return true; // It's valid JSON
    } catch (error) {
      return false; // It's not valid JSON
    }
  };

  useEffect(() => {
    const filteredValue = newContent.value;
      if (isValidJSON(filteredValue)) {
        const parsedLinks = filteredValue ? JSON.parse(filteredValue) : null;
        setLinkFields(Array.isArray(parsedLinks) ? parsedLinks : filteredValue);
      }
  }, [])

  console.log("newContent", newContent)

  const iconOptions = [
    { name: "Home", component: Home },
    { name: "User", component: User },
    { name: "Settings", component: Settings },
    { name: "Bell", component: Bell },
    { name: "Heart", component: Heart },
    { name: "Star", component: Star },
    { name: "Camera", component: Camera },
    { name: "Music", component: Music },
    { name: "Cloud", component: Cloud },
    { name: "Sun", component: Sun }
  ];

  const LogoImage = () => {
    const baseSize = 100; // Set a base height
  
    const fontSizeKey = newContent?.fontSize || "medium"

    const sizeInfo = coverPhotoRatio[fontSizeKey];
    const { scale, width, height } = sizeInfo;
  
    return (
      <div className="flex items-center gap-5">
        <div className="relative inline-block text-black">
          {newContent.title === 'CoverPhoto' && (
            <div
              className="absolute top-0 right-0 p-1 bg-white/10 rounded-full cursor-pointer shadow-md hover:bg-gray-100 z-10"
              onClick={() => {
                setPreviewUrl("");
                if (fileInputRef.current) {
                  fileInputRef.current.value = null;
                }
                setNewContent((prev) => ({
                  ...prev,
                  value: ""
                }))
              }}
            >
              <X size={16} />
            </div>
          )}
          <img
            src={previewUrl ? previewUrl : config?.logo}
            alt="Logo preview"
            className="object-contain rounded border"
            style={{
              height: `${baseSize * scale}px`,
              width: "auto",
              maxWidth: "100%",
            }}
          />
        </div>
        {newContent.title === 'CoverPhoto' && (
          <p className="text-xs text-center text-gray-500 mt-1">
            {fontSizeKey.charAt(0).toUpperCase() + fontSizeKey.slice(1)} – {width}x{height}px
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50"
      style={{ margin: 0 }}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl text-gray-800 font-semibold">
            {`${isEditMode ? "Edit" : "Add"} Content`}{" "}
          </h2>
          <button
            onClick={handleModalClose}
            className="text-gray-600 hover:bg-gray-100 p-1 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleAddEditContent} className="p-6">
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
              disabled={isEditMode || from === "onboarding"}
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
          {newContent?.type !== "Links" && newContent?.type !== "Icons" && (
            <div className="flex items-center gap-5">
              {newContent.title !== "Title" &&
                !newContent?.title.includes("Card") &&
                fontSizeOptions[newContent?.type] && (
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
                      value={newContent?.theme?.fontSize} // Default value
                      onChange={(e) =>
                        setNewContent((prev) => ({
                          ...prev,
                          fontSize: e.target.value, // Add font size only for Logo
                          theme: {
                            ...prev.theme,
                            fontSize: e.target.value,
                          },
                        }))
                      }
                      required
                    >
                      {(fontSizeOptions[newContent?.type] || []).map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              {newContent?.title.includes("Card") &&
                fontSizeOptions["Card"] !== null && (
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
                      value={newContent?.theme?.fontSize} // Default value
                      onChange={(e) =>
                        setNewContent((prev) => ({
                          ...prev,
                          fontSize: e.target.value,
                          theme: {
                            ...prev.theme,
                            fontSize: e.target.value,
                          },
                        }))
                      }
                      required
                    >
                      {fontSizeOptions["Card"].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              {newContent.title === "Title" && (
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
                    value={newContent?.theme?.fontSize} // Default value
                    onChange={(e) =>
                      setNewContent((prev) => ({
                        ...prev,
                        fontSize: e.target.value,
                        theme: {
                          ...prev.theme,
                          fontSize: e.target.value,
                        },
                      }))
                    }
                    required
                  >
                    {fontSizeOptions["Header"].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {newContent?.type === "Text" && (
                <>
                  <div className="mb-4">
                    <label
                      htmlFor="fontWeight"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Font Weight
                    </label>
                    <select
                      id="fontWeight"
                      name="fontWeight"
                      className="mt-1 block w-[100px] border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                      value={newContent?.theme?.fontWeight} // Default value
                      onChange={(e) =>
                        setNewContent((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            fontWeight: e.target.value,
                          },
                        }))
                      }
                      required
                    >
                      {fontWeightOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label
                      htmlFor="fontColor"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Font Color
                    </label>
                    <input
                      type="color"
                      id="fontColor"
                      name="fontColor"
                      className="mt-1 block w-[150px] h-[40px] border border-gray-300 bg-transparent rounded-md shadow-sm px-1"
                      value={newContent?.theme?.color || '#000000'} // Default to black if undefined
                      onChange={(e) =>
                        setNewContent((prev) => ({
                          ...prev,
                          theme: {
                            ...prev.theme,
                            color: e.target.value,
                          },
                        }))
                      }
                      required
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Icons */}
          {newContent.type === "Icons" && (
            <div className="mb-4">
              <label
                htmlFor="iconSelect"
                className="block text-sm font-medium text-gray-700"
              >
                Select Icon
              </label>
              <select
                id="iconSelect"
                name="iconSelect"
                className="mt-1 block w-[200px] border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
                value={newContent?.value}
                onChange={(e) =>
                  setNewContent((prev) => ({ ...prev, value: e.target.value }))
                }
              >
                <option value="" disabled>
                  Select Icon
                </option>
                {iconOptions.map((icon) => (
                  <option key={icon.name} value={icon.name}>
                    {icon.name}
                  </option>
                ))}
              </select>

              {/* Display selected icon */}
              {iconOptions.find((icon) => icon.name === newContent?.value)
                ?.component && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-gray-600">Selected Icon:</span>
                  {React.createElement(
                    iconOptions.find((icon) => icon.name === newContent?.value)
                      .component,
                    { className: "w-6 h-6 text-gray-700" }
                  )}
                </div>
              )}
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
                required={newContent.title !== "Header Text"}
                className="mt-1 block w-full min-h-[150px] border border-gray-300 rounded-md shadow-sm p-2 text-gray-500"
              />
            </div>
          )}
          {/* Image */}
          {newContent.type === "Image" && (
            <div className="">
              {newContent.title === 'CoverPhoto' && (
                <div className="p-4 bg-gray-50 border rounded-xl text-gray-700 text-sm mb-4">
                  <div className="text-center text-xs text-gray-500 mb-2">
                    <span className="block">
                      <strong>Minimum Size:</strong> {`${coverPhotoRatio.small.width}x${coverPhotoRatio.small.height}px`}
                    </span>
                    <span className="block">
                      <strong>Aspect Ratio:</strong> 9:4
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white rounded-lg shadow-sm py-2 px-3">
                      <p className="font-medium">Small</p>
                      <p>{`${coverPhotoRatio.small.width} x ${coverPhotoRatio.small.height}px`}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm py-2 px-3">
                      <p className="font-medium">Medium</p>
                      <p>{`${coverPhotoRatio.medium.width} x ${coverPhotoRatio.medium.height}px`}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm py-2 px-3">
                      <p className="font-medium">Large</p>
                      <p>{`${coverPhotoRatio.large.width} x ${coverPhotoRatio.large.height}px`}</p>
                    </div>
                  </div>
                </div>
              )}
               <div className="mb-4">
                <label
                  htmlFor="value"
                  className="block text-sm font-medium text-gray-700"
                >
                  Upload Logo
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="value"
                  name="value"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          )}
          {(previewUrl || (!previewUrl && newContent?.title === 'Logo'))  && <LogoImage />}

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
              {linkFields.length < 8 && (
                <Button
                  type="Secondary"
                  onClick={handleAddLinkField}
                  icon={PlusCircle}
                  label="Add More"
                />
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-2">
            <Button
              type="Secondary"
              onClick={handleModalClose}
              disabled={isSubmitting}
              label="Cancel"
            />

            <Button
              buttonType="submit"
              type="Primary"
              disabled={
                isSubmitting ||
                (newContent?.type !== "Image" &&
                  newContent?.type !== "Links" &&
                  newContent?.title !== "Header Text" &&
                  !newContent?.value?.trim()) ||
                (newContent?.type === "Links" &&
                  ((linkFields.length > 0 &&
                    linkFields[linkFields.length - 1].label === "") ||
                    linkFields[linkFields.length - 1].link === "")) ||
                (newContent?.title === "CoverPhoto" && (!isEditMode && !file)) ||
                (newContent?.title === "Logo" && (!newContent.value))
              }
              // label={isEditMode ? "Save" : "Add"}
              label={"Save"}
              isLoading={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContentModal;
