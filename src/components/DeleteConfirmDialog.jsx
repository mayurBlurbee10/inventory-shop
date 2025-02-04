import { Dialog, DialogBackdrop } from "@headlessui/react";
import { Trash2, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

function DeleteConfirmDialog({
  isModalOpen,
  setIsModalOpen,
  handleDelete,
  title = "Delete File",
  content = "Confirm delete?",
}) {
  const params = useParams();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        if (!params?.portalid) return;
        const response = await fetchWrapper(
          `/api/portal?portalid=${params.portalid}`,
          {},
          "portal-login"
        );
        const data = await response.json();
        if (!data.data && response.status === 404) {
          router.push(`/${params.portalid}/not-found`);
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        setConfig(data.data);
      } catch (error) {
        console.log("error: ", error);
      }
    };

    fetchConfig();
  }, []);

  return (
    <Dialog
      open={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
      }}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/5" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-md">
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
            <div className="text-lg text-red-600 mb-4">{content}</div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 "
              >
                Close
              </button>
              <button
                onClick={handleDelete}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md  ${config?.secondaryColor ? "" : "bg-blue-500 hover:bg-blue-600"}`}
                style={{ backgroundColor: config?.secondaryColor || "rgb(59, 130, 246)" }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default DeleteConfirmDialog;
