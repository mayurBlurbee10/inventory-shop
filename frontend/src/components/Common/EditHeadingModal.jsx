 "use client";

import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import TextEditor from "../Plugins/RTE/TextEditor";
import { useParams } from "next/navigation";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { setContent } from "@/store/services/contentService";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const EditHeadingModal = ({ isOpen, onClose, data }) => {
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: data?.title || '',
      value: data?.value || '',
      type: 'Text',
      portalId: params.portalid,
      fontSize: '20px',
    },
  });

  // Populate form values when modal opens or data changes
  useEffect(() => {
    if (data) {
      reset({
        title: data?.title || '',
        value: data?.value || '',
        type: 'Text',
        portalId: params.portalid,
        fontSize: '20px',
      });
    }
  }, [data, reset]);

  // Handle form submission
  const onSubmit = async (data) => {
    try {

      if (!data.title || !data.value || data.value === "<p></p>") {
        toast.error("description is required field.");
        return;
      }
      setIsLoading(true);
      const response = await fetchWrapper(
        "/api/contentManagement",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        },
        "update-heading"
      );
  
      if (!response.ok) throw new Error("Failed to update portal theme");
  
      console.log("Response:", response);
      dispatch(setContent(params.portalid));
      setIsLoading(false);
      onClose()
      toast.success("Heading updated successfully");
    } catch (error) {
      console.error("Submission Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) onClose();
      }}
    >
      <DialogContent
        className="max-h-[80vh] w-[90%] max-w-[1000px] overflow-y-auto sm:max-w-[1000px]"
        overlayClassName="bg-black/30"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="flex w-full flex-col space-y-2">
            <Label htmlFor="heading-title" className="text-xl font-semibold text-foreground">
              Title
            </Label>
            <Input
              id="heading-title"
              type="text"
              {...register("title")}
              readOnly
              className="w-full !bg-background h-10"
            />
          </div>

          <div className="flex w-full max-h-[500px] flex-col space-y-2">
            <Label className="text-xl font-semibold text-foreground ">
              Description
            </Label>
            <Controller
              name="value"
              control={control}
              render={({ field }) => (
                <TextEditor
                  from={data?.title || "Heading"}
                  content={field.value || ""}
                  onChange={(value) => setValue("value", value)}
                />
              )}
            />
          </div>

          <DialogFooter className="ml-auto w-auto flex-row justify-end gap-2 border-t-0 bg-transparent p-3 pt-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onClose}
              className="px-3 py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="px-3 py-3"
            >
              {isLoading ? "Saving..." : data?.value ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditHeadingModal;
