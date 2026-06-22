"use client";

import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Copy,
  Download,
  Ellipsis,
  EllipsisVertical,
  Eye,
  File,
  Folder,
  Send,
  Share2,
  Trash2,
  X,
  FolderInput,
  Signature,
  UserRound,
  UsersRoundIcon,
  FilePenLine,
  Pencil,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import PreviewModal from "./FileExplorer/PreviewModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Select from "react-select";
import { useParams, useRouter } from "next/navigation";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { toast } from "react-toastify";
import EmptyState from "./FileExplorer/EmptyState";
import SendforSignatureDialog from "./SendForSignature";
import { getUserData } from "@/app/lib/auth";
import SignRequestModal from "./SignRequestModal";
import { useSelector } from "react-redux";
import Button from "./Common/Elements/Button";
import Editor from "./Editor";
import RenameDocumentModal from "./Common/RenameDocumentModal";
import moment from "moment";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";

const ShareModal = ({
  isOpen,
  onClose,
  item,
  onShareLinkToggle,
  usersList,
  user,
}) => {
  const params = useParams();
  const [userID, setUserID] = useState(null);
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
  const [sendButtonLoading, setSendButtonLoading] = useState(false);

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
      label: `${`${user.firstName || ''} ${user.lastName || ''}`.trim()} (${user.email})`,
    }));

    // const loggedInUser = JSON.parse(localStorage.getItem("user"));
    const loggedInUserId = user?.boxUserId;

    const filteredUsers = users.filter((user) => user.value !== loggedInUserId);

    setUserList(filteredUsers);
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
      // setCollabLoading(true);
      setSendButtonLoading(true);
      
      // Ensure userID is not empty and has the required value property
      if (!userID || !userID.value) {
        throw new Error("Please select a user to share with");
      }
      
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
        "share-file"
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to add collaborator");
      // setCollabLoading(false);
      setSendButtonLoading(false);
      onAddCollaborator({
        id: data.response.id,
        userID: userID.value,
        isForAdd: true,
        type: item?.type,
      });
      setUserID(null); // Reset to null for react-select
      toast.success("File shared successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Add Collaborator error:", error);
      setCollabLoading(false);
      setSendButtonLoading(false);
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
        "generate-shared-link"
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
        "remove-collaborator"
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
      const user = usersList?.find((user) => user.boxUserId == collab.userID);
      const collabIndex = collaborator.findIndex(
        (collabs) => collabs.id == collab.id
      );
      if (collabIndex > -1) {
        collaborator[collabIndex] = {
          id: collab.id,
          role: collab.role,
          user: { name: user.email, id: user.boxUserId },
        };
      } else {
        collaborator.push({
          id: collab.id,
          role: role,
          user: { name: user.email, id: user.boxUserId },
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
        "change-collaborator-role"
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-xl relative max-h-[90vh] overflow-y-auto hidden-scrollbar">
        <div className="flex sticky items-center justify-between p-4 border-b bg-white top-0 z-10">
          <h3 className="text-xl font-semibold text-gray-900">
            {item?.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-600 hover:bg-gray-100 transition-colors p-1 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 p-6">
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
                                        ${sharedLink !== null
                                            ? "bg-blue-600"
                                            : "bg-gray-200"
                                        }
                                        `}
                  >
                    <span
                      className={`
                                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                            ${sharedLink !== null
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
                  <Button
                    onClick={handleCopyLink}
                    icon={Copy}
                    type="Secondary"
                    label={copied ? "Copied!" : "Copy"}
                  />
                </div>
              )}
            </div>
          )}

          {/* {item?.type === "folder" && ( */}
          <div className="space-y-2">
            <label className="text-gray-800 font-semibold">
              Share with user
            </label>
            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-center">
              <Select
                className="flex-1 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[250px]"
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
              </select>

              <Button
                 onClick={handleEmailShare}
                 disabled={!userID}
                 icon={Send}
                 type="Primary"
                 label="Send"
                 isLoading={sendButtonLoading}
              />
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
                        </select>
                        <div className="sm:opacity-0 group-hover:opacity-100 transition-opacity">
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
  const router = useRouter();
  const [previewFileId, setPreviewFileId] = useState("");
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
  const [isSignLoading, setIsSignLoading] = useState(false);
  const dropdownRef = useRef(null);
  const deleteModalRef = useRef(null);
  const nestedDropdownRef = useRef(null);
  const listContainerRef = useRef(null);
  const gridContainerRef = useRef(null);
  const { loading: isFilesLoading } = useSelector((state) => state.files);
  const { data: user } = useSelector((state) => state.user);
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editorFile, setEditorFile] = useState(null);
  const [esignAvailable, setEsignAvailable] = useState(true)
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [selectFileToRename, setSelectFileToRename] = useState(null);
  const [sortedFilesList, setSortedFilesList] = useState([])
  const [dropdownPlacement, setDropdownPlacement] = useState({
    vertical: "bottom",
    horizontal: "right",
  });
  const [gridDropdownPlacement, setGridDropdownPlacement] = useState({
    vertical: "bottom",
    horizontal: "right",
  });
  const [columnSizing, setColumnSizing] = useState({
    select: 44,
    name: 320,
    modified: 180,
    size: 120,
    actions: 220,
  });
  const [columnSizingInfo, setColumnSizingInfo] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const submenuTriggerRef = useRef(null);
  const [submenuPosition, setSubmenuPosition] = useState({
    top: 0,
    left: 0,
  });
  const fetchPage = async () => {
    try {
      if (!params?.portalid) return;
      const response = await fetchWrapper(
        `/api/pages?portalId=${
          params.portalid || "root"
        }&&page=${"esignature"}`,
        {},
        "fetch-page"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error("Failed to fetch page");
      }

      const pageAvailable = data?.data?.isPageVisible;

      setEsignAvailable(pageAvailable);
    } catch (error) {
      console.log("error: ", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
        return;
      }
      if (
        deleteModalRef.current &&
        deleteModalRef.current.contains(event.target)
      ) {
        return;
      }
      if (
        nestedDropdownRef.current &&
        nestedDropdownRef.current.contains(event.target)
      ) {
        return;
      }
      setDeleteDropdown(null);
      setIsDeleteModalOpen(false);
      seFileSelectedInGrid(null);
      submenuTriggerRef.current = null;
      setActiveSubmenu(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleFolderClick = (folder) => {
    setSelectedBulkItems([]);
    setSearchQuery("");
    setSelectedItem(folder);
    setPath((prev) => [...prev, folder]);
    setDeleteDropdown(null);
  };

  const getDropdownPlacement = (
    triggerElement,
    containerRef,
    menuHeight = 320,
    menuWidth = 176
  ) => {
    if (!triggerElement || typeof window === "undefined") {
      return { vertical: "bottom", horizontal: "right" };
    }

    const rect = triggerElement.getBoundingClientRect();
    const containerRect = containerRef?.current?.getBoundingClientRect() ?? {
      top: 0,
      left: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };

    const spaceBelow = containerRect.bottom - rect.bottom;
    const spaceAbove = rect.top - containerRect.top;
    const spaceRight = containerRect.right - rect.right;
    const spaceLeft = rect.left - containerRect.left;

    const vertical =
      spaceBelow < menuHeight && spaceAbove > spaceBelow ? "top" : "bottom";
    const horizontal =
      spaceRight < menuWidth && spaceLeft > spaceRight ? "left" : "right";

    return { vertical, horizontal };
  };

  const getSubmenuPosition = (
    triggerElement,
    submenuWidth = 192,
    submenuHeight = 170,
    offset = 4
  ) => {
    if (!triggerElement || typeof window === "undefined") {
      return { top: 0, left: 0 };
    }

    const rect = triggerElement.getBoundingClientRect();
    const openRight = rect.right + submenuWidth + offset <= window.innerWidth - 8;
    const preferredLeft = openRight
      ? rect.right + offset
      : rect.left - submenuWidth - offset;
    const left = Math.max(
      8,
      Math.min(preferredLeft, window.innerWidth - submenuWidth - 8)
    );
    const top = Math.max(
      8,
      Math.min(rect.top, window.innerHeight - submenuHeight - 8)
    );

    return { top, left };
  };

  const toggleSubmenu = (file, menuType, triggerElement) => {
    if (
      activeSubmenu?.fileId === file?.id &&
      activeSubmenu?.menuType === menuType
    ) {
      setActiveSubmenu(null);
      submenuTriggerRef.current = null;
      return;
    }

    submenuTriggerRef.current = triggerElement;
    setSubmenuPosition(getSubmenuPosition(triggerElement));
    setActiveSubmenu({
      fileId: file?.id,
      menuType,
    });
  };

  const handleDelete = (file, triggerElement) => {
    if (
      listType == "shared" &&
      file.currentUserRole == "viewer" &&
      view == "list"
    ) {
      return;
    }
    if (view === "list") {
      setDropdownPlacement(
        getDropdownPlacement(triggerElement, listContainerRef)
      );
    }
    setDeleteDropdown((prev) => (prev?.id === file?.id ? null : file));
  };

  const handleSelect = (file, triggerElement) => {
    if (view == "list") {
      return;
    }
    setGridDropdownPlacement(
      getDropdownPlacement(triggerElement, gridContainerRef)
    );
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

  const handelRemoveCollaborator = async (collaborator) => {
    console.log("collaborator", collaborator);
    try {
      const obj = {
        method: "DELETE",
      };
      const response = await fetchWrapper(
        `/api/box/files/share?collaboratorId=${collaborator.id}&userId=${collaborator.user.id}`,
        obj,
        "remove-collaborator"
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
        ? `/api/users?portalid=${params.portalid || "root"}`
        : "/api/users";
      const response = await fetchWrapper(url, {}, "fetch-user-list");
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
      return findeduser ? findeduser.email : file.collaborators[0].user.name;
    } else if (file.type == "file" && file.description != "") {
      const findeduser = usersList.find(
        (user) => user.email == file.description
      );
      return findeduser ? findeduser.email : file.description;
    } else {
      return "";
    }
  };

  const handleDeleteFile = async (file) => {
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
      setIsSignLoading(true);
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
            portal: params.portalid || "root",
            onSameDoc: false
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
          setSelectedSignUrl(currentUserReq.iframeableEmbedUrl);
          setIsSignModalOpen(true);
          setIsSignLoading(false);
        }, 2500);
      }
    } catch (error) {
      setIsSignLoading(false);
      toast.error(error.message);
    }
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
    const userData = getUserData();
    if (!userData) {
      router.push("login");
      return;
    }
    fetchUser();
    // setUser(userData);
    fetchPage();
  }, []);

  const handleSort = (columnKey) => {
    let newDirection = 'asc';
    
    if (sortConfig.key === columnKey) {
      if (sortConfig.direction === 'asc') {
        newDirection = 'desc';
      } else if (sortConfig.direction === 'desc') {
        newDirection = null;
      } else {
        newDirection = 'asc';
      }
    }
    
    setSortConfig({ key: newDirection ? columnKey : null, direction: newDirection });
  };

  useEffect(() => {
    if (currentFilesList && currentFilesList.length > 0) {
      let sortedList = [...currentFilesList];
      
      if (sortConfig.key && sortConfig.direction) {
        sortedList.sort((a, b) => {
          let aValue = a[sortConfig.key];
          let bValue = b[sortConfig.key];
          
          // Handle special cases for different data types
          if (sortConfig.key === 'name') {
            return sortConfig.direction === 'asc' 
              ? collator.compare(aValue, bValue)
              : collator.compare(bValue, aValue);
          } else if (sortConfig.key === 'size') {
            aValue = aValue || 0;
            bValue = bValue || 0;
            return sortConfig.direction === 'asc' 
              ? aValue - bValue
              : bValue - aValue;
          } else if (sortConfig.key === 'modified_at') {
            aValue = new Date(aValue || 0);
            bValue = new Date(bValue || 0);
            return sortConfig.direction === 'asc' 
              ? aValue - bValue
              : bValue - aValue;
          } else {
            // Default string comparison
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
          }
        });
      }
      
      setSortedFilesList(sortedList);
    }
  }, [currentFilesList, sortConfig]);

  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  const listTableColumns = React.useMemo(() => {
    const cols = [];
    
    if (!fromAdvisor && listType !== "shared") {
      cols.push({ id: "select", size: 44, minSize: 40, maxSize: 90, enableResizing: false });
    }
    
    cols.push({
      id: "name",
      size: 320,
      minSize: 180,
      maxSize: 700,
      enableResizing: true,
    });

    if (listType !== "loan") {
      cols.push(
        {
          id: "modified",
          size: 180,
          minSize: 130,
          maxSize: 320,
          enableResizing: true,
        },
        { 
          id: "size", 
          size: 120, 
          minSize: 90, 
          maxSize: 220, 
          enableResizing: true 
        },
        {
          id: "actions",
          size: 220,
          minSize: 160,
          maxSize: 420,
          enableResizing: false,
        }
      );
    }

    return cols;
  }, [listType, fromAdvisor]);

  const listTable = useReactTable({
    data: sortedFilesList || [],
    columns: listTableColumns,
    state: {
      columnSizing,
      columnSizingInfo,
    },
    onColumnSizingChange: setColumnSizing,
    onColumnSizingInfoChange: setColumnSizingInfo,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const getListHeader = (columnId) =>
    listTable.getFlatHeaders().find((header) => header.column.id === columnId);

  const renderColumnResizer = (columnId, ariaLabel) => {
    const header = getListHeader(columnId);
    const isResizing = !!header?.column.getIsResizing();

    if (!header || !header.column.getCanResize()) return null;

    return (
      <button
        type="button"
        className={`absolute right-0 top-0 h-full w-3 cursor-col-resize z-20 group/resizer ${
          isResizing ? "bg-blue-100/60" : "bg-transparent"
        }`}
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        onClick={(event) => event.stopPropagation()}
        aria-label={ariaLabel}
      >
        <span
          className={`block mx-auto h-full w-[2px] rounded-full ${
            isResizing ? "bg-blue-500" : "bg-gray-300 group-hover/resizer:bg-gray-500"
          }`}
        />
      </button>
    );
  };
  
  return (
    <div>
      {view === "list" && (
        <div
          ref={listContainerRef}
          className="min-h-[600px] max-h-[600px] overflow-x-auto custom-scrollbar"
        >
          <table className="min-w-full divide-y divide-gray-200 overflow-auto z-10">
            {!currentFilesList || currentFilesList?.length === 0 ? (
              <thead>
                <tr>
                  <th>
                    <EmptyState checkLoading={isFilesLoading} />
                  </th>
                </tr>
              </thead>
            ) : (
              <>
                <colgroup>
                  {!fromAdvisor && listType !== "shared" && (
                    <col style={{ width: `${getListHeader("select")?.getSize() ?? 44}px` }} />
                  )}
                  <col style={{ width: `${getListHeader("name")?.getSize() ?? 320}px` }} />
                  {listType !== "loan" && (
                    <>
                      <col style={{ width: `${getListHeader("modified")?.getSize() ?? 180}px` }} />
                      <col style={{ width: `${getListHeader("size")?.getSize() ?? 120}px` }} />
                      <col style={{ width: `${getListHeader("actions")?.getSize() ?? 220}px` }} />
                    </>
                  )}
                </colgroup>
                <thead className="custom-box-shadow">
                  <tr>
                    {!fromAdvisor && listType !== "shared" && (
                      <th className="relative py-2.5">
                        {renderColumnResizer("select", "Resize selection column")}
                      </th>
                    )}

                    <th className="relative text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                      <div className="flex items-center justify-start gap-2 mx-4">
                        <span className="block cursor-pointer hover:text-gray-900" onClick={() => handleSort('name')}>Name</span>
                        <div className="cursor-pointer" onClick={() => handleSort('name')}>
                          {sortConfig.key === 'name' ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="h-4 w-4 text-black" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-black" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      {renderColumnResizer("name", "Resize name column")}
                    </th>
                    {listType !== "loan" && (
                      <>
                        <th className="relative text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                          <div className="flex items-center justify-start gap-2 mx-4">
                            <span className="block cursor-pointer hover:text-gray-900" onClick={() => handleSort('modified_at')}>Modified</span>
                            <div className="cursor-pointer" onClick={() => handleSort('modified_at')}>
                              {sortConfig.key === 'modified_at' ? (
                                sortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4 text-black" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-black" />
                                )
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                          {renderColumnResizer("modified", "Resize modified column")}
                        </th>
                        <th className="relative text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                          <div className="flex items-center justify-start gap-2 mx-4">
                            <span className="block cursor-pointer hover:text-gray-900" onClick={() => handleSort('size')}>Size</span>
                            <div className="cursor-pointer" onClick={() => handleSort('size')}>
                              {sortConfig.key === 'size' ? (
                                sortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4 text-black" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-black" />
                                )
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                          {renderColumnResizer("size", "Resize size column")}
                        </th>
                        <th className="relative text-[#767676] text-[13px] font-normal py-2.5 text-start font-lato">
                          <span className="sr-only">Actions</span>
                          {renderColumnResizer("actions", "Resize actions column")}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>

                <tbody className="w-full divide-y divide-y-gray-200">
                  {sortedFilesList &&
                    sortedFilesList.length > 0 &&
                    sortedFilesList.map((file, index) => (
                      <tr
                        key={index}
                        className={`group hover:bg-[#e4f4ff66] border-l-2 border-l-white hover:border-l-cyan-700 active:bg-[#E4F4FF] ${selectedBulkItems.includes(file?.id) && "bg-[#e4f4ff66]"}`}
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
                            className={`text-sm text-black font-lato group-hover:text-[#1a5976] max-w-64 w-full text-start mx-4 ${file.type === "folder" ? "cursor-pointer" : "cursor-default"}`}
                            onClick={() =>
                              file?.type === "folder" && handleFolderClick(file)
                            }
                            title={file?.name}
                          >
                            <div className="flex items-center justify-start gap-3">
                              {file.type === "folder" ? (
                                <Folder className="h-5 w-5 text-[#3c4043]" />
                              ) : (
                                <File className="h-5 w-5 text-[#3c4043]" />
                              )}
                              <p className="text-[#3c4043] mt-1 font-semibold text-sm truncate max-w-56" title={file?.name}>
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
                                  : moment(file?.modified_at).fromNow(false)}
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
                                      className={`h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center ${listType === "shared" &&
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
                                      className={`h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center ${listType === "shared" ? "hidden" : ""
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
                                    className={`h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center relative z-10 ${listType === "shared" ? "hidden" : ""
                                    }`}
                                    onClick={(e) => handleDelete(file, e.currentTarget)}
                                  >
                                    <EllipsisVertical className="h-4 w-4 text-gray-600" />
                                  </button>
                                )}

                                {/* OPTION DROPDOWN DONE*/}

                                {deleteDropdown?.id === file?.id && (
                                  <div
                                    className={`absolute shadow w-40 bg-white rounded-lg z-20 ${
                                      dropdownPlacement.vertical === "top"
                                        ? "bottom-9 mb-1"
                                        : "top-9 mt-1"
                                    } ${
                                      dropdownPlacement.horizontal === "left"
                                        ? "right-0"
                                        : "left-0"
                                    }`}
                                    ref={dropdownRef}
                                  >
                                    {listType !== "shared" && (
                                      <>
                                        <button
                                          className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 rounded-lg"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMoveModalOpen((prev) => !prev);
                                            setMoveItem(file);
                                            setSelectedBulkItems([]);
                                          }}
                                        >
                                          <FolderInput className="h-4 w-4 text-gray-600" />{" "}
                                          Move
                                        </button>
                                        {file.type === "file" && esignAvailable && (
                                          <div className="relative text-gray-600">
                                            <button
                                              className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 rounded-lg"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                if (isSignLoading) return;
                                                toggleSubmenu(
                                                  file,
                                                  "sign",
                                                  event.currentTarget
                                                );
                                              }}
                                              aria-expanded={
                                                activeSubmenu?.fileId ===
                                                  file?.id &&
                                                activeSubmenu?.menuType ===
                                                  "sign"
                                              }
                                            >
                                              <Signature className="h-4 w-4 text-gray-600" />{" "}
                                              {isSignLoading ? (
                                                <>
                                                  Signing{" "}
                                                  <LoaderSpinner
                                                    size={16}
                                                    className="ml-auto text-gray-500"
                                                  />
                                                </>
                                              ) : (
                                                "Sign"
                                              )}
                                            </button>
                                            <div
                                              ref={nestedDropdownRef}
                                              style={submenuPosition}
                                              className={`fixed bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-in-out w-48 z-[1300] ${
                                                activeSubmenu?.fileId ===
                                                  file?.id &&
                                                activeSubmenu?.menuType ===
                                                  "sign"
                                                  ? "opacity-100 scale-100"
                                                  : "opacity-0 scale-95 pointer-events-none"
                                              }`}
                                            >
                                              <button
                                                className="flex items-center w-full px-4 py-2 hover:bg-gray-200 pt-1 rounded-t-md"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setIsSignatureModalOpen(
                                                    (prev) => !prev
                                                  );
                                                  setSignatureFile(file);
                                                  setSelectedBulkItems([]);
                                                  setActiveSubmenu(null);
                                                }}
                                              >
                                                <UsersRoundIcon className="h-4 w-4 mr-2 shrink-0" />
                                                Request Signature
                                              </button>

                                              <button
                                                className="flex items-center w-full px-4 py-2 hover:bg-gray-200 pt-1 rounded-b-md"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSelfSign(file);
                                                  setActiveSubmenu(null);
                                                }}
                                              >
                                                <UserRound className="h-4 w-4 mr-2" />
                                                Sign Myself
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                        {file.type === "file" && (
                                          <button
                                            className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 rounded-lg"
                                            onClick={() => {
                                              setIsEditorModalOpen(
                                                (prev) => !prev
                                              );
                                              setEditorFile(file);
                                            }}
                                          >
                                            <FilePenLine className="h-4 w-4 text-gray-600" />{" "}
                                            Edit
                                          </button>
                                        )}
                                        <button
                                          className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 rounded-lg"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsRenameModalOpen((prev) => !prev);
                                            setSelectFileToRename((prev) => prev?.id === file?.id ? null : file);
                                          }}
                                        >
                                          <Pencil className="h-4 w-4 text-gray-600" />
                                          Rename
                                        </button>
                                        <button
                                          className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 rounded-lg"
                                          onClick={(e) => {
                                            e.stopPropagation();
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
        <div
          ref={gridContainerRef}
          className="min-h-[600px] max-h-[600px] overflow-x-auto custom-scrollbar"
        >
          {!currentFilesList || currentFilesList?.length === 0 ? (
            <div className="w-full h-full flex justify-center items-center">
              <EmptyState checkLoading={loading} />
            </div>
          ) : (
            <div
              className={`grid ${cols === 2 ? `grid-cols-4` : `grid-cols-${6 - cols}`
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
                        className={`min-h-48 flex items-center justify-center bg-[#fbfbfb] ${file.type === "folder" ? "cursor-pointer" : "cursor-default"}`}
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
                      <div className="py-2 px-2.5">
                        <div className="flex items-center justify-between">
                          <h6
                            className="text-sm font-medium text-black font-lato text-ellipsis overflow-hidden whitespace-nowrap w-full"
                            title={file?.name}
                          >
                            {file?.name}
                          </h6>

                          <div className="relative">
                            <button
                              className={`h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center relative z-10  ${file.type === "folder" && listType === "shared"
                                  ? "hidden"
                                  : ""
                              }`}
                              onClick={(e) => handleSelect(file, e.currentTarget)}
                            >
                              <Ellipsis className="h-4 w-4 text-gray-600" />
                            </button>

                            {/* OPTION DROPDOWN DONE*/}

                            {fileSelectedInGrid?.id === file?.id && (
                              <div
                                className={`absolute shadow w-40 bg-white rounded-lg z-20 ${
                                  gridDropdownPlacement.vertical === "top"
                                    ? "bottom-9 mb-1"
                                    : "top-9 mt-1"
                                } ${
                                  gridDropdownPlacement.horizontal === "left"
                                    ? "right-0"
                                    : "left-0"
                                }`}
                                ref={dropdownRef}
                              >
                                {file.type === "file" && (
                                  <button
                                    className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePreview(file?.id);
                                      setDeleteDropdown(null);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 text-gray-600" />
                                    View
                                  </button>
                                )}
                                {file.type === "file" &&
                                  (listType !== "shared" ||
                                    file.currentUserRole !== "viewer") && (
                                    <button
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
                                    </button>
                                  )}

                                {listType !== "shared" && (
                                  <button
                                    className={`hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 ${file.currentUserRole === "viewer"
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
                                  </button>
                                )}

                                {listType !== "shared" && (
                                  <button
                                    className={`hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 ${listType === "shared" ? "hidden" : ""
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsMoveModalOpen((prev) => !prev);
                                      setMoveItem(file);
                                      setSelectedBulkItems([]);
                                    }}
                                  >
                                    <FolderInput className="h-4 w-4 text-gray-600" />{" "}
                                    Move
                                  </button>
                                )}
                                {listType !== "shared" &&
                                  file.type === "file" && esignAvailable && (
                                    <div className="relative text-gray-600">
                                      <button
                                        className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 "
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          if (isSignLoading) return;
                                          toggleSubmenu(
                                            file,
                                            "sign",
                                            event.currentTarget
                                          );
                                        }}
                                        aria-expanded={
                                          activeSubmenu?.fileId === file?.id &&
                                          activeSubmenu?.menuType === "sign"
                                        }
                                      >
                                        <Signature className="h-4 w-4 text-gray-600" />{" "}
                                        {isSignLoading ? (
                                          <>
                                            Signing{" "}
                                            <LoaderSpinner
                                              size={16}
                                              className="ml-auto text-gray-500"
                                            />
                                          </>
                                        ) : (
                                          "Sign"
                                        )}
                                      </button>
                                      <div
                                        ref={nestedDropdownRef}
                                        style={submenuPosition}
                                        className={`fixed bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-in-out w-48 z-[1300] ${
                                          activeSubmenu?.fileId === file?.id &&
                                          activeSubmenu?.menuType === "sign"
                                            ? "opacity-100 scale-100"
                                            : "opacity-0 scale-95 pointer-events-none"
                                        }`}
                                      >
                                        <button
                                          className="flex items-center w-full px-4 py-2 hover:bg-gray-200 pt-1 rounded-t-md"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsSignatureModalOpen(
                                              (prev) => !prev
                                            );
                                            setSignatureFile(file);
                                            setSelectedBulkItems([]);
                                            setActiveSubmenu(null);
                                          }}
                                        >
                                          <UsersRoundIcon className="h-4 w-4 mr-2" />
                                          Request Signature
                                        </button>

                                        <button
                                          className="flex items-center w-full px-4 py-2 hover:bg-gray-200 pt-1 rounded-b-md"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelfSign(file);
                                            setActiveSubmenu(null);
                                          }}
                                        >
                                          <UserRound className="h-4 w-4 mr-2" />
                                          Sign Myself
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                {file.type === "file" && (
                                  <button
                                    className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 rounded-lg"
                                    onClick={() => {
                                      setIsEditorModalOpen(
                                        (prev) => !prev
                                      );
                                      setEditorFile(file);
                                    }}
                                  >
                                    <FilePenLine className="h-4 w-4 text-gray-600" />{" "}
                                    Edit
                                  </button>
                                )}
                                {listType !== "shared" && (
                                  <button
                                    className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 rounded-lg"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setIsRenameModalOpen((prev) => !prev);
                                     setSelectFileToRename(file);
                                   }}
                                  >
                                    <Pencil className="h-4 w-4 text-gray-600" />
                                    Rename
                                  </button>
                                )}
                                <button
                                  className={`hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600 ${listType === "shared" ? "hidden" : ""
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsDeleteModalOpen((prev) => !prev);
                                    setDeleteDropdown(file);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-gray-600" />{" "}
                                  Delete
                                </button>
                              </div>
                            )}

                           
                          </div>
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
       <DeleteConfirmDialog
          isModalOpen={isDeleteModalOpen}
          setIsModalOpen={setIsDeleteModalOpen}
          handleDelete={
            deleteDropdown?.type === "file"
              ? () => handleDeleteFile(deleteDropdown)
              : () => handleDeleteFolder(deleteDropdown)
          }
          isLoading={isLoading}
          modalRef={deleteModalRef}
        />
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
      {isEditorModalOpen && (
        <Editor
          isModalOpen={isEditorModalOpen}
          setIsModalOpen={setIsEditorModalOpen}
          item={editorFile}
          selectedItem={selectedItem}
        />
      )}

      <RenameDocumentModal 
        isOpen={isRenameModalOpen}
        onClose={() => {setIsRenameModalOpen(false); setSelectFileToRename(null)}}
        item={selectFileToRename}
        onFileRename={onFileChanges}
      />
    </div>
  );
}
export default SharedFolderExplorer;
