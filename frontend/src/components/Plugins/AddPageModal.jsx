"use client";
import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import { customPageSectionTemplate } from "@/app/lib/data/existingPages";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const TextEditor = dynamic(() => import("./RTE/TextEditor"), { ssr: false });

function AddPageModal({
  isOpen,
  onClose,
  setPluginData,
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

    const sanitizedExistingDescription =
      sanitizeHTML(existingDescription).trim();
    const sanitizedCurrentDescription = sanitizeHTML(currentDescription).trim();

    return sanitizedExistingDescription === sanitizedCurrentDescription;
  };

  const handleSubmitData = async (values) => {
    setLoading(true);
    try {
      const data = {
        title: values.title,
        description: values.description,
        visibility: customPageSectionTemplate?.sections,
        isCustomPage: true,
      };

      const response = await fetchWrapper(
        "/api/pages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
        "save-page",
      );

      const savedData = await response.json();
      if (!response.ok) {
        throw new Error(savedData.error || "Failed to save page");
      }

      toast.success("Page created successfully");
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

      if (!title || !description || description === "<p></p>") {
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

      if (isEditMode) {
        payload.id = editData.id;
      } else {
        payload.visibility = customPageSectionTemplate.sections;
      }

      const response = await fetchWrapper(
        url,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
        isEditMode ? "edit-page" : "save-page",
      );

      const savedData = await response.json();
      if (!response.ok) {
        throw new Error(
          savedData.error || `Failed to ${isEditMode ? "update" : "save"} page`,
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
                  : page,
              )
            : [...prev, { ...savedData.data, type: pageType }];
        });
      }

      if (!isEditMode) {
        setValue("title", "");
        setValue("description", "");
      }
      setOnPageCreated(true);
      setEditData(null);
      onClose();
    } catch (error) {
      setValue("title", "");
      setValue("description", "");
      toast.error(error.message);
      console.error("Error in handleClose:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = () => {
    if (editData?.description) {
      if (
        compareDescription(editData?.description, getValues("description"))
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
  };

  const confirmDiscard = () => {
    setEditData(null);
    setIsOpenCancelConfirm(false);
    setValue("title", "");
    setValue("description", "");
    onClose();
  };

  if (editData && editData?.description && !getValues("description")) {
    return null;
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => !open && handleCancelClick()}
      >
        <DialogContent
          className="max-h-[85vh] w-[90%] max-w-[1000px] overflow-y-auto sm:max-w-[1000px]"
          overlayClassName="bg-black/30"
          showCloseButton
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(handleSubmitData)(e);
            }}
            className="flex w-full flex-col gap-5"
          >
            <div className="w-full space-y-2 mt-3">
              <Label htmlFor="page-title" className="text-foreground text-lg ">
                Title
              </Label>
              <Input
                id="page-title"
                type="text"
                placeholder="Page Title"
                className="w-full !bg-background h-10"
                {...register("title", {
                  required: "Title is required",
                  maxLength: {
                    value: 100,
                    message: "Title cannot exceed 100 characters",
                  },
                })}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="w-full max-h-[500px] space-y-2">
              <Label htmlFor="page-description" className="text-foreground text-lg ">
                Description
              </Label>
              <div className="w-full  rounded-xl bg-card">
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
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 border-t border-border bg-card sm:gap-2 bg-transparent">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelClick}
                disabled={loading}
                className="px-3 py-3"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                disabled={loading}
                onClick={handleClose}
                className="px-3 py-3"
              >
                {loading ? (
                  <LoaderSpinner size={18} className="text-primary-foreground" />
                ) : null}
                {editData ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOpenCancelConfirm}
        onOpenChange={(open) => !open && setIsOpenCancelConfirm(false)}
      >
        <DialogContent className="sm:max-w-sm" overlayClassName="bg-black/30">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editData ? "Discard Page Changes?" : "Cancel Add"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action CANNOT be undone. This will not save your page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 border-t border-border bg-transparent sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpenCancelConfirm(false)}
              className="px-3 py-3"
            >
              Cancel
            </Button>
            <Button type="button" onClick={confirmDiscard} className="px-3 py-3">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AddPageModal;
