"use client";

import {
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  File,
  FileIcon,
  Send,
  Share2,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import PreviewModal from "./FileExplorer/PreviewModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";

const ShareModal = ({ isOpen, onClose, fileName }) => {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const shareLink = `https://files.ethree.com/share/${fileName}`;

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailShare = async () => {
    console.log("Sharing via email:", email);
    setEmail("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-semibold text-gray-900 mb-6">{fileName}</h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Share link
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Copy size={16} />
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Share via email
            </label>
            <div className="flex items-center gap-3">
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleEmailShare}
                disabled={!email}
                className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                  ${
                    email
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
              >
                <Send size={16} />
                <span>Send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function FolderExplorer({
  fileList,
  setDeleteDropdown,
  deleteDropdown,
  setPath,
  path,
  currentFilesList,
  setCurrentFilesList,
  setSelectedItem,
  selectedItem
}) {
  const [previewFileId, setPreviewFileId] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [shareFileName, setShareFileName] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    setCurrentFilesList(
      path.length === 0 ? fileList : path[path.length - 1].children
    );
    // setSelectedItem(path === 0 && null);
  }, [path]);

  console.log(currentFilesList);

  const handleFolderClick = (folder) => {
    setSelectedItem(folder);
    setPath((prev) => [...prev, folder]);
    console.log("selectedItem : ", selectedItem)
  };


  const handleDelete = (id) => {
    setDeleteDropdown((prev) => (prev === id ? null : id));
  };

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const handleShare = (fileName) => {
    setShareFileName(fileName);
    setIsShareModalOpen(true);
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fetchWrapper(
        `api/box/download?fileId=${fileId}`,
        {},
        "download"
      );
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  return (
    <>
      {currentFilesList &&
        currentFilesList.length > 0 &&
        currentFilesList.map((file, index) => {
          return (
            <tr
              key={index}
              className="px-3 hover:bg-gray-50 divide-gray-200 border-b border-b-gray-200 group active:bg-sky-200 active:text-sky-800"
            >
              <td
                className="py-3 pl-4"
                onClick={() =>
                  file.type === "folder" && handleFolderClick(file)
                }
              >
                <div className="flex items-center justify-start gap-3">
                  <File className="h-5 w-5 text-[#3c4043]" />
                  <span className="text-[#3c4043] mt-1 font-semibold text-sm truncate max-w-56">
                    {file?.name}
                  </span>
                </div>
              </td>

              <td className="py-3">
                <div className="flex items-center justify-start gap-2">
                  <span className="text-gray-600 text-sm">You opened</span>
                  <span className="rounded-full bg-gray-600 h-1 w-1 block"></span>
                  <span className="text-gray-600 text-sm">9:30 AM</span>
                </div>
              </td>

              <td className="py-3">
                <div className="flex items-center">
                  <div>
                    <img
                      src="https://img.freepik.com/premium-vector/avatar-icon0002_750950-43.jpg?uid=R149831676&ga=GA1.1.983684055.1709024503&semt=ais_hybrid"
                      className="h-8 w-8 object-contain rounded-full mr-3"
                    />
                  </div>
                  <p className="text-gray-600 text-sm truncate max-w-40 w-full">
                    me
                  </p>
                </div>
              </td>

              <td className="py-3">
                <div className="flex items-center gap-3">
                  <UsersRound className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-600 text-sm truncate max-w-40 w-full">
                    My folder
                  </span>
                </div>
              </td>

              <td className="py-3 pr-3">
                <div className="flex items-center justify-end">
                  <div className="opacity-0 flex items-center justify-start gap-2 group-hover:opacity-100">
                    {/* FOR ONLY FILES */}
                    {file.type === "file" && (
                      <>
                        <button
                          className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(file?.id);
                            setDeleteDropdown(null);
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(file?.name);
                            setDeleteDropdown(null);
                          }}
                          title="Share"
                        >
                          <Share2 className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file.id, file.name);
                            setDeleteDropdown(null);
                          }}
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-gray-600" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="relative">
                    {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
                    <button
                      className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center relative"
                      onClick={() => handleDelete(file?.id)}
                    >
                      <EllipsisVertical className="h-4 w-4 text-gray-600" />
                    </button>

                    {/* DELETE DROPDOWN DONE*/}
                    {deleteDropdown === file?.id && (
                      <div className="absolute top-8 left-[-120px] shadow w-40 bg-white rounded-lg z-10 overflow-hidden">
                        <button className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600">
                          <Trash2 className="h-4 w-4 text-gray-600" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      {currentFilesList && currentFilesList?.length === 0 && (
        <tr className="px-3">
          <td className="col-span-4">
            <EmptyState />
          </td>
        </tr>
      )}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        fileId={previewFileId}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        fileName={shareFileName}
      />
    </>
  );
}
const EmptyState = () => (
  <div className="flex flex-col w-full items-center justify-center py-12 text-gray-500">
    <FileIcon size={48} className="mb-4 opacity-50" />
    <p>No files or folders found</p>
  </div>
);
export default FolderExplorer;
