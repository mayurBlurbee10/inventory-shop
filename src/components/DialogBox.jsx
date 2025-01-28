import { Dialog, DialogBackdrop } from "@headlessui/react";
import { useEffect, useState } from "react";
import { Share2, X } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";


const DialogBox = ({ title, message, fileLocation, isModalOpen, setIsModalOpen }) => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();

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
            <div className="text-lg text-green-600 mb-4">{message}</div>
            {fileLocation && (
              <div
                className="text-gray-600 mb-4"
                dangerouslySetInnerHTML={{ __html: fileLocation }}
              ></div>
            )}
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className={`px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-secondary rounded-md  ${isLoading
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-white cursor-pointer"
                  }`}
                style={{ backgroundColor: config?.secondaryColor }}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  "Done"
                )}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DialogBox;
