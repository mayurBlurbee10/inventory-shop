import { Dialog, DialogBackdrop } from "@headlessui/react";
import {  useState } from "react";
import {  X } from "lucide-react";
import Button from "./Common/Elements/Button";

const DialogBox = ({ title, message, fileLocation, isModalOpen, setIsModalOpen , config}) => {

  const [isLoading, setIsLoading] = useState(false);
console.log('dialog:', config)
  return (
    <Dialog
      open={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
      }}
      className="relative z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white shadow-xl">
          <div className="flex justify-between items-center p-4">
            <Dialog.Title className="text-xl text-gray-600 font-medium">
              {title}
            </Dialog.Title>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-600 hover:bg-gray-100 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center p-4">
            <div className="text-lg text-green-600 mb-4">{message}</div>
            {fileLocation && (
              <div
                className="text-gray-600 mb-4"
                dangerouslySetInnerHTML={{ __html: fileLocation }}
              ></div>
            )}
            <div className="flex justify-center space-x-3">
            <Button
              onClick={() => setIsModalOpen(false)}
              isLoading={isLoading}
              type="Primary"
              label="Done"
            />
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DialogBox;
