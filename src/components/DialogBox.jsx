import { Dialog, DialogBackdrop } from "@headlessui/react";
import { Share2, X } from "lucide-react";

const DialogBox = ({title, message, fileLocation, isModalOpen, setIsModalOpen}) => {
  return (
    <Dialog
      open={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
      }}
      className="relative z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl text-gray-600 font-medium">
              {title}
            </Dialog.Title>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-4">
            <div className="text-lg text-green-600 mb-4">
              {message}
            </div>
           { fileLocation && <div className="text-gray-600 mb-4" dangerouslySetInnerHTML={{__html:fileLocation}}></div>}
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => {}}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DialogBox;
