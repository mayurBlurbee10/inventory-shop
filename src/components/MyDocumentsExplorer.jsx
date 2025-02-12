"use client";

import {
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Ellipsis,
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
  FolderPen,
  FilePen,
  FolderInput,
  Signature,
  Loader2,
  UserRound,
  UsersRoundIcon,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import PreviewModal from "./FileExplorer/PreviewModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Select from "react-select";
import { useParams, useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { toast } from "react-toastify";
import EmptyState from "./FileExplorer/EmptyState";
import CreateFolder from "./CreateFolder";
import SendforSignatureDialog from "./SendForSignature";
import { getUserData } from "@/app/lib/auth";
import { UserRole } from "@/config/constants";
import SignRequestModal from "./SignRequestModal";
import { Menu, MenuItem, MenuItems, MenuButton } from "@headlessui/react";

const ShareModal = ({
  isOpen,
  onClose,
  item,
  onShareLinkToggle,
  usersList,
  user,
}) => {
  const params = useParams();
  const [userID, setUserID] = useState("");
  const [copied, setCopied] = useState(false);
  const [userList, setUserList] = useState([]);
  const [role, setRole] = useState("viewer");

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
    setCollaborator(
      item?.collaborators
        ? item.collaborators?.filter(
            (collab) => collab?.user.id !== user.boxUserId
          )
        : []
    );
  }, [item]);

  useEffect(() => {
    const users = usersList.map((user) => ({
      value: user.boxUserId,
      label: `${user.name} (${user.email})`,
    }));

    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    const loggedInUserId = loggedInUser?.boxUserId;

    const filteredUsers = users.filter((user) => user.value !== loggedInUserId);

    setUserList(filteredUsers);
    console.log("Filtered userList:", filteredUsers);
    console.log("loggedInUser:", loggedInUser);
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
          role: role,
          itemId: item?.id,
          type: item?.type,
        }),
      };
      const response = await fetchWrapper(
        `/api/box/files/share`,
        obj,
        "addCollaborator"
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to add collaborator");
      setCollabLoading(false);
      onAddCollaborator({
        id: data.response.id,
        userID: userID.value,
        isForAdd: true,
        type: item?.type,
      });
      setUserID("");
      toast.success("File shared successfully");
    } catch (error) {
      toast.error(error.message);
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
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get links");
      toast.success(data.message || "File share link generated successfully");
      return data.sharedLink;
    } catch (error) {
      toast.error(error.message);
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
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to remove collaborator");
      setCollabLoading(false);
      onAddCollaborator({
        id: collaborator.id,
        userID: collaborator.user.id,
        isForAdd: false,
      });
      toast.success(data.message || "Collaborator removed successfully");
    } catch (error) {
      toast.error(error.message);
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
      if (collabIndex > -1) {
        collaborator[collabIndex] = {
          id: collab.id,
          role: collab.role,
          user: { name: user.name, id: user.boxUserId },
        };
      } else {
        collaborator.push({
          id: collab.id,
          role: role,
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
    console.log("collaborator:", collaborator);
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
          type: item?.type,
        }),
      };
      const response = await fetchWrapper(
        `/api/box/files/share`,
        obj,
        "changeCollaboratorRole"
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to change collaborator role");
      setCollabLoading(false);
      onAddCollaborator({
        id: collaborationId,
        userID: userId,
        isForAdd: true,
        role: newRole,
        type: item?.type,
      });
      toast.success(data.message || "Collaborator Role Changed");
    } catch (error) {
      toast.error(error.message);
      console.error("Change collaborator role error:", error);
      setCollabLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-xl relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-semibold text-gray-900 mb-4">
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
                                        ${
                                          sharedLink !== null
                                            ? "bg-blue-600"
                                            : "bg-gray-200"
                                        }
                                        `}
                  >
                    <span
                      className={`
                                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                            ${
                                              sharedLink !== null
                                                ? "translate-x-5"
                                                : "translate-x-0"
                                            }
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

          {/* {item?.type === "folder" && ( */}
          <div className="space-y-2">
            <label className="text-gray-800 font-semibold">
              Share with user
            </label>
            <div className="flex items-center gap-3">
              <Select
                className="flex-1 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                classNamePrefix="Enter email address"
                isClearable={true}
                isSearchable={true}
                value={userID}
                onChange={(e) => setUserID(e)}
                options={userList}
              />
              <select
                className="py-2 px-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md text-gray-700"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                {/* <option value="uploader">Uploader</option>
                        <option value="co-owner">Co-owner</option> */}
              </select>
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
          {/* )} */}
          {/* {collaborator.slice(1).length > 0 && ( */}
          {collaborator.length > 0 && (
            <div>
              <div className="text-gray-700 py-2 pr-2 grid grid-cols-2">
                <div className="font-semibold">Name</div>
                <div className="font-semibold">Permissions</div>
                <div></div>
              </div>
              {collaborator.length > 0 &&
                // collaborator.slice(1).map((content, idx) => (
                collaborator.map((content, idx) => {
                  // if (content?.user.id !== user.boxUserId) {
                  return (
                    <div
                      key={idx}
                      className="text-gray-700 hover:bg-gray-50 rounded-lg py-2 pr-2 group grid grid-cols-2"
                    >
                      <div className="flex items-center">
                        {content?.user.name}
                      </div>
                      <div className="flex items-center justify-between">
                        <select
                          className="py-2 px-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
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
                    </div>
                  );
                  // }
                })}
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

function SharedFolderExplorer({
  fileList,
  setPath,
  path,
  currentFilesList,
  setCurrentFilesList,
  setSelectedItem,
  selectedItem,
  handleShareLink,
  onFileChanges,
  listType,
  setSearchQuery,
  view,
  cols,
  setMoveItem,
  setSelectedBulkItems,
  selectedBulkItems,
  setIsMoveModalOpen,
  fromAdvisor,
  loading,
}) {
  const params = useParams();
  const pathName = usePathname();
  const router = useRouter();
  const [previewFileId, setPreviewFileId] = useState("");
  const [user, setUser] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDropdown, setDeleteDropdown] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureFile, setSignatureFile] = useState(null);
  const [fileSelectedInGrid, seFileSelectedInGrid] = useState(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedSignUrl, setSelectedSignUrl] = useState(null);

  const handleFolderClick = (folder) => {
    setSelectedBulkItems([]);
    setSearchQuery("");
    setSelectedItem(folder);
    setPath((prev) => [...prev, folder]);
    setDeleteDropdown(null);
  };

  const handleDelete = (file) => {
    if (
      listType == "shared" &&
      file.currentUserRole == "viewer" &&
      view == "list"
    ) {
      return;
    }
    setDeleteDropdown((prev) => (prev?.id === file?.id ? null : file));
  };

  const handleSelect = (file) => {
    if (view == "list") {
      return;
    }
    seFileSelectedInGrid((prev) => (prev?.id === file?.id ? null : file));
  };

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const handleShare = (file) => {
    if (listType == "shared" && file.currentUserRole == "viewer") {
      return;
    }
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

  const handelRemoveCollaborator = async (collaborator) => {
    console.log("collaborator", collaborator);
    try {
      const obj = {
        method: "DELETE",
      };
      const response = await fetchWrapper(
        `/api/box/files/share?collaboratorId=${collaborator.id}&userId=${collaborator.user.id}`,
        obj,
        "removeCollaborator"
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to remove collaborator");
    } catch (error) {
      toast.error(error.message);
      console.error("Remove collaborator error:", error);
    }
  };

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
      toast.success("File dowloaded successfully");
    } catch (error) {
      toast.error(error.message);
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
      const url = params.portalid
        ? `/api/users?portalid=${params.portalid || "default"}`
        : "/api/users";
      const response = await fetchWrapper(url, {}, "fetchUserList");
      if (!response.ok) throw new Error("Download failed");
      const data = await response.json();
      setUsersList(data);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const getUserName = (file) => {
    if (file?.collaborators?.length > 0 && file.type == "folder") {
      const findeduser = usersList.find(
        (user) => user.email == file.collaborators[0].user.name
      );
      return findeduser ? findeduser.name : file.collaborators[0].user.name;
    } else if (file.type == "file" && file.description != "") {
      const findeduser = usersList.find(
        (user) => user.email == file.description
      );
      return findeduser ? findeduser.name : file.description;
    } else {
      return "";
    }
  };

  const handleDeleteFile = async (file) => {
    // setCurrentFilesList((prev) => prev.filter((item) => item.id !== fileId));
    setIsLoading(true);
    try {
      const filterBoxUser = (collabIds) => {
        return collabIds?.filter((item) => item?.user.id !== user?.boxUserId);
      };
      const parentCollaboratorIds = path
        .map((item) => filterBoxUser(item.collaborators))
        .flat()
        .map((collab) => collab.id);

      console.log("parentCollaboratorIds", parentCollaboratorIds);
      console.log("file?.collaborators", file?.collaborators);

      const hasParentCollaborator =
        file?.collaborators &&
        filterBoxUser(file?.collaborators).some((collab) =>
          parentCollaboratorIds.includes(collab.id)
        );

      console.log("hasParentCollaborator", hasParentCollaborator);

      if (hasParentCollaborator) {
        console.log(
          "A parent or sub-parent folder already has this collaborator. Skipping removal."
        );
      } else {
        if (file?.collaborators?.length > 0) {
          await Promise.all(
            file.collaborators.map((collab) => handelRemoveCollaborator(collab))
          );
          console.log("Collaborators removed from the current file.");
        }
      }

      const response = await fetchWrapper(
        `/api/box/files?fileId=${file?.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
        "delete-file"
      );

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to delete file");
      setSelectedItem(path.length === 0 ? null : path[path.length - 1]);
      setIsDeleteModalOpen(false);
      setDeleteDropdown(null);
      onFileChanges(selectedItem?.id);
      toast.success(data.message || "File deleted Successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error deleting file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFolder = async (folder) => {
    // setCurrentFilesList((prev) => prev.filter((item) => item.id !== folderId));
    setIsLoading(true);
    try {
      const response = await fetchWrapper(
        `/api/box/folders?folderId=${folder?.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
        "delete-folder"
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to delete folder");
      setIsLoading(false);
      setSelectedItem(path.length === 0 ? null : path[path.length - 1]);
      setIsDeleteModalOpen(false);
      setDeleteDropdown(null);
      onFileChanges(folder?.id);
      toast.success(data.message || "Folder deleted Successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error deleting folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelfSign = async (file) => {
    try {
      setIsLoading(true);
      const response = await fetchWrapper(
        "/api/box/e-sign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileId: file.id,
            signers: [
              {
                signerEmail: user.email,
                signerId: user.id,
              },
            ],
            boxUserId: user.boxUserId,
            portal: params.portalid,
            onSameDoc: false,
          }),
        },
        "self-esign-request"
      );
      const data = await response.json();
      console.log("data: ", data);
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate e-sign request");
      }
      toast.success("E-sign request generated successfully.");
      const currentUserReq = data.data[0].signers.find(
        (item) => item.email === user.email
      );
      if (currentUserReq) {
        setTimeout(() => {
          setSelectedSignUrl(currentUserReq.iframeable_embed_url);
          setIsSignModalOpen(true);
          setIsLoading(false);
        }, 2500);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(date);
  };

  function formatSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);

    return `${size} ${units[i]}`;
  }

  const handleCheckboxChange = (id, isChecked) => {
    setSelectedBulkItems((prevSelected) =>
      isChecked
        ? [...prevSelected, id]
        : prevSelected.filter((itemId) => itemId !== id)
    );
  };

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem("user"));
    if (loggedInUser) {
      fetchUser();
    }
    const userData = getUserData();
    if (!userData) {
      router.push("login");
      return;
    }
    setUser(userData);
  }, []);

  if (isLoading) {
    return (
      isLoading && (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="ml-2 text-gray-500">Loading...</p>
        </div>
      )
    );
  }

  return (
    <div>
      {view === "list" && (
        <div className="min-h-[450px] max-h-[600px] overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200 overflow-auto z-10">
            {!currentFilesList || currentFilesList?.length === 0 ? (
              <thead>
                <tr>
                  <th>
                    <EmptyState checkLoading={loading} />
                  </th>
                </tr>
              </thead>
            ) : (
              <>
                <thead className="custom-box-shadow">
                  <tr>
                    {!fromAdvisor && listType !== "shared" && <th></th>}

                    <th className="text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                      <div className="flex items-center justify-start gap-2  mx-4">
                        <span className="block">Name</span>
                        <button className="flex items-center justify-center">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button className="flex items-center justify-center">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </th>
                    {listType !== "loan" && (
                      <>
                        <th className="text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                          <span className="block mx-4">Modified</span>
                        </th>
                        <th className="text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                          <span className="block mx-4">Size</span>
                        </th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody className="w-full divide-y divide-y-gray-200">
                  {currentFilesList &&
                    currentFilesList.length > 0 &&
                    currentFilesList.map((file, index) => (
                      <tr
                        key={index}
                        className="group hover:bg-[#e4f4ff66] border-l-2 border-l-white hover:border-l-cyan-700 active:bg-[#e4f4ff]"
                      >
                        {!fromAdvisor && listType !== "shared" && (
                          <td className="py-3 pl-4">
                            <input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-blue-600 cursor-pointer"
                              checked={selectedBulkItems.includes(file?.id)}
                              onChange={(e) =>
                                handleCheckboxChange(file?.id, e.target.checked)
                              }
                            />
                          </td>
                        )}

                        <td className="py-1">
                          <button
                            className="text-sm text-black font-lato group-hover:text-[#1a5976] max-w-64 w-full text-start mx-4"
                            onClick={() =>
                              file?.type === "folder" && handleFolderClick(file)
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
                          </button>
                        </td>
                        {listType !== "loan" && (
                          <>
                            <td className="py-1">
                              <p className="text-sm text-[#767676] font-lato group-hover:text-[#1a5976] mx-4">
                                {/* today by Wealthportal Service Account */}
                                {listType === "shared"
                                  ? getUserName(file)
                                  : `today by Wealthportal Service Account`}
                              </p>
                            </td>
                            <td>
                              <p className="text-sm text-[#767676] font-lato group-hover:text-[#1a5976]">
                                {/* 100.7 KB */}
                                {formatSize(file?.size)}
                              </p>
                            </td>
                          </>
                        )}
                        {listType !== "loan" && (
                          <td className="py-1 pr-4 pl-10">
                            <div className="flex items-center justify-end">
                              <div className="flex items-center justify-start gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                <div className="flex items-center justify-start gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                  {/* FOR ONLY FILES */}
                                  {file.type === "file" && !fromAdvisor && (
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

                                  {file.type === "file" && !fromAdvisor && (
                                    <button
                                      className={`h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center ${
                                        listType === "shared" &&
                                        file.currentUserRole === "viewer"
                                          ? "hidden"
                                          : ""
                                      }`}
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

                                  {!fromAdvisor && (
                                    <button
                                      className={`h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center ${
                                        listType === "shared" ? "hidden" : ""
                                      } `}
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
                                </div>
                              </div>

                              <div className="relative">
                                {!fromAdvisor && (
                                  <button
                                    className={`h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center relative z-10 ${
                                      listType === "shared" ? "hidden" : ""
                                    }`}
                                    onClick={() => handleDelete(file)}
                                  >
                                    <EllipsisVertical className="h-4 w-4 text-gray-600" />
                                  </button>
                                )}

                                {/* OPTION DROPDOWN DONE*/}

                                {deleteDropdown?.id === file?.id && (
                                  <div className="absolute top-8 right-0 shadow w-40 bg-white rounded-lg z-20">
                                    {listType !== "shared" && (
                                      <>
                                        <button
                                          className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600"
                                          onClick={() => {
                                            setIsMoveModalOpen((prev) => !prev);
                                            setMoveItem(file);
                                            setSelectedBulkItems([]);
                                          }}
                                        >
                                          <FolderInput className="h-4 w-4 text-gray-600" />{" "}
                                          Move
                                        </button>
                                        {file.type === "file" && (
                                          <div className="relative group/sign text-gray-600">
                                            <button className="group/sign hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 ">
                                              <Signature className="h-4 w-4 text-gray-600" />{" "}
                                              Sign
                                            </button>
                                            <div className="absolute top-0 right-full bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-in-out opacity-0 scale-95 group-hover/sign:opacity-100 group-hover/sign:scale-100 w-48">
                                              <button
                                                className="flex items-center w-full px-4 py-2 hover:bg-gray-200 pt-1"
                                                onClick={() => {
                                                  setIsSignatureModalOpen(
                                                    (prev) => !prev
                                                  );
                                                  setSignatureFile(file);
                                                  setSelectedBulkItems([]);
                                                }}
                                              >
                                                <UsersRoundIcon className="h-4 w-4 mr-2" />
                                                Request Signature
                                              </button>

                                              <button
                                                className="flex items-center w-full px-4 py-2 hover:bg-gray-200 pt-1"
                                                onClick={() =>
                                                  handleSelfSign(file)
                                                }
                                              >
                                                <UserRound className="h-4 w-4 mr-2" />
                                                Sign Myself
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        <button
                                          className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600"
                                          // onClick={() => {
                                          //   if (file.type === "folder") {
                                          //     handleDeleteFolder(file?.id);
                                          //   } else {
                                          //     handleDeleteFile(file?.id);
                                          //   }
                                          // }}
                                          onClick={() => {
                                            setIsDeleteModalOpen(
                                              (prev) => !prev
                                            );
                                            setDeleteDropdown(file);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-gray-600" />{" "}
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}

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
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </>
            )}
          </table>
        </div>
      )}

      {view === "grid" && (
        <div className="min-h-[450px] max-h-[600px] overflow-x-auto custom-scrollbar">
          {!currentFilesList || currentFilesList?.length === 0 ? (
            <div className="w-full h-full flex justify-center items-center">
              <EmptyState checkLoading={loading} />
            </div>
          ) : (
            <div
              className={`grid ${
                cols === 2 ? `grid-cols-4` : `grid-cols-${6 - cols}`
              } gap-5 p-5`}
            >
              {currentFilesList &&
                currentFilesList.length > 0 &&
                currentFilesList.map((file, index) => (
                  // <div className={`grid grid-cols-${6 - cols} gap-5`} key={index}>
                  <div
                    key={index}
                    className={`col-span-${6 - cols} md:col-span-1`}
                  >
                    <div
                      className={`border border-[#e8e8e8] card-shadow hover:border-sky-500`}
                    >
                      <div
                        className="min-h-48 flex items-center justify-center bg-[#fbfbfb]"
                        onClick={() =>
                          file?.type === "folder" && handleFolderClick(file)
                        }
                      >
                        <div className="max-h-24 max-w-[80px] h-full w-full">
                          {/* <Folder className="flex-auto h-full w-full text-blue-500" /> */}
                          {file.type === "folder" ? (
                            <Folder className="flex-auto h-full w-full text-blue-500" />
                          ) : (
                            <File className="flex-auto h-full w-full text-blue-500" />
                          )}
                        </div>
                      </div>
                      <div className="py-2 px-2.5 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <h6
                            className="text-sm font-medium text-black font-lato text-ellipsis overflow-hidden whitespace-nowrap w-full"
                            // onClick={() =>
                            //     file?.type === "folder" && handleFolderClick(file)
                            // }
                          >
                            {file?.name}
                          </h6>

                          <Menu className="relative">
                            <MenuButton
                              className={`h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center relative z-10  ${
                                file.type === "folder" && listType === "shared"
                                  ? "hidden"
                                  : ""
                              }`}
                              onClick={() => handleSelect(file)}
                            >
                              <Ellipsis className="h-4 w-4 text-gray-600" />
                            </MenuButton>

                            {/* OPTION DROPDOWN DONE*/}

                            {fileSelectedInGrid?.id === file?.id && (
                              <MenuItems className="absolute top-8 left-[-120px] shadow w-40 bg-white rounded-lg z-20 overflow-hidden">
                                {file.type === "file" && (
                                  <MenuButton
                                    className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreview(file?.id);
                                      setDeleteDropdown(null);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-gray-600" />
                                    View
                                  </MenuButton>
                                )}
                                {file.type === "file" &&
                                  (listType !== "shared" ||
                                    file.currentUserRole !== "viewer") && (
                                    <MenuButton
                                      className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(file.id, file.name);
                                        setDeleteDropdown(null);
                                      }}
                                      title="Download"
                                    >
                                      <Download className="h-4 w-4 text-gray-600" />
                                      Download
                                    </MenuButton>
                                  )}

                                {listType !== "shared" && (
                                  <MenuButton
                                    className={`hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 ${
                                      file.currentUserRole === "viewer"
                                        ? "hidden"
                                        : ""
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShare(file);
                                      setDeleteDropdown(null);
                                    }}
                                    title="Share"
                                  >
                                    <Share2 className="h-4 w-4 text-gray-600" />{" "}
                                    Share
                                  </MenuButton>
                                )}

                                {listType !== "shared" && (
                                  <MenuButton
                                    className={`hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 ${
                                      listType === "shared" ? "hidden" : ""
                                    }`}
                                    onClick={() => {
                                      setIsMoveModalOpen((prev) => !prev);
                                      setMoveItem(file);
                                      setSelectedBulkItems([]);
                                    }}
                                  >
                                    <FolderInput className="h-4 w-4 text-gray-600" />{" "}
                                    Move
                                  </MenuButton>
                                )}
                                {listType !== "shared" &&
                                  file.type === "file" && (
                                    <MenuItem>
                                      {() => (
                                        <div className="relative group/sign">
                                          <button
                                            className={`hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 ${
                                              listType === "shared"
                                                ? "hidden"
                                                : ""
                                            }`}
                                          >
                                            <Signature className="h-4 w-4 text-gray-600" />
                                            Sign
                                          </button>
                                          <div className="absolute top-0 right-full hidden group-hover/sign:block bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none w-48">
                                            <MenuItem>
                                              <button
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                                                onClick={() => {
                                                  setIsSignatureModalOpen(
                                                    (prev) => !prev
                                                  );
                                                  setSignatureFile(file);
                                                  setSelectedBulkItems([]);
                                                }}
                                              >
                                                <UsersRoundIcon className="h-4 w-4 mr-2 text-gray-600" />
                                                Request Signature
                                              </button>
                                            </MenuItem>
                                            <MenuItem>
                                              <button
                                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                                                onClick={() =>
                                                  handleSelfSign(file)
                                                }
                                              >
                                                <UserRound className="h-4 w-4 mr-2 text-gray-600" />
                                                Sign Myself
                                              </button>
                                            </MenuItem>
                                          </div>
                                        </div>
                                      )}
                                    </MenuItem>
                                  )}
                                <button
                                  className={`hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 ${
                                    listType === "shared" ? "hidden" : ""
                                  }`}
                                  // onClick={() => {
                                  //   if (file.type === "folder") {
                                  //     handleDeleteFolder(file?.id);
                                  //   } else {
                                  //     handleDeleteFile(file?.id);
                                  //   }
                                  // }}
                                  onClick={() => {
                                    setIsDeleteModalOpen((prev) => !prev);
                                    setDeleteDropdown(file);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-gray-600" />{" "}
                                  Delete
                                </button>
                              </MenuItems>
                            )}

                            <DeleteConfirmDialog
                              isModalOpen={isDeleteModalOpen}
                              setIsModalOpen={setIsDeleteModalOpen}
                              handleDelete={
                                file?.type === "file"
                                  ? () => handleDeleteFile(deleteDropdown)
                                  : () => handleDeleteFolder(deleteDropdown)
                              }
                              isLoading={isLoading}
                            />
                          </Menu>
                        </div>
                        <p className="text-xs text-gray-500 font-lato text-ellipsis overflow-hidden whitespace-nowrap w-full">
                          Modified today by Wealthportal Service Account
                        </p>
                        <p className="text-xs text-gray-500 font-lato ">
                          {formatSize(file?.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* {currentFilesList && currentFilesList?.length === 0 && (
        <tr className="px-3">
          <td className="col-span-4">
            <EmptyState />
          </td>
        </tr>
      )}
            <tr>
        <td>
        </td>
        <td>
        </td>
      </tr> */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        fileId={previewFileId}
      />
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        item={shareFile}
        onShareLinkToggle={handleShareLinkToggle}
        usersList={usersList}
        user={user}
      />
      <SendforSignatureDialog
        item={signatureFile}
        usersList={usersList}
        isModalOpen={isSignatureModalOpen}
        setIsModalOpen={setIsSignatureModalOpen}
      />
      <SignRequestModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        signUrl={selectedSignUrl}
      />
    </div>
  );
}
export default SharedFolderExplorer;
