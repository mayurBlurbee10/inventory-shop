"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function DeleteConfirmDialog({
  isModalOpen,
  setIsModalOpen,
  handleDelete,
  config: _config,
  title = "Delete File",
  content = "Confirm delete?",
  buttonText = "Delete",
  isLoading,
  modalRef,
}) {
  return (
    <Dialog
      open={isModalOpen}
      onOpenChange={(open) => {
        if (!open && !isLoading) {
          setIsModalOpen(false);
        }
      }}
    >
      <DialogContent
        ref={modalRef}
        className="sm:max-w-sm bg-background"
        showCloseButton={!isLoading}
      >
        <DialogHeader className="text-center sm:text-left">
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <DialogDescription className="text-center text-base text-destructive my-3">
            {content}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 border-0 p-0 mb-2 sm:justify-center sm:gap-0 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsModalOpen(false)}
            disabled={isLoading}
            className="px-3 py-3 mx-3"
          >
            Close
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="px-3 py-3"
          >
            {isLoading ? (
              <LoaderSpinner size={18} className="text-destructive-foreground" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteConfirmDialog;
