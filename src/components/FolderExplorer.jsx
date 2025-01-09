"use client";

import {
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  File,
  FileIcon,
  Folder,
  Send,
  Share2,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import PreviewModal from "./FileExplorer/PreviewModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Select from "react-select";
import { useParams } from "next/navigation";
import { usePathname } from "next/navigation";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const ShareModal = ({
  isOpen,
  onClose,
  item,
  onShareLinkToggle,
  usersList,
}) => {
  const params = useParams();
  const [userID, setUserID] = useState("");
  const [copied, setCopied] = useState(false);
  const [userList, setUserList] = useState([]);
  const [sharedLink, setSharedLink] = useState(
    item?.shared_link
      ? params.portalid
        ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${params.portalid}/shared-file/${item?.id}`
        : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-file/${item?.id}`
      : null
  );
  const [collabLoading, setCollabLoading] = useState(false);
  const [collaborator, setCollaborator] = useState([]);

  useEffect(() => {
    setSharedLink(
      item?.shared_link
        ? params.portalid
          ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${params.portalid}/shared-file/${item?.id}`
          : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-file/${item?.id}`
        : null
    );
    setCollaborator(item?.collaborators ? item.collaborators : []);
  }, [item]);

  useEffect(() => {
    const users = usersList.map((user) => ({
      value: user.boxUserId,
      label: `${user.name} (${user.email})`,
    }));
    setUserList(users);
  }, [usersList]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (sharedLink) {
      navigator.clipboard.writeText(sharedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailShare = async () => {
    try {
      setCollabLoading(true);
      const obj = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: userID.value,
          role: "viewer",
          itemId: item?.id,
        }),
      };
      const response = await fetchWrapper(
        `/api/box/files/share`,
        obj,
        "addCollaborator"
      );
      if (!response.ok) throw new Error("Failed to add collaborator");
      const data = await response.json();
      setCollabLoading(false);
      onAddCollaborator({
        id: data.response.id,
        userID: userID.value,
        isForAdd: true,
      });
      setUserID("");
    } catch (error) {
      console.error("Add Collaborator error:", error);
      setCollabLoading(false);
    }
  };

  const handleToggleShare = async () => {
    const link = await generateSharedLink(item.id, sharedLink === null);
    if (link !== undefined) {
      const newSharedLink =
        sharedLink !== null
          ? null
          : params.portalid
          ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/${params.portalid}/shared-file/${item?.id}`
          : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-file/${item?.id}`;
      // : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-file/${item?.id}`;
      setSharedLink(newSharedLink);
      if (onShareLinkToggle) {
        onShareLinkToggle(item.id, newSharedLink);
      }
    }
  };

  const generateSharedLink = async (fileId, isShareable) => {
    try {
      setCollabLoading(true);
      const requestOptions = {
        method: "GET",
      };
      const response = await fetchWrapper(
        `/api/box/files/share?fileId=${fileId}&isShareable=${isShareable}`,
        requestOptions,
        "generateSharedLink"
      );
      setCollabLoading(false);
      if (!response.ok) throw new Error("Failed to get links");
      const data = await response.json();
      return data.sharedLink;
    } catch (error) {
      console.error("Failed to get links:", error);
      setCollabLoading(false);
    }
  };

  const handelRemoveCollaborator = async (collaborator) => {
    try {
      setCollabLoading(true);
      const obj = {
        method: "DELETE",
      };
      const response = await fetchWrapper(
        `/api/box/files/share?collaboratorId=${collaborator.id}&userId=${collaborator.user.id}`,
        obj,
        "removeCollaborator"
      );
      if (!response.ok) throw new Error("Failed to remove collaborator");
      const data = await response.json();
      setCollabLoading(false);
      onAddCollaborator({
        id: collaborator.id,
        userID: collaborator.user.id,
        isForAdd: false,
      });
    } catch (error) {
      console.error("Remove collaborator error:", error);
      setCollabLoading(false);
    }
  };

  const onAddCollaborator = (collab) => {
    if (collab.isForAdd) {
      const user = usersList.find((user) => user.boxUserId == collab.userID);
      const collabIndex = collaborator.findIndex(
        (collabs) => collabs.id == collab.id
      );
      console.log("collabIndex: ^^^^^", collabIndex);
      if (collabIndex > -1) {
        collaborator[collabIndex] = {
          id: collab.id,
          role: collab.role,
          user: { name: user.name, id: user.boxUserId },
        };
      } else {
        collaborator.push({
          id: collab.id,
          role: "viewer",
          user: { name: user.name, id: user.boxUserId },
        });
      }
    } else {
      const index = collaborator.findIndex(
        (collabs) => collabs.id == collab.id
      );
      if (index > -1) {
        collaborator.splice(index, 1);
      }
    }
    setCollaborator(collaborator);
  };

  const handleRoleChange = async (event, userId, collaborationId) => {
    try {
      setCollabLoading(true);
      const newRole = event.target.value;
      const obj = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: userId,
          role: newRole,
          itemId: collaborationId,
          updateRole: true,
        }),
      };
      const response = await fetchWrapper(
        `/api/box/files/share`,
        obj,
        "changeCollaboratorRole"
      );
      if (!response.ok) throw new Error("Failed to change collaborator role");
      const data = await response.json();
      setCollabLoading(false);
      onAddCollaborator({
        id: collaborationId,
        userID: userId,
        isForAdd: true,
        role: newRole,
      });
    } catch (error) {
      console.error("Change collaborator role error:", error);
      setCollabLoading(false);
    }
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

        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {item?.name}
        </h3>

        <div className="space-y-6">
          {item?.type === "file" && (
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Share link
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => handleToggleShare()}
                    className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${sharedLink !== null ? "bg-blue-600" : "bg-gray-200"}
                    `}
                  >
                    <span
                      className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${sharedLink !== null ? "translate-x-5" : "translate-x-0"}
                      `}
                    />
                  </button>
                </div>
              </div>
              {sharedLink !== null && (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={sharedLink}
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
              )}
            </div>
          )}

          {item?.type === "folder" && (
            <div className="space-y-2">
              <label className="text-gray-800">Share with user</label>
              <div className="flex items-center gap-3">
                <Select
                  className="flex-1 py-2.5 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  classNamePrefix="Enter email address"
                  isClearable={true}
                  isSearchable={true}
                  value={userID}
                  onChange={(e) => setUserID(e)}
                  options={userList}
                />
                <button
                  onClick={handleEmailShare}
                  disabled={!userID}
                  className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                    ${
                      userID
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}
          {collaborator.slice(1).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-gray-700 py-2 pr-2">
                <div>Name</div>
                <div>Permissions</div>
                <div></div>
              </div>
              {collaborator.length > 0 &&
                collaborator.slice(1).map((content, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 text-gray-700 hover:bg-gray-50 rounded-lg py-2 pr-2 group"
                  >
                    <div>{content?.user.name}</div>
                    <div>
                      <select
                        value={content?.role}
                        onChange={(e) =>
                          handleRoleChange(e, content?.user.id, content.id)
                        }
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        {/* <option value="uploader">Uploader</option>
                        <option value="co-owner">Co-owner</option> */}
                      </select>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          handelRemoveCollaborator(content);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {collabLoading && (
          <div className="absolute top-0 left-0 rounded-xl h-full w-full bg-[#00000038] flex items-center justify-center">
            <div className="border-blue-500 w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
};

function FolderExplorer({
  fileList,
  setPath,
  path,
  currentFilesList,
  setCurrentFilesList,
  setSelectedItem,
  selectedItem,
  handleShareLink,
  onFileChanges,
  listType
}) {
  const params = useParams();
  const pathName = usePathname();
  const [previewFileId, setPreviewFileId] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDropdown, setDeleteDropdown] = useState(null);

  useEffect(() => {
    setCurrentFilesList(
      path.length === 0 ? fileList : path[path.length - 1].children
    );
    // setSelectedItem(path.length === 0 && null);
  }, [path]);

  useEffect(() => {
    fetchUser();
  }, []);

  const handleFolderClick = (folder) => {
    setSelectedItem(folder);
    setPath((prev) => [...prev, folder]);
    setDeleteDropdown(null);
  };

  const handleDelete = (file) => {
    if(listType == 'shared' && file.currentUserRole == 'viewer'){
      return
    }
    setDeleteDropdown((prev) => (prev === file.id ? null : file.id));
  };

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const handleShare = (file) => {
    setShareFile(file);
    setIsShareModalOpen(true);
  };

  // const handleDownload = async (fileId, fileName) => {
  //   try {
  //     const response = await fetchWrapper(
  //       `/api/box/download?fileId=${fileId}`,
  //       {},
  //       "download"
  //     );
  //     if (!response.ok) throw new Error("Download failed");

  //     const blob = await response.blob();
  //     const url = window.URL.createObjectURL(blob);
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.download = fileName;
  //     link.click();

  //     window.URL.revokeObjectURL(url);
  //     document.body.removeChild(link);
  //   } catch (error) {
  //     console.error("Download error:", error);
  //   }
  // };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fetchWrapper(
        `/api/box/download?fileId=${fileId}`,
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
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleShareLinkToggle = (itemId, newSharedLink) => {
    if (handleShareLink) {
      handleShareLink(itemId, newSharedLink);
    }
  };

  const fetchUser = async () => {
    try {
      const url = params.portalid ? `/api/users?portalid=${params.portalid}` : '/api/users'
      const response = await fetchWrapper(
        url,
        {},
        "fetchUserList"
      );
      if (!response.ok) throw new Error("Download failed");
      const data = await response.json();
      setUsersList(data);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleDeleteFile = async (fileId) => {
    // setCurrentFilesList((prev) => prev.filter((item) => item.id !== fileId));
    setIsLoading(true);
    try {
      const response = await fetchWrapper(
        `/api/box/files?fileId=${fileId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
        "delete-file"
      );

      if (!response.ok) throw new Error("Failed to delete file");
      setIsLoading(false);
      console.log(response.json());
      setSelectedItem(path.length === 0 ? null : path[path.length - 1]);
      setIsDeleteModalOpen(false);
      setDeleteDropdown(null);
      onFileChanges(selectedItem?.id);
    } catch (error) {
      console.error("Error deleting folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    // setCurrentFilesList((prev) => prev.filter((item) => item.id !== folderId));
    setIsLoading(true);
    try {
      const response = await fetchWrapper(
        `/api/box/folders?folderId=${folderId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
        "delete-folder"
      );

      if (!response.ok) throw new Error("Failed to delete folder");
      setIsLoading(false);
      console.log(response.json());
      setSelectedItem(path.length === 0 ? null : path[path.length - 1]);
      setIsDeleteModalOpen(false);
      setDeleteDropdown(null);
      onFileChanges(folderId);
    } catch (error) {
      console.error("Error deleting folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (file) => {
    if(file.collaborators.length>0 && file.type == 'folder'){
      const findeduser = usersList.find((user)=>user.email == file.collaborators[0].user.name);
      return findeduser ? findeduser.name : file.collaborators[0].user.name;
    } else if(file.type == 'file' && file.description != '') {
      const findeduser = usersList.find((user)=>user.email == file.description);
      return findeduser ? findeduser.name : file.description;
    } else {
      return '';
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  return (
    <>
      {currentFilesList &&
        currentFilesList.length > 0 &&
        currentFilesList.map((file, index) => {
          return (
            <React.Fragment key={index}>
              <tr className="px-3 hover:bg-gray-50 hidden md:table-row divide-gray-200 border-b border-b-gray-200 group active:bg-sky-200 active:text-sky-800 relative z-[20]">
                <td
                  className="py-3 pl-4"
                  onClick={() =>
                    file.type === "folder" && handleFolderClick(file)
                  }
                >
                  <div className="flex items-center justify-start gap-3">
                    {file.type === "folder" ? (
                      <Folder className="h-5 w-5 text-[#3c4043]" />
                    ) : (
                      <File className="h-5 w-5 text-[#3c4043]" />
                    )}
                    <p className="text-[#3c4043] mt-1 font-semibold text-sm truncate max-w-56">
                      {file?.name}
                    </p>
                  </div>
                </td>

                {/* <td className="py-3">
                <div className="flex items-center justify-start gap-2">
                  <span className="text-gray-600 text-sm">You opened</span>
                  <span className="rounded-full bg-gray-600 h-1 w-1 block"></span>
                  <span className="text-gray-600 text-sm">9:30 AM</span>
                </div>
              </td> */}

                <td className="py-3">
                  <div className="flex items-center">
                    <div>
                      <img
                        src="https://img.freepik.com/premium-vector/avatar-icon0002_750950-43.jpg?uid=R149831676&ga=GA1.1.983684055.1709024503&semt=ais_hybrid"
                        className="h-8 w-8 object-contain rounded-full mr-3"
                      />
                    </div>
                    <p className="text-gray-600 text-sm truncate max-w-40 w-full">
                      {listType == 'shared'? getUserName(file) : 'me'}
                    </p>
                  </div>
                </td>

                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <UsersRound className="h-5 w-5 text-gray-600" />
                    <p className="text-gray-600 text-sm truncate max-w-40">
                      {pathName.includes("/home")
                        ? "My Folders"
                        : "Shared with me"}
                    </p>
                  </div>
                </td>

                <td className="py-3">
                  <p className="text-gray-600 text-sm truncate max-w-40">
                    {formatDate(file.modified_at)}
                  </p>
                </td>

                <td className="py-3 pr-3">
                  <div className="flex items-center justify-end">
                    <div className="opacity-0 flex items-center justify-start gap-2 group-hover:opacity-100">
                      {/* FOR ONLY FILES */}
                      {file.type === "file" && (
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
                      )}
                      {pathName.includes("/home") && (
                        <button
                          className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(file);
                            setDeleteDropdown(null);
                          }}
                          title="Share"
                        >
                          <Share2 className="h-4 w-4 text-gray-600" />
                        </button>
                      )}
                      {file.type === "file" && (
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
                      )}
                    </div>
                    <div className="relative">
                      {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
                      <button
                        className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center relative"
                        onClick={() => handleDelete(file)}
                      >
                        <EllipsisVertical className="h-4 w-4 text-gray-600" />
                      </button>

                      {/* DELETE DROPDOWN DONE*/}
                      {deleteDropdown === file?.id && (
                        <div className="absolute top-8 left-[-120px] shadow w-40 bg-white rounded-lg z-10 overflow-hidden">
                          <button
                            className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600"
                            // onClick={() => {
                            //   if (file.type === "folder") {
                            //     handleDeleteFolder(file?.id);
                            //   } else {
                            //     handleDeleteFile(file?.id);
                            //   }
                            // }}
                            onClick={() =>
                              setIsDeleteModalOpen((prev) => !prev)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-gray-600" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>

              {/* MOBILE SCREEN */}

              <tr className="hover:bg-gray-50 overflow-x-hidden flex md:hidden shadow-md rounded-xl mt-2 divide-gray-200 active:bg-sky-200 active:text-sky-800">
                <td className="py-3 px-4 col-span-2 w-full bg-white rounded-lg">
                  <div className="flex flex-col gap-3 space-y-2 w-full">
                    <div
                      onClick={() =>
                        file.type === "folder" && handleFolderClick(file)
                      }
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {file.type === "folder" ? (
                          <Folder className="h-5 w-5 text-[#3c4043]" />
                        ) : (
                          <File className="h-5 w-5 text-[#3c4043]" />
                        )}
                        <p className="text-[#3c4043] mt-1 font-semibold text-sm truncate max-w-56">
                          {file?.name}
                        </p>
                      </div>
                      <div className="flex items-center justify-center bg-gray-50 py-8">
                        {file.type === "folder" ? (
                          <Folder className="h-10 w-10 text-[#3c4043]" />
                        ) : (
                          <File className="h-10 w-10 text-[#3c4043]" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <img
                            src="https://img.freepik.com/premium-vector/avatar-icon0002_750950-43.jpg?uid=R149831676&ga=GA1.1.983684055.1709024503&semt=ais_hybrid"
                            className="size-6 object-cover rounded-full mr-1"
                            alt="User Avatar"
                          />
                          <p className="text-gray-600 text-xs truncate max-w-40">
                            me
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <UsersRound className="size-4 text-gray-600" />
                          <p className="text-gray-600 text-xs truncate max-w-40">
                            {pathName.includes("/home")
                              ? "My Folders"
                              : "Shared with me"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        {file.type === "file" && (
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
                        )}
                        {pathName.includes("/home") && (
                          <button
                            className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(file);
                              setDeleteDropdown(null);
                            }}
                            title="Share"
                          >
                            <Share2 className="h-4 w-4 text-gray-600" />
                          </button>
                        )}
                        {file.type === "file" && (
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
                        )}
                        <button
                          className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center relative"
                          onClick={() => {
                            setIsDeleteModalOpen((prev) => !prev);
                            setDeleteDropdown(file?.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-600" />
                        </button>
                        <DeleteConfirmDialog
                          isModalOpen={isDeleteModalOpen}
                          setIsModalOpen={setIsDeleteModalOpen}
                          handleDelete={
                            file?.type === "file"
                              ? () => handleDeleteFile(deleteDropdown)
                              : () => handleDeleteFolder(deleteDropdown)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </React.Fragment>
          );
        })}

      {/* {currentFilesList && currentFilesList?.length === 0 && (
        <tr className="px-3">
          <td className="col-span-4">
            <EmptyState />
          </td>
        </tr>
      )} */}
      <tr>
        <td>
          <PreviewModal
            isOpen={isPreviewModalOpen}
            onClose={() => setIsPreviewModalOpen(false)}
            fileId={previewFileId}
          />
        </td>
        <td>
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            item={shareFile}
            onShareLinkToggle={handleShareLinkToggle}
            usersList={usersList}
          />
        </td>
      </tr>
    </>
  );
}
export default FolderExplorer;
