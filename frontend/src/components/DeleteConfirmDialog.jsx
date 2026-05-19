import { Dialog, DialogBackdrop } from "@headlessui/react";
import { Trash2, X } from "lucide-react";
import { useParams } from "next/navigation";
import Button from "./Common/Elements/Button";

function DeleteConfirmDialog({
  isModalOpen,
  setIsModalOpen,
  handleDelete,
  config,
  title = "Delete File",
  content = "Confirm delete?",
  buttonText = "Delete",
  isLoading,
  modalRef
}) {
  
  return (
    <Dialog
      open={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
      }}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center" ref={modalRef}>
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white shadow-md">
          <div className="flex justify-between items-center border-b p-4">
            <Dialog.Title className="text-xl text-gray-600 font-medium flex items-center">
              {title}
            </Dialog.Title>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-600 hover:bg-gray-100 rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center p-4">
            <div className="text-lg text-red-600 mb-4">{content}</div>
            <div className="flex justify-center space-x-3">
              {/* <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 "
              >
                Close
              </button> */}
              <Button
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
              type="Secondary"
              label="Close"
              />
              {/* <button
                onClick={handleDelete}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md  ${
                  config?.secondaryColor ? "" : "bg-blue-500 hover:bg-blue-600"
                }`}
                style={{
                  backgroundColor:
                    config?.secondaryColor || "rgb(59, 130, 246)",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </>
                )}
              </button> */}
              <Button
               onClick={handleDelete}
               disabled={isLoading}
               isLoading={isLoading}
               type="Delete"
               label={buttonText}
               icon={Trash2}
              />
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default DeleteConfirmDialog;
