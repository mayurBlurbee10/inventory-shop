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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import PreviewModal from "./FileExplorer/PreviewModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import ReactSelect from "react-select";
import { useParams, useRouter } from "next/navigation";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { toast } from "react-toastify";
import EmptyState from "./FileExplorer/EmptyState";
import SendforSignatureDialog from "./SendForSignature";
import { getUserData } from "@/app/lib/auth";
import SignRequestModal from "./SignRequestModal";
import { useSelector } from "react-redux";
import Editor from "./Editor";
import RenameDocumentModal from "./Common/RenameDocumentModal";
import moment from "moment";
import LoaderSpinner from "./Common/Elements/LoaderSpinner";
import { Button } from "./ui/button";
import { AppTooltip } from "@/components/ui/tooltip";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ThemeSwitch } from "./ui/theme-switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Card, CardContent } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const FileActionsMenu = ({
  file,
  variant = "list",
  listType,
  fromAdvisor,
  esignAvailable,
  isSignLoading,
  onPreview,
  onDownload,
  onShare,
  onMove,
  onEdit,
  onRename,
  onDelete,
  onRequestSignature,
  onSelfSign,
}) => {
  const isList = variant === "list";
  const TriggerIcon = isList ? EllipsisVertical : Ellipsis;

  if (isList && (fromAdvisor || listType === "shared")) {
    return null;
  }

  if (!isList && file.type === "folder" && listType === "shared") {
    return null;
  }

  const menuItemClass =
    "flex items-center gap-2 px-3 py-2 text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="icons"
            size="icon-sm"
            className="relative z-10 rounded-full text-muted-foreground hover:bg-accent"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        <TriggerIcon className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 w-44 border-border bg-popover p-1">
        {!isList && file.type === "file" && (
          <DropdownMenuItem
            className={menuItemClass}
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
          >
            <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>View</span>
          </DropdownMenuItem>
        )}

        {!isList &&
          file.type === "file" &&
          (listType !== "shared" || file.currentUserRole !== "viewer") && (
            <DropdownMenuItem
              className={menuItemClass}
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
            >
              <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Download</span>
            </DropdownMenuItem>
          )}

        {!isList && listType !== "shared" && file.currentUserRole !== "viewer" && (
          <DropdownMenuItem
            className={menuItemClass}
            onClick={(e) => {
              e.stopPropagation();
              onShare();
            }}
          >
            <Share2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Share</span>
          </DropdownMenuItem>
        )}

        {listType !== "shared" && (
          <>
            <DropdownMenuItem
              className={menuItemClass}
              onClick={(e) => {
                e.stopPropagation();
                onMove();
              }}
            >
              <FolderInput className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Move</span>
            </DropdownMenuItem>

            {file.type === "file" && esignAvailable && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger
                  className={menuItemClass}
                  disabled={isSignLoading}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Signature className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {isSignLoading ? (
                    <>
                      <span>Signing</span>
                      <LoaderSpinner
                        size={16}
                        className="ml-auto text-muted-foreground"
                      />
                    </>
                  ) : (
                    <span>Sign</span>
                  )}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48 border-border bg-popover">
                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestSignature();
                    }}
                  >
                    <UsersRoundIcon className="h-4 w-4 shrink-0" />
                    <span>Request Signature</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={menuItemClass}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelfSign();
                    }}
                  >
                    <UserRound className="h-4 w-4 shrink-0" />
                    <span>Sign Myself</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}

            {file.type === "file" && (
              <DropdownMenuItem
                className={menuItemClass}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <FilePenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Edit</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className={menuItemClass}
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
            >
              <Pencil className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Rename</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              className={menuItemClass}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Delete</span>
            </DropdownMenuItem>
          </>
        )}

        {!isList && listType === "shared" && file.type === "file" && (
          <DropdownMenuItem
            className={menuItemClass}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <FilePenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>Edit</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
        ? item.collaborators.filter(
            (collab) =>
              String(collab?.user?.id) !== String(user?.boxUserId)
          )
        : []
    );
  }, [item, user?.boxUserId]);

  const userList = useMemo(() => {
    const loggedInUserId =
      user?.boxUserId != null ? String(user.boxUserId) : null;

    const collaboratorUserIds = new Set();
    const collaboratorEmails = new Set();

    collaborator.forEach((collab) => {
      if (collab?.user?.id != null) {
        collaboratorUserIds.add(String(collab.user.id));
      }
      if (collab?.user?.name) {
        collaboratorEmails.add(collab.user.name.toLowerCase());
      }
    });

    return usersList
      .filter((portalUser) => {
        const userId = String(portalUser.boxUserId);
        if (loggedInUserId && userId === loggedInUserId) return false;
        if (collaboratorUserIds.has(userId)) return false;
        if (
          portalUser.email &&
          collaboratorEmails.has(portalUser.email.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .map((portalUser) => {
        const portalRole = portalUser?.permissions?.find(
          (permission) => permission.portalId === (params.portalid || "root")
        )?.role;
        const name = `${portalUser.firstName || ''} ${portalUser.lastName || ''}`.trim();
        return {
          value: portalUser.boxUserId,
          label: `${name} (${portalUser.email}${portalRole ? ` - ${portalRole}` : ""})`,
        };
      });
  }, [usersList, collaborator, user?.boxUserId, params.portalid]);

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
    setCollaborator((prev) => {
      if (collab.isForAdd) {
        const matchedUser = usersList?.find(
          (portalUser) => String(portalUser.boxUserId) === String(collab.userID)
        );
        const newEntry = {
          id: collab.id,
          role: collab.role ?? role,
          user: {
            name: matchedUser?.email ?? matchedUser?.boxUserId ?? String(collab.userID),
            id: matchedUser?.boxUserId ?? collab.userID,
          },
        };
        const existingIndex = prev.findIndex((c) => c.id == collab.id);
        if (existingIndex > -1) {
          return prev.map((c, i) => (i === existingIndex ? newEntry : c));
        }
        return [...prev, newEntry];
      }
      return prev.filter((c) => c.id != collab.id);
    });
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
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto hidden-scrollbar gap-0 p-0 sm:max-w-xl"
      >
        <DialogHeader className="sticky top-0 z-10 flex flex-row items-center justify-between border-b bg-card p-4 space-y-0">
          <DialogTitle className="text-xl font-semibold text-foreground">
            {item?.name}
          </DialogTitle>
          <Button
            variant="icons"
            onClick={onClose}
            className="rounded-full text-muted-foreground hover:bg-accent"
          >
            <X size={20} />
          </Button>
        </DialogHeader>

        <div className="space-y-6 p-6 bg-card">
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
                <div className="flex items-center gap-3">
                  <Input
                    type="text"
                    value={sharedLink}
                    readOnly
                    className="flex-1 px-4 py-2.5 h-auto bg-muted border-border rounded-lg text-foreground text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    className="text-muted-foreground hover:bg-accent !px-3 !py-3"
                  >
                    <Copy className="w-4 h-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* {item?.type === "folder" && ( */}
          <div className="space-y-2">
            <Label className="text-foreground font-semibold">
              Share with user
            </Label>
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <ReactSelect
                key={collaborator.map((c) => c.id).join("-")}
                className="min-w-[250px] flex-1 text-sm"
                classNamePrefix="share-user-select"
                isClearable={true}
                isSearchable={true}
                value={userID}
                onChange={(e) => setUserID(e)}
                options={userList}
                placeholder="Enter email address"
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                menuPlacement="auto"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    minHeight: "40px",
                    height: "40px",
                    backgroundColor: "hsl(var(--background))",
                    borderColor: state.isFocused
                      ? "hsl(var(--ring))"
                      : "hsl(var(--border))",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px hsl(var(--ring) / 0.5)"
                      : "none",
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
                }}
              />
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="!h-10 w-[120px] shrink-0 !bg-background px-3 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground">
                  <SelectItem value="viewer" className="focus:bg-accent focus:text-accent-foreground">
                    Viewer
                  </SelectItem>
                  <SelectItem value="editor" className="focus:bg-accent focus:text-accent-foreground">
                    Editor
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleEmailShare}
                disabled={!userID || sendButtonLoading}
                className="h-10 shrink-0 px-3 py-2"
              >
                {sendButtonLoading ? (
                  <LoaderSpinner size={20} className="text-primary-foreground" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
          {/* )} */}
          {/* {collaborator.slice(1).length > 0 && ( */}
          {collaborator.length > 0 && (
            <div>
              <div className="text-foreground py-2 pr-2 grid grid-cols-2">
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
                      className="text-foreground hover:bg-accent rounded-lg py-2 pr-2 group grid grid-cols-2"
                    >
                      <div className="flex items-center">
                        {content?.user.name}
                      </div>
                      <div className="flex items-center justify-between">
                        <Select
                          value={content?.role}
                          onValueChange={(newRole) =>
                            handleRoleChange(newRole, content?.user.id, content.id)
                          }
                        >
                          <SelectTrigger className="py-2 px-2 bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent
                            className="bg-card text-foreground"
                            alignItemWithTrigger={false}
                          >
                            <SelectItem value="viewer" className="bg-card focus:bg-accent">
                              Viewer
                            </SelectItem>
                            <SelectItem value="editor" className="bg-card focus:bg-accent">
                              Editor
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <AppTooltip label="Remove">
                            <Button
                              variant="icons"
                              size="icon-sm"
                              onClick={() => {
                                handelRemoveCollaborator(content);
                              }}
                              className="text-muted-foreground hover:bg-accent"
                              aria-label="Remove"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </AppTooltip>
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
          <div className="absolute top-0 left-0 rounded-xl h-full w-full bg-foreground/20 flex items-center justify-center">
            <LoaderSpinner size={24} className="text-primary" />
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedSignUrl, setSelectedSignUrl] = useState(null);
  const [isSignLoading, setIsSignLoading] = useState(false);
  const deleteModalRef = useRef(null);
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
  const [columnSizing, setColumnSizing] = useState({
    select: 44,
    name: 320,
    modified: 180,
    size: 120,
    actions: 220,
  });
  const [columnSizingInfo, setColumnSizingInfo] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
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
      if (
        deleteModalRef.current &&
        deleteModalRef.current.contains(event.target)
      ) {
        return;
      }
      setDeleteDropdown(null);
      setIsDeleteModalOpen(false);
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
      <Button
        type="button"
        variant="ghost"
        className={`absolute right-0 top-0 h-full w-3 cursor-col-resize z-20 rounded-none p-0 group/resizer ${
          isResizing ? "bg-primary/10" : "bg-transparent"
        }`}
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        onClick={(event) => event.stopPropagation()}
        aria-label={ariaLabel}
      >
        <span
          className={`block mx-auto h-full w-[2px] rounded-full ${
            isResizing ? "bg-primary" : "bg-border group-hover/resizer:bg-muted-foreground"
          }`}
        />
      </Button>
    );
  };
  
  return (
    <div>
      {view === "list" && (
        <div
          ref={listContainerRef}
          className="h-[600px] overflow-y-auto overflow-x-auto bg-background scrollbar-hide"
        >
          <Table className="min-w-full divide-y divide-border z-10">
            {!currentFilesList || currentFilesList?.length === 0 ? (
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <EmptyState checkLoading={isFilesLoading} />
                  </TableHead>
                </TableRow>
              </TableHeader>
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
                <TableHeader className="custom-box-shadow sticky top-0 z-10 bg-background">
                  <TableRow>
                    {!fromAdvisor && listType !== "shared" && (
                      <TableHead className="relative py-2.5">
                        {renderColumnResizer("select", "Resize selection column")}
                      </TableHead>
                    )}

                    <TableHead className="relative text-muted-foreground text-[13px] font-normal py-2.5 text-start font-lato">
                      <div className="flex items-center justify-start gap-2 mx-4">
                        <span className="block cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>Name</span>
                        <div className="cursor-pointer" onClick={() => handleSort('name')}>
                          {sortConfig.key === 'name' ? (
                            sortConfig.direction === 'asc' ? (
                              <ChevronUp className="h-4 w-4 text-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-foreground" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      {renderColumnResizer("name", "Resize name column")}
                    </TableHead>
                    {listType !== "loan" && (
                      <>
                        <TableHead className="relative text-muted-foreground text-[13px] font-normal py-2.5 text-start font-lato">
                          <div className="flex items-center justify-start gap-2 mx-4">
                            <span className="block cursor-pointer hover:text-foreground" onClick={() => handleSort('modified_at')}>Modified</span>
                            <div className="cursor-pointer" onClick={() => handleSort('modified_at')}>
                              {sortConfig.key === 'modified_at' ? (
                                sortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4 text-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-foreground" />
                                )
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          {renderColumnResizer("modified", "Resize modified column")}
                        </TableHead>
                        <TableHead className="relative text-muted-foreground text-[13px] font-normal py-2.5 text-start font-lato">
                          <div className="flex items-center justify-start gap-2 mx-4">
                            <span className="block cursor-pointer hover:text-foreground" onClick={() => handleSort('size')}>Size</span>
                            <div className="cursor-pointer" onClick={() => handleSort('size')}>
                              {sortConfig.key === 'size' ? (
                                sortConfig.direction === 'asc' ? (
                                  <ChevronUp className="h-4 w-4 text-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-foreground" />
                                )
                              ) : (
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          {renderColumnResizer("size", "Resize size column")}
                        </TableHead>
                        <TableHead className="relative text-muted-foreground text-[13px] font-normal py-2.5 text-start font-lato">
                          <span className="sr-only">Actions</span>
                          {renderColumnResizer("actions", "Resize actions column")}
                        </TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>

                <TableBody className="w-full divide-y divide-border">
                  {sortedFilesList &&
                    sortedFilesList.length > 0 &&
                    sortedFilesList.map((file, index) => (
                      <TableRow
                        key={index}
                        className={`group hover:bg-accent border-l-2 border-l-transparent hover:border-l-primary active:bg-accent ${selectedBulkItems.includes(file?.id) && "bg-accent"}`}
                      >
                        {!fromAdvisor && listType !== "shared" && (
                          <TableCell className="py-3 pl-4">
                            <Input
                              type="checkbox"
                              className="form-checkbox h-4 w-4 text-primary cursor-pointer w-4"
                              checked={selectedBulkItems.includes(file?.id)}
                              onChange={(e) =>
                                handleCheckboxChange(file?.id, e.target.checked)
                              }
                            />
                          </TableCell>
                        )}

                        <TableCell className="py-1">
                          <Button
                            variant="ghost"
                            className={`h-auto px-3 py-3 text-sm text-foreground font-lato group-hover:text-primary max-w-64 w-full justify-start text-start mx-4 font-normal ${file.type === "folder" ? "cursor-pointer" : "cursor-default"}`}
                            onClick={() =>
                              file?.type === "folder" && handleFolderClick(file)
                            }
                            title={file?.name}
                          >
                            <div className="flex items-center justify-start gap-3">
                              {file.type === "folder" ? (
                                <Folder className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <File className="h-5 w-5 text-muted-foreground" />
                              )}
                              <p className="text-foreground mt-1 font-semibold text-sm truncate max-w-56" title={file?.name}>
                                {file?.name}
                              </p>
                            </div>
                          </Button>
                        </TableCell>
                        {listType !== "loan" && (
                          <>
                            <TableCell className="py-1">
                              <p className="text-sm text-muted-foreground font-lato group-hover:text-primary mx-4">
                                {/* today by Wealthportal Service Account */}
                                {listType === "shared"
                                  ? getUserName(file)
                                  : moment(file?.modified_at).fromNow(false)}
                              </p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm text-muted-foreground font-lato group-hover:text-primary">
                                {/* 100.7 KB */}
                                {formatSize(file?.size)}
                              </p>
                            </TableCell>
                          </>
                        )}
                        {listType !== "loan" && (
                          <TableCell className="py-1 pr-4 pl-10">
                            <div className="flex items-center justify-end">
                              <div className="flex items-center justify-start gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                <div className="flex items-center justify-start gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                  {/* FOR ONLY FILES */}
                                  {file.type === "file" && !fromAdvisor && (
                                    <AppTooltip label="View">
                                      <Button
                                        variant="icons"
                                        size="icon-sm"
                                        className="rounded-full text-muted-foreground hover:bg-accent"
                                        aria-label="View"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePreview(file?.id);
                                        }}
                                      >
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </AppTooltip>
                                  )}

                                  {file.type === "file" && !fromAdvisor && (
                                    <AppTooltip label="Download">
                                      <Button variant="icons" size="icon-sm" className={`rounded-full text-muted-foreground hover:bg-accent ${listType === "shared" &&
                                          file.currentUserRole === "viewer"
                                            ? "hidden"
                                            : ""
                                        }`}
                                        aria-label="Download"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDownload(file.id, file.name);
                                        }}
                                      >
                                        <Download className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </AppTooltip>
                                  )}

                                  {!fromAdvisor && (
                                    <AppTooltip label="Share">
                                      <Button variant="icons" size="icon-sm" className={`rounded-full text-muted-foreground hover:bg-accent ${listType === "shared" ? "hidden" : ""
                                        } `}
                                        aria-label="Share"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleShare(file);
                                        }}
                                      >
                                        <Share2 className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </AppTooltip>
                                  )}
                                </div>
                              </div>

                              <FileActionsMenu
                                file={file}
                                variant="list"
                                listType={listType}
                                fromAdvisor={fromAdvisor}
                                esignAvailable={esignAvailable}
                                isSignLoading={isSignLoading}
                                onMove={() => {
                                  setIsMoveModalOpen((prev) => !prev);
                                  setMoveItem(file);
                                  setSelectedBulkItems([]);
                                }}
                                onEdit={() => {
                                  setIsEditorModalOpen((prev) => !prev);
                                  setEditorFile(file);
                                }}
                                onRename={() => {
                                  setIsRenameModalOpen((prev) => !prev);
                                  setSelectFileToRename((prev) =>
                                    prev?.id === file?.id ? null : file
                                  );
                                }}
                                onDelete={() => {
                                  setIsDeleteModalOpen((prev) => !prev);
                                  setDeleteDropdown(file);
                                }}
                                onRequestSignature={() => {
                                  setIsSignatureModalOpen((prev) => !prev);
                                  setSignatureFile(file);
                                  setSelectedBulkItems([]);
                                }}
                                onSelfSign={() => handleSelfSign(file)}
                              />
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                </TableBody>
              </>
            )}
          </Table>
        </div>
      )}

      {view === "grid" && (
        <div
          ref={gridContainerRef}
          className="h-[600px] overflow-y-auto bg-background scrollbar-hide"
        >
          {!currentFilesList || currentFilesList?.length === 0 ? (
            <div className="w-full h-full flex justify-center items-center text-muted-foreground border-0 hover:bg-transparent">
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
                    <Card
                      className={`border border-border card-shadow hover:border-primary overflow-hidden shadow-sm`}
                    >
                      <CardContent className="p-0">
                      <div
                        className={`min-h-48 flex items-center justify-center bg-muted ${file.type === "folder" ? "cursor-pointer" : "cursor-default"}`}
                        onClick={() =>
                          file?.type === "folder" && handleFolderClick(file)
                        }
                      >
                        <div className="max-h-24 max-w-[80px] h-full w-full">
                          {/* <Folder className="flex-auto h-full w-full text-blue-500" /> */}
                          {file.type === "folder" ? (
                            <Folder className="flex-auto h-full w-full text-primary" />
                          ) : (
                            <File className="flex-auto h-full w-full text-primary" />
                          )}
                        </div>
                      </div>
                      <div className="py-2 px-2.5">
                        <div className="flex items-center justify-between gap-1">
                          <h6
                            className="min-w-0 flex-1 text-sm font-medium text-foreground font-lato text-ellipsis overflow-hidden whitespace-nowrap"
                            title={file?.name}
                          >
                            {file?.name}
                          </h6>

                          <FileActionsMenu
                            file={file}
                            variant="grid"
                            listType={listType}
                            fromAdvisor={fromAdvisor}
                            esignAvailable={esignAvailable}
                            isSignLoading={isSignLoading}
                            onPreview={() => handlePreview(file?.id)}
                            onDownload={() => handleDownload(file.id, file.name)}
                            onShare={() => handleShare(file)}
                            onMove={() => {
                              setIsMoveModalOpen((prev) => !prev);
                              setMoveItem(file);
                              setSelectedBulkItems([]);
                            }}
                            onEdit={() => {
                              setIsEditorModalOpen((prev) => !prev);
                              setEditorFile(file);
                            }}
                            onRename={() => {
                              setIsRenameModalOpen((prev) => !prev);
                              setSelectFileToRename(file);
                            }}
                            onDelete={() => {
                              setIsDeleteModalOpen((prev) => !prev);
                              setDeleteDropdown(file);
                            }}
                            onRequestSignature={() => {
                              setIsSignatureModalOpen((prev) => !prev);
                              setSignatureFile(file);
                              setSelectedBulkItems([]);
                            }}
                            onSelfSign={() => handleSelfSign(file)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground font-lato text-ellipsis overflow-hidden whitespace-nowrap w-full">
                          Modified today by Wealthportal Service Account
                        </p>
                        <p className="text-xs text-muted-foreground font-lato ">
                          {formatSize(file?.size)}
                        </p>
                      </div>
                      </CardContent>
                    </Card>
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
