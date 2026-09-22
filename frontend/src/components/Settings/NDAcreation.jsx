"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { Upload, FileText, PenLine } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import { getUserData } from "@/app/lib/auth";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TextEditor = dynamic(() => import("../Plugins/RTE/TextEditor"), {
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

  const portalId = params?.portalid || "root";

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

  const isEdit = !!editData?.id;

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !saveLoading && !uploadLoading) {
            tryClose();
          }
        }}
      >
        <DialogContent
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-4 overflow-x-auto overflow-y-auto sm:max-w-[1000px]"
          overlayClassName="bg-black/30"
        >
          <DialogHeader className="min-w-0 space-y-1 pr-10 text-left">
            <DialogTitle className="text-left text-xl text-foreground">
              {isEdit ? "Edit NDA" : "Create NDA"}
            </DialogTitle>
            <DialogDescription className="text-left text-sm">
              Create an NDA with the built-in editor or upload a document for e-sign.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-w-0 flex-col space-y-5">
            <div className="flex w-full min-w-0 flex-col">
              <span className="mb-2 px-1 text-xl font-semibold text-foreground">
                NDA type
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={isEdit}
                  onClick={() => setNdaType("editor")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    ndaType === "editor"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
                    isEdit && "cursor-not-allowed opacity-60",
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <PenLine className="size-5 text-secondary-foreground" />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-semibold text-foreground sm:text-base">
                      NDA editor
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Write terms in the rich text editor
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  disabled={isEdit}
                  onClick={() => setNdaType("esign")}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                    ndaType === "esign"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
                    isEdit && "cursor-not-allowed opacity-60",
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                    <FileText className="size-5 text-secondary-foreground" />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-sm font-semibold text-foreground sm:text-base">
                      E-sign
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      Upload a document for NDA signing
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex w-full min-w-0 flex-col">
              <Label htmlFor="nda-title" className="mb-1 px-1 text-xl font-semibold text-foreground">
                Title
              </Label>
              <Input
                id="nda-title"
                type="text"
                placeholder="NDA title"
                {...register("title", {
                  required: "Title is required",
                  maxLength: {
                    value: 100,
                    message: "Title cannot exceed 100 characters",
                  },
                })}
                className="h-11 w-full !bg-background"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            {ndaType === "editor" ? (
              <div className="flex w-full min-w-0 flex-col space-y-2">
                <Label className="mb-1 text-xl font-semibold text-foreground">
                  NDA content
                </Label>
                <div className="min-w-0 overflow-x-auto overflow-y-auto rounded-xl border border-border bg-card p-3">
                  <div className="min-w-[640px]">
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
                </div>
              </div>
            ) : (
              <div className="flex w-full flex-col space-y-2">
                <Label className="mb-2 text-xl font-semibold text-foreground">
                  Upload document for NDA signing
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf"
                  onChange={onFileInputChange}
                />
                <Card className="border-dashed">
                  <CardContent className="p-0">
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
                      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl p-10 text-center transition hover:bg-muted/30"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop a file here, or click to browse
                      </p>
                      {uploadLoading && (
                        <div className="flex items-center gap-2">
                          <LoaderSpinner size={24} className="text-secondary-foreground" />
                          <p className="text-sm text-secondary-foreground">Uploading...</p>
                        </div>
                      )}
                      {fileId && (
                        <p className="mt-2 text-sm font-medium text-success">
                          {originalFileName || "File attached"} (ready to save)
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <DialogFooter className="gap-2 border-t border-border sm:gap-2 bg-transparent">
              <Button
                type="button"
                variant="outline"
                disabled={saveLoading || uploadLoading}
                onClick={tryClose}
                className="px-3 py-3"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saveLoading || uploadLoading}
                onClick={handleSave}
                className="px-3 py-3"
              >
                {saveLoading ? (
                  <LoaderSpinner size={18} className="text-primary-foreground" />
                ) : null}
                {isEdit ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpenCancelConfirm}
        onOpenChange={(open) => !open && setIsOpenCancelConfirm(false)}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-sm" overlayClassName="bg-black/30">
          <DialogHeader>
            <DialogTitle className="text-lg text-foreground">
              Discard changes?
            </DialogTitle>
            <DialogDescription className="py-2 text-sm text-muted-foreground">
              Your changes will not be saved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-border sm:gap-2 bg-transparent">
            <Button
              type="button"
              variant="outline"
              className="px-3 py-3"
              onClick={() => setIsOpenCancelConfirm(false)}
            >
              Keep editing
            </Button>
            <Button
              type="button"
              className="px-3 py-3"
              onClick={() => {
                setIsOpenCancelConfirm(false);
                setEditData?.(null);
                reset({ title: "", description: "" });
                setFileId(null);
                setOriginalFileName("");
                onClose();
              }}
            >
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default NDAcreation;
