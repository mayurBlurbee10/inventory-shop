import Button from "@/components/Common/Elements/Button";
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLink(initialLink || "");
      setIsEditMode(!initialLink); // If there's no link, go to edit mode directly
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
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl text-gray-700 font-semibold">
              {initialLink ? "Edit Link" : "Add Link"}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Text
              </label>
              <input
                type="text"
                value={text}
                disabled
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">
                Link
              </label>
              {isEditMode ? (
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://example.com"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800"
                />
              ) : (
                <input
                  type="text"
                  value={link}
                  disabled
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 bg-gray-100"
                />
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {initialLink && !isEditMode ? (
              <>
                <Button
                  onClick={() => setIsEditMode(true)}
                  type="Secondary"
                  label="Edit"
                />
                <Button
                  onClick={handleRemove}
                  type="Primary"
                  label="Remove"
                />
              </>
            ) : (
              <>
                <Button onClick={onClose} type="Secondary" label="Cancel" />
                <Button
                  onClick={handleSave}
                  type="Primary"
                  label="Save"
                  disabled={!link}
                />
              </>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddLinkModal;
