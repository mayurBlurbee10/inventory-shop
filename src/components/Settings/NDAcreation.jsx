"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { X, Upload, FileText, PenLine, Loader2 } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { Dialog } from "@headlessui/react";
import { useParams } from "next/navigation";
import { getUserData } from "@/app/lib/auth";
import Button from "../Common/Elements/Button";

const TextEditor = dynamic(() => import("../../components/Plugins/RTE/TextEditor"), {
  ssr: false,
});

function NDAcreation({ isOpen, onClose, editData, setEditData }) {
  const params = useParams();
  const fileInputRef = useRef(null);
  const [ndaType, setNdaType] = useState("editor");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileId, setFileId] = useState(null);
  const [originalFileName, setOriginalFileName] = useState("");
  const [isOpenCancelConfirm, setIsOpenCancelConfirm] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const {
    register,
    control,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    if (editData) {
      setNdaType(editData.ndaType || "editor");
      setFileId(editData.fileId || null);
      setOriginalFileName(editData.originalFileName || "");
      reset({
        title: editData.title || "",
        description: editData.description || "",
      });
    } else {
      setNdaType("editor");
      setFileId(null);
      setOriginalFileName("");
      reset({ title: "", description: "" });
    }
  }, [editData, reset, isOpen]);

  const compareDescription = (a, b) => {
    const sanitizeHTML = (html) => {
      const div = document.createElement("div");
      div.innerHTML = html || "";
      return div.textContent || div.innerText || "";
    };
    return sanitizeHTML(a).trim() === sanitizeHTML(b).trim();
  };

  const uploadFile = async (file) => {
    const userData = getUserData();
    if (!userData?.boxFolderId || !userData?.boxUserId) {
      toast.error("Missing Box folder or user. Please sign in again.");
      return;
    }
    setUploadLoading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("boxFolderId", userData.boxFolderId);
      uploadData.append("email", userData.email || "");
      uploadData.append("userId", userData.boxUserId);

      const response = await fetchWrapper(
        "/api/box/files",
        { method: "POST", body: uploadData },
        "nda-esign-upload",
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }
      const uploaded = data.files?.[0];
      if (!uploaded?.id) {
        throw new Error("No file id returned from upload");
      }
      setFileId(uploaded.id);
      setOriginalFileName(file.name);
      toast.success("File uploaded");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const onFileInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) uploadFile(f);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (f) uploadFile(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const portalId = params?.portalid;

  const handleSave = async () => {
    const title = getValues("title")?.trim();
    const description = getValues("description") || "";

    if (!title) {
      toast.error("Title is required.");
      return;
    }

    if (ndaType === "editor") {
      if (
        !description ||
        description === "<p></p>" ||
        description === "<p><br></p>"
      ) {
        toast.error("NDA content is required for editor type.");
        return;
      }
    } else if (!fileId) {
      toast.error("Upload a document for e-sign type.");
      return;
    }

    if (!portalId) {
      toast.error("Portal is missing.");
      return;
    }

    setSaveLoading(true);
    try {
      const payload = {
        portalId,
        title,
        ndaType,
        description: ndaType === "editor" ? description : null,
        fileId: ndaType === "esign" ? fileId : null,
        originalFileName: ndaType === "esign" ? originalFileName : null,
      };

      const isEdit = !!editData?.id;
      if (isEdit) payload.id = editData.id;

      const response = await fetchWrapper(
        "/api/nda-agreements",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        isEdit ? "update-nda-agreement" : "create-nda-agreement",
      );

      const saved = await response.json();
      if (!response.ok) {
        throw new Error(saved.error || "Save failed");
      }

      toast.success(isEdit ? "NDA updated" : "NDA created");
      setEditData?.(null);
      onClose();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const tryClose = () => {
    const title = getValues("title");
    const description = getValues("description");

    if (editData) {
      if (editData.ndaType === "editor" || ndaType === "editor") {
        if (
          title !== editData.title ||
          !compareDescription(editData.description, description)
        ) {
          setIsOpenCancelConfirm(true);
          return;
        }
      } else if (title !== editData.title || fileId !== editData.fileId) {
        setIsOpenCancelConfirm(true);
        return;
      }
    } else if (title || (description && description !== "<p></p>")) {
      setIsOpenCancelConfirm(true);
      return;
    } else if (ndaType === "esign" && fileId) {
      setIsOpenCancelConfirm(true);
      return;
    }

    setEditData?.(null);
    onClose();
  };

  if (!isOpen) return null;

  const isEdit = !!editData?.id;

  return (
    <>
      <div
        className="fixed inset-0 min-h-screen text-gray-700 bg-black bg-opacity-50 flex items-center justify-center z-10"
        style={{ marginTop: 0 }}
      >
        <div className="bg-white rounded-lg w-[90%] max-w-[1000px] flex flex-col relative max-h-[90vh] overflow-y-auto">
          <button
            type="button"
            onClick={tryClose}
            className="absolute top-3.5 right-3.5 text-gray-400 hover:bg-gray-100 rounded-full p-1 z-10"
          >
            <X className="size-6" />
          </button>

          <div className="flex flex-col p-5 space-y-4">
            <h2 className="text-xl font-semibold text-center sm:text-left px-1">
              {isEdit ? "Edit NDA" : "Create NDA"}
            </h2>

            <div className="flex flex-col w-full">
              <span className="text-xl font-semibold mb-2 px-1">NDA type</span>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 px-4">
                <button
                  type="button"
                  disabled={isEdit}
                  onClick={() => setNdaType("editor")}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition ${
                    ndaType === "editor"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  } ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <PenLine className="size-8 text-primary shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">
                      NDA editor
                    </div>
                    <div className="text-sm text-gray-600 hidden sm:block">
                      Write terms in the rich text editor
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={isEdit}
                  onClick={() => setNdaType("esign")}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 text-left transition ${
                    ndaType === "esign"
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  } ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <FileText className="size-8 text-primary shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">
                      E-sign
                    </div>
                    <div className="text-sm text-gray-600 hidden sm:block">
                      Upload a document for NDA signing
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex flex-col w-full">
              <label className="text-xl font-semibold mb-1">Title</label>
              <div className="px-4">
                <input
                  type="text"
                  placeholder="NDA title"
                  {...register("title", {
                    required: "Title is required",
                    maxLength: {
                      value: 100,
                      message: "Title cannot exceed 100 characters",
                    },
                  })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-text"
                />
              </div>
              {errors.title && (
                <p className="text-sm text-red-600 mt-1 px-4">
                  {errors.title.message}
                </p>
              )}
            </div>

            {ndaType === "editor" ? (
              <div className="flex flex-col w-full max-h-[500px]">
                <label className="text-xl font-semibold mb-1">
                  NDA content
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
              </div>
            ) : (
              <div className="flex flex-col w-full">
                <label className="text-xl font-semibold mb-2">
                  Upload document for NDA signing
                </label>
                <div className="px-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,application/pdf"
                    onChange={onFileInputChange}
                  />
                  <div
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-gray-50/80 transition"
                  >
                    <Upload className="h-10 w-10 text-gray-400" />
                    <p className="text-sm text-gray-600 text-center">
                      Drag and drop a file here, or click to browse
                    </p>
                    {uploadLoading && (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm text-primary">Uploading…</p>
                      </div>
                    )}
                    {fileId && (
                      <p className="text-sm text-green-700 mt-2 font-medium">
                        {originalFileName || "File attached"} (ready to save)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full flex items-center justify-end mr-4 sm:mr-12 gap-2 pt-2">
              <Button
                type="Secondary"
                label="Cancel"
                disabled={saveLoading || uploadLoading}
                onClick={tryClose}
              />
              <Button
                type="Primary"
                label={isEdit ? "Save" : "Create"}
                disabled={saveLoading || uploadLoading}
                isLoading={saveLoading}
                onClick={handleSave}
              />
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={isOpenCancelConfirm}
        onClose={() => setIsOpenCancelConfirm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <Dialog.Title className="text-lg text-gray-600 font-medium">
                Discard changes?
              </Dialog.Title>
              <button
                type="button"
                onClick={() => setIsOpenCancelConfirm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-700 py-2">
              Your changes will not be saved.
            </p>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                type="Secondary"
                label="Keep editing"
                onClick={() => setIsOpenCancelConfirm(false)}
              />
              <Button
                type="Primary"
                label="Discard"
                onClick={() => {
                  setIsOpenCancelConfirm(false);
                  setEditData?.(null);
                  reset({ title: "", description: "" });
                  setFileId(null);
                  setOriginalFileName("");
                  onClose();
                }}
              />
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}

export default NDAcreation;
