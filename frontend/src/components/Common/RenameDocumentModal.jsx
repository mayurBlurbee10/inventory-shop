"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { toast } from "react-toastify";
import LoaderSpinner from "./Elements/LoaderSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const RenameDocumentModal = ({ isOpen, onClose, item, onFileRename }) => {
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setNewName(item?.name);
  }, [item]);

  const handleRename = async () => {
    if (!newName.trim()) return;

    setIsLoading(true);
    try {
      const requestOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: item?.id,
          newName: newName,
          type: item?.type,
        }),
      };
      const response = await fetchWrapper(
        "/api/box/files",
        requestOptions,
        "rename-document",
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to rename document");
      }
      setShowSuccess(true);
      await onFileRename();
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      toast.error(error?.message);
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
        className="w-full max-w-[400px] bg-background sm:max-w-[400px]"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-border pb-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-lg font-medium text-foreground">
              Rename {item?.type === "file" ? "File" : "Folder"}
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        {showSuccess ? (
          <div className="space-y-4 py-2 text-center">
            <DialogDescription className="text-base font-medium text-success">
              {item?.type === "file" ? "File" : "Folder"} successfully renamed!
            </DialogDescription>
            <DialogFooter className="m-0 justify-center p-0 sm:justify-center">
              <Button type="button" onClick={onClose} className="px-3 py-3">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Enter new name
              </Label>
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="!bg-background text-foreground h-10"
                disabled={isLoading}
              />
            </div>
            <DialogFooter className="m-0 border-0 gap-2 p-0 sm:justify-center bg-transparent">
              <Button
                type="button"
                onClick={handleRename}
                disabled={isLoading || !newName?.trim()}
                className="px-3 py-3"
              >
                {isLoading ? (
                  <LoaderSpinner size={18} className="text-secondary-foreground" />
                ) : null}
                Rename
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="px-3 py-3"
              >
                Cancel
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RenameDocumentModal;
