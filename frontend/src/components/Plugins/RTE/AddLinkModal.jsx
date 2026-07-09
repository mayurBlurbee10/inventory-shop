"use client";

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
import React, { useEffect, useState } from "react";

const AddLinkModal = ({
  isOpen,
  onClose,
  text,
  initialLink,
  editor,
  savedRange,
}) => {
  const [link, setLink] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLink(initialLink || "");
      setIsEditMode(!initialLink);
    }
  }, [isOpen, initialLink]);

  const handleSave = () => {
    if (link) {
      if (savedRange) {
        editor
          .chain()
          .setTextSelection(savedRange)
          .focus()
          .extendMarkRange("link")
          .setLink({ href: link })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: link })
          .run();
      }
    }
    onClose();
  };

  const handleRemove = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {initialLink ? "Edit Link" : "Add Link"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="link-text" className="text-foreground">
              Text
            </Label>
            <Input
              id="link-text"
              type="text"
              value={text}
              disabled
              className="!bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link-url" className="text-foreground">
              Link
            </Label>
            {isEditMode ? (
              <Input
                id="link-url"
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
                className="!bg-background"
              />
            ) : (
              <Input
                id="link-url"
                type="text"
                value={link}
                disabled
                className="!bg-muted"
              />
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 bg-card">
          {initialLink && !isEditMode ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMode(true)}
                className="px-3 py-3"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleRemove}
                className="px-3 py-3"
              >
                Remove
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-3 py-3 mx-3"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={!link}
                className="px-3 py-3"
              >
                Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddLinkModal;
