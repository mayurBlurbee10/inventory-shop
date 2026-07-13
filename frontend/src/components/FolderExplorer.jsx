"use client";

import {
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  File,
  Folder,
  Send,
  Share2,
  Trash2,
  UsersRound,
  X,
  FolderInput,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import PreviewModal from "./FileExplorer/PreviewModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import ReactSelect from "react-select";
import { useParams, usePathname, useRouter } from "next/navigation";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { ThemeSwitch } from "./ui/theme-switch";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import { getUserData } from "@/app/lib/auth";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";

const shareSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "40px",
    height: "40px",
    backgroundColor: "hsl(var(--background))",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    boxShadow: state.isFocused ? "0 0 0 3px hsl(var(--ring) / 0.5)" : "none",
    borderRadius: "0.5rem",
    "&:hover": {
      borderColor: "hsl(var(--border))",
    },
  }),
  valueContainer: (base) => ({
    ...base,
    height: "40px",
    padding: "0 0.75rem",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "40px",
  }),
  singleValue: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  input: (base) => ({
    ...base,
    color: "hsl(var(--foreground))",
  }),
  placeholder: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    overflow: "hidden",
    zIndex: 50,
  }),
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  menuList: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--popover))",
    padding: "0.25rem",
  }),
  option: (base, state) => ({
    ...base,
    borderRadius: "0.375rem",
    backgroundColor: state.isSelected
      ? "hsl(var(--accent))"
      : state.isFocused
        ? "hsl(var(--accent) / 0.7)"
        : "transparent",
    color:
      state.isSelected || state.isFocused
        ? "hsl(var(--accent-foreground))"
        : "hsl(var(--foreground))",
    cursor: "pointer",
    "&:active": {
      backgroundColor: "hsl(var(--accent))",
    },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--border))",
  }),
};
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
      label: `${`${user.firstName || ''} ${user.lastName || ''}`.trim()} (${user.email})`,
    }));
    setUserList(users);
  }, [usersList]);

  const handleCopyLink = () => {
    if (sharedLink) {
      navigator.clipboard.writeText(sharedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailShare = async () => {
    try {
      if (!userID?.value) {
        throw new Error("Please select a user to share with");
      }
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
      setCollabLoading(false);
      onAddCollaborator({
        id: data.response.id,
        userID: userID.value,
        isForAdd: true,
        type: item?.type,
      });
      setUserID(null);
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
      const user = usersList.find((user) => user.boxUserId == collab.userID);
      const collabIndex = collaborator.findIndex(
        (collabs) => collabs.id == collab.id
      );
      if (collabIndex > -1) {
        collaborator[collabIndex] = {
          id: collab.id,
          role: collab.role,
          user: { firstName: user.firstName, lastName: user.lastName, id: user.boxUserId },
          type: collab.type,
        };
      } else {
        collaborator.push({
          id: collab.id,
          role: "viewer",
          user: { firstName: user.firstName, lastName: user.lastName, id: user.boxUserId },
          type: collab.type,
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

  const handleRoleChange = async (newRole, userId, collaborationId) => {
    try {
      setCollabLoading(true);
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/30"
        className="relative w-full max-w-xl max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-xl"
      >
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between space-y-0 border-b border-border bg-card p-4">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {item?.name}
          </DialogTitle>
          <Button
            type="button"
            variant="icons"
            onClick={onClose}
            className="rounded-full text-muted-foreground hover:bg-accent"
            aria-label="Close"
          >
            <X size={20} />
          </Button>
        </DialogHeader>

        <div className="space-y-6 bg-card p-6">
          {item?.type === "file" && (
            <div className="space-y-2">
              <div className="flex gap-4">
                <Label className="text-sm font-medium text-foreground">
                  Share link
                </Label>
                <div className="flex items-center">
                  <ThemeSwitch
                    checked={sharedLink !== null}
                    onCheckedChange={() => handleToggleShare()}
                  />
                </div>
              </div>
              {sharedLink !== null && (
                <div className="flex h-10 items-stretch gap-3">
                  <Input
                    type="text"
                    value={sharedLink}
                    readOnly
                    className="h-full flex-1 border-border bg-muted text-foreground"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="!h-full !min-h-0 shrink-0 !px-3 !py-0"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-semibold text-foreground">
              Share with user
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <ReactSelect
                className="min-w-[250px] flex-1 text-sm"
                classNamePrefix="share-user-select"
                isClearable
                isSearchable
                value={userID}
                onChange={(e) => setUserID(e)}
                options={userList}
                placeholder="Enter email address"
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                menuPlacement="auto"
                styles={shareSelectStyles}
              />
              <Button
                type="button"
                onClick={handleEmailShare}
                disabled={!userID}
                className="h-10 shrink-0 !px-3 !py-3"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </div>

          {collaborator.length > 0 && (
            <div>
              <div className="grid grid-cols-2 py-2 pr-2 text-foreground">
                <div className="font-semibold">Name</div>
                <div className="font-semibold">Permissions</div>
              </div>
              {collaborator.map((content, idx) => (
                <div
                  key={idx}
                  className="group grid grid-cols-2 rounded-lg py-2 pr-2 text-foreground hover:bg-accent"
                >
                  <div className="flex items-center">{content?.user.name}</div>
                  <div className="flex items-center justify-between gap-2">
                    <Select
                      value={content?.role}
                      onValueChange={(newRole) =>
                        handleRoleChange(newRole, content?.user.id, content.id)
                      }
                    >
                      <SelectTrigger className="h-9 bg-card px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-popover text-popover-foreground">
                        <SelectItem
                          value="viewer"
                          className="focus:bg-accent focus:text-accent-foreground"
                        >
                          Viewer
                        </SelectItem>
                        <SelectItem
                          value="editor"
                          className="focus:bg-accent focus:text-accent-foreground"
                        >
                          Editor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="opacity-0 transition-opacity group-hover:opacity-100">
                      <AppTooltip label="Remove">
                        <Button
                          type="button"
                          variant="icons"
                          size="icon-sm"
                          onClick={() => handelRemoveCollaborator(content)}
                          className="text-muted-foreground hover:bg-accent"
                          aria-label="Remove"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AppTooltip>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {collabLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-foreground/20"
            aria-busy="true"
          >
            <LoaderSpinner size={24} className="text-secondary-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  listType,
  setSearchQuery,
  setIsMoveModalOpen,
  setMoveItem,
  setSelectedBulkItems,
  selectedBulkItems,
}) {
  const params = useParams();
  const pathName = usePathname();
  const router = useRouter();
  const [previewFileId, setPreviewFileId] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDropdown, setDeleteDropdown] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const handleFolderClick = (folder) => {
    setSelectedBulkItems([]);
    setSearchQuery("");
    setSelectedItem(folder);
    setPath((prev) => [...prev, folder]);
    setDeleteDropdown(null);
  };

  const openDeleteDialog = (file) => {
    setDeleteDropdown(file);
    setIsDeleteModalOpen(true);
  };

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const handleShare = (file) => {
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
      const url =
        `/api/users?portalid=${params.portalid || "root"}`
        ?? "/api/users";
      const response = await fetchWrapper(url, {}, "fetch-user-list");
      if (!response.ok) throw new Error("Download failed");
      const data = await response.json();
      setUsersList(data);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleDeleteFile = async (file) => {
    // setCurrentFilesList((prev) => prev.filter((item) => item.id !== fileId));
    setIsLoading(true);
    try {
      const parentCollaboratorIds = path
        .map((item) => item.collaborators)
        .flat()
        .map((collab) => collab.id);

      const hasParentCollaborator = file?.collaborators?.some((collab) =>
        parentCollaboratorIds.includes(collab.id)
      );

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

      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to delete folder");
      setIsLoading(false);
      setSelectedItem(path.length === 0 ? null : path[path.length - 1]);
      setIsDeleteModalOpen(false);
      setDeleteDropdown(null);
      onFileChanges(folderId);
      toast.success(data.message || "Folder deleted Successfully");
    } catch (error) {
      toast.error(error.message);
      console.error("Error deleting folder:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserName = (file) => {
    if (file?.collaborators?.length > 0 && file.type == "folder") {
      const findeduser = usersList.find(
        (user) => user.email == file.collaborators[0].user.firstName
      );
      return findeduser ? findeduser.firstName : file.collaborators[0].user.firstName;
    } else if (file.type == "file" && file.description != "") {
      const findeduser = usersList.find(
        (user) => user.email == file.description
      );
      return findeduser ? findeduser.firstName : file.description;
    } else {
      return "";
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
    setUser(userData);
  }, []);

  const menuItemClass =
    "gap-3 px-3 py-2 text-muted-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer";

  return (
    <>
      {currentFilesList &&
        currentFilesList.length > 0 &&
        currentFilesList.map((file, index) => {
          const ownerName =
            listType == "shared" ? getUserName(file) : "me";

          return (
            <React.Fragment key={file?.id || index}>
              <tr className="group relative hidden border-b border-border hover:bg-accent active:bg-accent md:table-row">
                <td className="py-3 pl-4">
                  <Checkbox
                    checked={selectedBulkItems?.includes(file?.id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(file?.id, Boolean(checked))
                    }
                  />
                </td>
                <td
                  className={`py-3 ${file.type === "folder" ? "cursor-pointer" : "cursor-default"}`}
                  onClick={() =>
                    file.type === "folder" && handleFolderClick(file)
                  }
                >
                  <div className="flex items-center justify-start gap-3">
                    {file.type === "folder" ? (
                      <Folder className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <File className="h-5 w-5 text-muted-foreground" />
                    )}
                    <p className="mt-1 max-w-56 truncate text-sm font-semibold text-foreground">
                      {file?.name}
                    </p>
                  </div>
                </td>

                <td className="py-3">
                  <div className="flex items-center">
                    <Avatar size="sm" className="mr-3">
                      <AvatarImage
                        src="https://img.freepik.com/premium-vector/avatar-icon0002_750950-43.jpg"
                        alt={ownerName}
                      />
                      <AvatarFallback>
                        {ownerName?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="w-full max-w-40 truncate text-sm text-muted-foreground">
                      {ownerName}
                    </p>
                  </div>
                </td>

                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <UsersRound className="h-5 w-5 text-muted-foreground" />
                    <p className="max-w-40 truncate text-sm text-muted-foreground">
                      {pathName.includes("/home")
                        ? "My Folders"
                        : "Shared with me"}
                    </p>
                  </div>
                </td>

                <td className="py-3">
                  <p className="max-w-40 truncate text-sm text-muted-foreground">
                    {formatDate(file.modified_at)}
                  </p>
                </td>

                <td className="py-3 pr-3">
                  <div className="flex items-center justify-end">
                    <div className="flex items-center justify-start gap-2 opacity-0 group-hover:opacity-100">
                      {file.type === "file" && (
                        <AppTooltip label="View">
                          <Button
                            type="button"
                            variant="icons"
                            size="icon-sm"
                            className="rounded-full text-muted-foreground hover:bg-accent"
                            aria-label="View"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(file?.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </AppTooltip>
                      )}
                      {pathName.includes("/home") && (
                        <AppTooltip label="Share">
                          <Button
                            type="button"
                            variant="icons"
                            size="icon-sm"
                            className="rounded-full text-muted-foreground hover:bg-accent"
                            aria-label="Share"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(file);
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </AppTooltip>
                      )}
                      {file.type === "file" &&
                        (listType !== "shared" ||
                          file.currentUserRole !== "viewer") && (
                          <AppTooltip label="Download">
                            <Button
                              type="button"
                              variant="icons"
                              size="icon-sm"
                              className="rounded-full text-muted-foreground hover:bg-accent"
                              aria-label="Download"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(file.id, file.name);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </AppTooltip>
                        )}
                    </div>

                    {(listType === "shared" &&
                      file.type === "folder" &&
                      file.currentUserRole === "editor") ||
                    listType !== "shared" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="icons"
                              size="icon-sm"
                              className="rounded-full text-muted-foreground hover:bg-accent"
                              onClick={(e) => e.stopPropagation()}
                            />
                          }
                        >
                          <EllipsisVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 border-border bg-popover"
                        >
                          {listType !== "shared" && (
                            <DropdownMenuItem
                              className={menuItemClass}
                              onClick={() => {
                                setIsMoveModalOpen((prev) => !prev);
                                setMoveItem(file);
                                setSelectedBulkItems([]);
                              }}
                            >
                              <FolderInput className="h-4 w-4" />
                              Move
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className={menuItemClass}
                            onClick={() => openDeleteDialog(file)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </td>
              </tr>

              <tr className="flex overflow-x-hidden md:hidden">
                <td className="w-full py-3 px-2">
                  <Card className="border-border bg-card shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex w-full flex-col gap-3 space-y-2">
                        <div
                          onClick={() =>
                            file.type === "folder" && handleFolderClick(file)
                          }
                          className={`${file.type === "folder" ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <div className="flex items-center gap-2">
                            {file.type === "folder" ? (
                              <Folder className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <File className="h-5 w-5 text-muted-foreground" />
                            )}
                            <p className="mt-1 max-w-56 truncate text-sm font-semibold text-foreground">
                              {file?.name}
                            </p>
                          </div>
                          <div className="flex items-center justify-center bg-muted py-8">
                            {file.type === "folder" ? (
                              <Folder className="h-10 w-10 text-muted-foreground" />
                            ) : (
                              <File className="h-10 w-10 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <div className="flex w-full flex-1 items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <Avatar size="sm" className="mr-1">
                                <AvatarImage
                                  src="https://img.freepik.com/premium-vector/avatar-icon0002_750950-43.jpg"
                                  alt={ownerName}
                                />
                                <AvatarFallback>
                                  {ownerName?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <p className="max-w-40 truncate text-xs text-muted-foreground">
                                {ownerName}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <UsersRound className="size-4 text-muted-foreground" />
                              <p className="max-w-40 truncate text-xs text-muted-foreground">
                                {pathName.includes("/home")
                                  ? "My Folders"
                                  : "Shared with me"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-end">
                            {file.type === "file" && (
                              <AppTooltip label="View">
                                <Button
                                  type="button"
                                  variant="icons"
                                  size="icon-sm"
                                  className="rounded-full text-muted-foreground hover:bg-accent"
                                  aria-label="View"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreview(file?.id);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </AppTooltip>
                            )}
                            {pathName.includes("/home") && (
                              <AppTooltip label="Share">
                                <Button
                                  type="button"
                                  variant="icons"
                                  size="icon-sm"
                                  className="rounded-full text-muted-foreground hover:bg-accent"
                                  aria-label="Share"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleShare(file);
                                  }}
                                >
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </AppTooltip>
                            )}
                            {file.type === "file" &&
                              (listType !== "shared" ||
                                file.currentUserRole !== "viewer") && (
                                <AppTooltip label="Download">
                                  <Button
                                    type="button"
                                    variant="icons"
                                    size="icon-sm"
                                    className="rounded-full text-muted-foreground hover:bg-accent"
                                    aria-label="Download"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(file.id, file.name);
                                    }}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </AppTooltip>
                              )}
                            {listType !== "shared" && (
                              <>
                                <Button
                                  type="button"
                                  variant="icons"
                                  size="icon-sm"
                                  className="rounded-full text-muted-foreground hover:bg-accent"
                                  onClick={() => openDeleteDialog(file)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="icons"
                                  size="icon-sm"
                                  className="rounded-full text-muted-foreground hover:bg-accent"
                                  onClick={() => {
                                    setIsMoveModalOpen((prev) => !prev);
                                    setMoveItem(file);
                                  }}
                                >
                                  <FolderInput className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </td>
              </tr>
            </React.Fragment>
          );
        })}

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

      <DeleteConfirmDialog
        isModalOpen={isDeleteModalOpen}
        setIsModalOpen={setIsDeleteModalOpen}
        handleDelete={
          deleteDropdown?.type === "file"
            ? () => handleDeleteFile(deleteDropdown)
            : () => handleDeleteFolder(deleteDropdown?.id)
        }
      />
    </>
  );
}
export default FolderExplorer;
