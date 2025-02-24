"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { Dialog } from "@headlessui/react";
import { useParams } from "next/navigation";
import Button from "../Common/Elements/Button";

const TextEditor = dynamic(() => import("./RTE/TextEditor"), { ssr: false });

function AddPageModal({
  isOpen,
  onClose,
  setPluginData,
  // setPages,
  editData,
  setEditData,
  setOnPageCreated,
  plugin = null,
  setPageCreated = undefined,
  pageType,
}) {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [isOpenCancelConfirm, setIsOpenCancelConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: editData?.title || "",
      description: editData?.description || "",
    },
  });

  useEffect(() => {
    if (editData && editData.description && editData.title) {
      reset({
        title: editData.title,
        description: editData.description,
      });
    } else {
      reset({
        title: "",
        description: "",
      });
    }
  }, [editData, reset]);

  const compareDescription = (existingDescription, currentDescription) => {
    const sanitizeHTML = (html) => {
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent || div.innerText || "";
    };

    // Remove HTML tags and normalize the text
    const sanitizedExistingDescription =
      sanitizeHTML(existingDescription).trim();
    const sanitizedCurrentDescription = sanitizeHTML(currentDescription).trim();

    // Compare the sanitized descriptions
    return sanitizedExistingDescription === sanitizedCurrentDescription;
  };

  const handleSubmitData = async (values) => {
    setLoading(true);
    try {
      const data = {
        title: values.title,
        description: values.description,
      };

      // const response = await fetchWrapper(
      //   "/api/pages",
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify(data),
      //   },
      //   "save-page"
      // );

      // const savedData = await response.json();
      // if (!response.ok) {
      //   throw new Error(savedData.error || "Failed to save page");
      // }

      // toast.success("Page created successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error creating plugin:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = async () => {
    try {
      setLoading(true);

      const title = getValues("title");
      const description = getValues("description");

      if (!title || !description) {
        toast.error("Both title and description are required.");
        return;
      }

      const payload = {
        title,
        description,
        plugin: plugin?.id,
        portalId: params.portalid,
      };

      const isEditMode = !!editData;
      const method = isEditMode ? "PUT" : "POST";
      const url = "/api/pages";

      if (isEditMode) payload.id = editData.id;

      const response = await fetchWrapper(
        url,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        isEditMode ? "edit-page" : "save-page"
      );

      const savedData = await response.json();
      if (!response.ok) {
        throw new Error(
          savedData.error || `Failed to ${isEditMode ? "update" : "save"} page`
        );
      }

      toast.success(`Page ${isEditMode ? "updated" : "created"} successfully`);

      setPluginData((prev) => ({
        ...prev,
        pageId: prev.pageId.includes(savedData?.data && savedData.data.id)
          ? prev.pageId
          : [...prev.pageId, savedData?.data && savedData.data.id],
      }));

      if (setPageCreated && savedData.data) {
        setPageCreated((prev) => {
          const itemExists = prev.some((page) => page.id === savedData.data.id);
          return itemExists
            ? prev.map((page) =>
                page.id === savedData.data.id
                  ? { ...page, ...savedData.data }
                  : page
              )
            : [...prev, { ...savedData.data, type: pageType }];
        });
      }

      if (!isEditMode) {
        setValue("title", "");
        setValue("description", "");
      }
    } catch (error) {
      setValue("title", "")
      setValue("description", "");
      toast.error(error.message);
      console.error("Error in handleClose:", error);
    } finally {
      setOnPageCreated(true);
      setEditData(null);
      onClose();
      setLoading(false);
    }
  };

  if (editData && editData?.description && !getValues("description")) {
    return;
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 min-h-screen text-gray-700 bg-black/10 bg-opacity-80 flex items-center justify-center"  style={{marginTop : 0}}>
          <div className="bg-white rounded-lg w-[80%] flex flex-col relative">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(handleSubmitData)(e);
              }}
              className="flex flex-col justify-center items-center p-5 space-y-4"
            >
              <div className="flex flex-col w-full">
                <label className="text-xl font-semibold mb-1">Title</label>
                <input
                  type="text"
                  placeholder="Page Title"
                  {...register("title", {
                    required: "Title is required",
                    maxLength: {
                      value: 100,
                      message: "Title cannot exceed 100 characters",
                    },
                  })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-text"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col w-full">
                <label className="text-xl font-semibold mb-1">
                  Description
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextEditor
                      content={field.value || ""}
                      onChange={(value) => setValue("description", value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                      }}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="w-full flex items-center justify-end mr-12 gap-2">
                {/* <button
                  type="button"
                  onClick={() => {
                    if (editData?.description) {
                      if (
                        compareDescription(
                          editData?.description,
                          getValues("description")
                        )
                      ) {
                        setEditData(null);
                        setIsOpenCancelConfirm(false);
                        setValue("description", "");
                        onClose();
                      } else {
                        setIsOpenCancelConfirm(true);
                      }
                    } else if (getValues("description")) {
                      setIsOpenCancelConfirm(true);
                    } else {
                      setEditData(null);
                      setIsOpenCancelConfirm(false);
                      setValue("description", "");
                      onClose();
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button> */}
                <Button
                  onClick={() => {
                    if (editData?.description) {
                      if (
                        compareDescription(
                          editData?.description,
                          getValues("description")
                        )
                      ) {
                        setEditData(null);
                        setIsOpenCancelConfirm(false);
                        setValue("description", "");
                        onClose();
                      } else {
                        setIsOpenCancelConfirm(true);
                      }
                    } else if (getValues("description")) {
                      setIsOpenCancelConfirm(true);
                    } else {
                      setEditData(null);
                      setIsOpenCancelConfirm(false);
                      setValue("description", "");
                      onClose();
                    }
                  }}
                  disabled={loading}
                  type="Secondary"
                  label ="Cancel"
                />
                {/* <button
                  type="button"
                  disabled={loading}
                  className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleClose}
                >
                  {loading
                    ? editData
                      ? "Updating..."
                      : "Adding..."
                    : editData
                    ? "Update"
                    : "Add"}
                </button> */}
                <Button
                  disabled={loading}
                  onClick={handleClose}
                  isLoading={loading}
                  type="Primary"
                  label={editData
                    ? "Update"
                    : "Add"}
                />
              </div>
            </form>
          </div>
        </div>
      )}
      <Dialog
        open={isOpenCancelConfirm}
        onClose={() => {
          setEditData(null);
          setIsOpenCancelConfirm(false);
          setValue("title", "")
          setValue("description", "");
          onClose();
        }}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b">
              <Dialog.Title className="text-lg text-gray-600 font-medium">
                Cancel Add
              </Dialog.Title>
              <button
                onClick={() => {
                  setEditData(null);
                  setIsOpenCancelConfirm(false);
                  setValue("description", "");
                  onClose();
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col text-gray-800 space-x-3 mt-4">
              <p className="text-sm text-center py-4">
                This action CANNOT be undone. This will not save your page
              </p>
              <div className="flex items-center justify-between">
                {/* <button
                  onClick={() => setIsOpenCancelConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button> */}
                <Button
                  onClick={() => setIsOpenCancelConfirm(false)}
                  type="Secondary"
                  label="Cancel"
                />
                {/* <button
                  onClick={() => {
                    setEditData(null);
                    setIsOpenCancelConfirm(false);
                    setValue("description", "");
                    onClose();
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  OK
                </button> */}
                <Button
                  onClick={() => {
                    setEditData(null);
                    setIsOpenCancelConfirm(false);
                    setValue("description", "");
                    onClose();
                  }}
                  type="Primary"
                  label="OK"
                />
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}

export default AddPageModal;
