import { Dialog, DialogBackdrop } from "@headlessui/react";
import { useEffect, useState } from "react";
import { Share2, X } from "lucide-react";
import { getUserData } from "@/app/lib/auth";
import { toast } from "react-toastify";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

const UploadFileConfirmDialog = ({
  title,
  message,
  fileLocation,
  isModalOpen,
  setIsModalOpen,
  config,
  isDuplicateFile,
  duplicateFiles,
  setDuplicateFiles,
  selectedItem,
  refreshFiles,
  path,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isReplaceLoading, setIsReplaceLoading] = useState(false);
  const [location, setLocation] = useState([]);

  console.log("fileLocation", fileLocation);
  console.log("location", location);

  function base64ToFile(base64, fileName, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return new File([blob], fileName, { type: mimeType });
  }

  const handleReplaceFiles = async () => {
    if (duplicateFiles.length > 0) {
      try {
        setIsReplaceLoading(true);
        const uploadData = new FormData();
        const userData = getUserData();
        duplicateFiles.forEach((fileData) => {
          const file = base64ToFile(
            fileData.base64,
            fileData.name,
            fileData.type
          );
          uploadData.append("file", file);
        });
        if (!!selectedItem && selectedItem.type == "folder") {
          uploadData.append("boxFolderId", selectedItem.id);
        } else {
          uploadData.append("boxFolderId", userData.boxFolderId);
        }

        uploadData.append("email", userData.email);

        const requestOptions = {
          method: "POST",
          body: uploadData,
        };

        const response = await fetchWrapper(
          "/api/box/files/replace",
          requestOptions,
          "uploadFile"
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to upload files");
        }
        setLocation([...data.files.map((file) => file.name)]);
        await refreshFiles().then(() => {
          setDuplicateFiles([]);
          toast.success("File uploaded successfully");
        });
      } catch (error) {
        toast.error(error.message);
        console.error("Error uploading files:", error);
      } finally {
        setIsReplaceLoading(false);
      }
    }
  };

  const handleCreateDuplicateFiles = async () => {
    if (duplicateFiles.length > 0) {
      try {
        setIsLoading(true);
        const uploadData = new FormData();
        const userData = getUserData();
        duplicateFiles.forEach((fileData) => {
          const file = base64ToFile(
            fileData.base64,
            fileData.name,
            fileData.type
          );
          uploadData.append("file", file);
        });
        if (!!selectedItem && selectedItem.type == "folder") {
          uploadData.append("boxFolderId", selectedItem.id);
        } else {
          uploadData.append("boxFolderId", userData.boxFolderId);
        }

        uploadData.append("email", userData.email);

        const requestOptions = {
          method: "POST",
          body: uploadData,
        };

        const response = await fetchWrapper(
          "/api/box/files/duplicate",
          requestOptions,
          "uploadFile"
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to upload files");
        }

        setLocation([...data.files.map((file) => file.name)]);
        await refreshFiles().then(() => {
          setDuplicateFiles([]);
          toast.success("File uploaded successfully");
        });
      } catch (error) {
        toast.error(error.message);
        console.error("Error uploading files:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

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
              onClick={() => {
                setLocation([]);
                setIsModalOpen(false);
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {!isDuplicateFile && (
            <div className="text-center py-4">
              <>
                <div className="text-lg text-green-600 mb-4">{message}</div>

                <div
                  className="text-gray-600 mb-4"
                  // dangerouslySetInnerHTML={{
                  //   __html: location,
                  // }}
                >
                  <div>
                    <div>Location: Home{path}</div>
                    <div>Name: {[...location, ...fileLocation].join(", ")}</div>
                  </div>

                  {/* <div>
                        <div>Location: Home{path}</div>
                        <div>Name: {[...fileLocation].join(", ")}</div>
                      </div> */}
                </div>
              </>

              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setLocation([]);
                    setIsModalOpen(false);
                  }}
                  className={`px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary/30 outline-none text-secondary rounded-md  ${
                    isLoading
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-white cursor-pointer"
                  }`}
                  style={{
                    backgroundColor: config?.secondaryColor || "#0061D5",
                  }}
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    "Done"
                  )}
                </button>
              </div>
            </div>
          )}

          {isDuplicateFile && (
            <div className="text-center py-4">
              <p className="text-lg text-gray-600 mb-4">
                A file with the same name already exists. What would you like to
                do?
              </p>

              <div className="text-sm text-gray-500 mb-4">
                Name: {duplicateFiles?.map((file) => file.name)}
              </div>

              <div className="flex flex-col gap-3">
                {/* Replace Existing File Button */}
                <button
                  onClick={handleReplaceFiles}
                  disabled={isReplaceLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    isReplaceLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isReplaceLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    "Replace Existing File"
                  )}
                </button>

                {/* Upload as Duplicate Button */}
                <button
                  onClick={handleCreateDuplicateFiles}
                  disabled={isLoading}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                    isLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : (
                    "Upload as Duplicate"
                  )}
                </button>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default UploadFileConfirmDialog;
