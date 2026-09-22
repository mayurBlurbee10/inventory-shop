"use client";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import {
  ChevronDown,
  ChevronUp,
  Edit,
  MoreVertical,
  Plus,
  Reply,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import Select from "react-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import { toast } from "react-toastify";
import { decryptMessage, encryptMessage } from "@/app/lib/crypto";
import LoaderSpinner from "./Elements/LoaderSpinner";

/* ─── react-select theme (matches CreateTaskPopUp pattern) ─── */
const reactSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "2.75rem",
    backgroundColor: "hsl(var(--background))",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--border))",
    boxShadow: state.isFocused ? "0 0 0 3px hsl(var(--ring) / 0.5)" : "none",
    borderRadius: "0.5rem",
    "&:hover": { borderColor: "hsl(var(--border))" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0.25rem 0.75rem" }),
  singleValue: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
  input: (base) => ({ ...base, color: "hsl(var(--foreground))" }),
  placeholder: (base) => ({ ...base, color: "hsl(var(--muted-foreground))" }),
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
    "&:active": { backgroundColor: "hsl(var(--accent))" },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": { color: "hsl(var(--foreground))" },
  }),
  dropdownIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
    "&:hover": { color: "hsl(var(--foreground))" },
  }),
  indicatorSeparator: (base) => ({
    ...base,
    backgroundColor: "hsl(var(--border))",
  }),
  loadingIndicator: (base) => ({
    ...base,
    color: "hsl(var(--muted-foreground))",
  }),
};

/* ─── Helpers ─── */
const formatDate = (timestamp) => {
  const date = timestamp ? new Date(timestamp) : new Date();
  return date.toLocaleDateString("en-US");
};

/** Try to decrypt; if result is empty (plain text stored), return raw text. */
const getDisplayText = (text) => {
  if (!text) return "";
  try {
    const decrypted = decryptMessage(text);
    return decrypted || text;
  } catch {
    return text;
  }
};

const getInitials = (firstName, lastName) => {
  const first = firstName?.[0] ?? "";
  const last = lastName?.[0] ?? "";
  return (first + last).toUpperCase() || "?";
};

/* ─── MessagePreview ─── */
const MessagePreview = ({ isOpen, onClose, message, onMessageUpdate }) => {
  const params = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [isMessageUpdateLoading, setIsMessageUpdateLoading] = useState(false);
  const [isMessageDeleteLoading, setIsMessageDeleteLoading] = useState(false);
  const [editedMessage, setEditedMessage] = useState({ subject: "", text: "" });
  const [isMessageDeleteModalOpen, setIsMessageDeleteModalOpen] = useState(false);
  const [isMessageReplyLoading, setIsMessageReplyLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState({ subject: "", text: "" });
  const [isReplying, setIsReplying] = useState(false);
  const { data: user } = useSelector((state) => state?.user);

  const handleEditMessage = async () => {
    if (!editedMessage.text.trim() || !editedMessage.subject.trim()) return;
    const messageData = {
      messageId: message?.id,
      subject: editedMessage.subject,
      text: encryptMessage(editedMessage.text),
    };
    setIsMessageUpdateLoading(true);
    try {
      const response = await fetchWrapper(
        "/api/messages",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        },
        "update-message"
      );
      if (!response.ok) throw new Error("Failed to update message");
      await onMessageUpdate();
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("Error updating message:", error);
    } finally {
      setIsMessageUpdateLoading(false);
    }
  };

  const handleDeleteMessage = async () => {
    const messageData = { messageId: message?.id };
    setIsMessageDeleteLoading(true);
    try {
      const response = await fetchWrapper(
        "/api/messages",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        },
        "delete-message"
      );
      if (!response.ok) throw new Error("Failed to delete message");
      setIsMessageDeleteModalOpen(false);
      await onMessageUpdate();
      onClose();
      toast.success("Message deleted successfully");
    } catch (error) {
      console.error("Error updating message:", error);
    } finally {
      setIsMessageDeleteLoading(false);
    }
  };

  const handleReplyMessage = async () => {
    if (!replyMessage?.text) return;
    const messageData = {
      sender: user?.id,
      receiver:
        message?.sender?.id === user?.id
          ? message?.receiver?.id
          : message?.sender?.id,
      portalId: params.portalid || "root",
      subject: message.subject,
      text: encryptMessage(replyMessage.text),
      parentMessage: message?.id,
    };
    setIsMessageReplyLoading(true);
    try {
      const response = await fetchWrapper(
        "/api/messages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        },
        "reply-message"
      );
      if (!response.ok) throw new Error("Failed to send message");
      setReplyMessage({ text: "" });
      await onMessageUpdate();
      onClose();
      setIsReplying(false);
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsMessageReplyLoading(false);
    }
  };

  useEffect(() => {
    setEditedMessage({
      subject: message?.subject ?? "",
      text: getDisplayText(message?.text),
    });
  }, [message]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-auto bg-background border-border p-0"
          overlayClassName="bg-black/30"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background rounded-t-lg border-b border-border">
            <div className="flex justify-between items-center p-4">
              <DialogTitle className="text-2xl font-semibold text-foreground">
                📩 Message Details
              </DialogTitle>
              {message?.receiver?.id !== user?.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition">
                      <MoreVertical className="size-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                      onClick={() => {
                        setIsEditing(true);
                        setIsReplying(false);
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Edit className="size-4 text-secondary-foreground" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsMessageDeleteModalOpen(true)}
                      className="flex items-center gap-2 text-destructive cursor-pointer focus:text-destructive"
                    >
                      <Trash2 className="size-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-5 mt-4 text-foreground px-6">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Date:</span>
              <span className="text-muted-foreground">{formatDate(message?.createdAt)}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium">Sender:</span>
              <span className="text-muted-foreground">
                {message?.sender
                  ? `${message.sender.firstName} ${message.sender.lastName}`
                  : "Unknown"}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium">Receiver:</span>
              <span className="text-muted-foreground">
                {message?.receiver
                  ? `${message.receiver.firstName} ${message.receiver.lastName}`
                  : "Unknown"}
              </span>
            </div>

            <div className="space-y-5">
              {/* Subject */}
              <div className="flex items-center border-b border-border pb-4">
                <Label className="font-medium text-foreground mr-5">Subject:</Label>
                {isEditing ? (
                  <Input
                    className="flex-1 bg-background"
                    value={editedMessage?.subject}
                    onChange={(e) =>
                      setEditedMessage((prev) => ({ ...prev, subject: e.target.value }))
                    }
                  />
                ) : (
                  <div className="flex-1 p-2 bg-muted border border-border rounded-md text-foreground">
                    {message?.subject || "No Subject"}
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="flex flex-col border-b border-border pb-4">
                <Label className="font-medium text-foreground mb-1">Message:</Label>
                {isEditing ? (
                  <Textarea
                    className="w-full bg-background resize-none"
                    rows={8}
                    value={editedMessage?.text}
                    onChange={(e) =>
                      setEditedMessage((prev) => ({ ...prev, text: e.target.value }))
                    }
                  />
                ) : (
                  <div className="p-3 max-h-[200px] overflow-y-auto bg-muted border border-border rounded-md text-foreground">
                    {getDisplayText(message?.text) || "No message content."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Replies */}
          <div
            className={`${isReplying ? "max-h-[100px]" : "max-h-[200px]"} overflow-auto px-6`}
          >
            {message?.replies?.length > 0 ? (
              message.replies.map((reply) => (
                <div key={reply.id} className="flex mt-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                      {getInitials(reply?.sender?.firstName, reply?.sender?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-border mx-3">|</span>
                  <div className="rounded-md text-foreground">
                    <div className="text-muted-foreground text-sm">
                      {reply.sender?.firstName} {reply.sender?.lastName}
                    </div>
                    <div>
                      <p>{getDisplayText(reply?.text)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full flex justify-center text-foreground text-sm p-3">
                <p>No replies yet</p>
              </div>
            )}
          </div>

          {/* Reply textarea */}
          {isReplying && (
            <div className="space-y-4 mt-5 px-6">
              <Textarea
                placeholder="Write a message..."
                rows={4}
                className="w-full h-16 resize-none bg-background text-foreground placeholder:text-muted-foreground"
                value={replyMessage.text}
                onChange={(e) =>
                  setReplyMessage((prev) => ({ ...prev, text: e.target.value }))
                }
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end space-x-3 px-6 pb-4 mt-2">
            <Button
              variant="outline"
              className="px-3 py-3"
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else if (isReplying) {
                  setIsReplying(false);
                } else {
                  onClose();
                }
              }}
              disabled={isMessageUpdateLoading || isMessageReplyLoading}
            >
              Close
            </Button>
            {!isReplying && !isEditing && (
              <Button
                className="px-3 py-3"
                onClick={() => setIsReplying(true)}
                disabled={isMessageReplyLoading}
              >
                {isMessageReplyLoading ? (
                  <LoaderSpinner size={16} className="text-primary-foreground mr-1" />
                ) : (
                  <Reply className="size-4 mr-1" />
                )}
                Reply
              </Button>
            )}
            {(isEditing || isReplying) && (
              <Button
                className="px-3 py-3"
                onClick={isEditing ? handleEditMessage : handleReplyMessage}
                disabled={isMessageReplyLoading || isMessageUpdateLoading}
              >
                {isMessageReplyLoading || isMessageUpdateLoading ? (
                  <LoaderSpinner size={16} className="text-primary-foreground mr-1" />
                ) : (
                  <Save className="size-4 mr-1" />
                )}
                Save
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        isModalOpen={isMessageDeleteModalOpen}
        setIsModalOpen={setIsMessageDeleteModalOpen}
        handleDelete={handleDeleteMessage}
        title="Delete message?"
        content="This message will be deleted for all participants in the conversation."
        isLoading={isMessageDeleteLoading}
      />
    </>
  );
};

/* ─── NewMessageModal ─── */
const NewMessageModal = ({ isOpen, onClose, onMessageSend, sendTo }) => {
  const params = useParams();
  const [message, setMessage] = useState({ subject: "", text: "" });
  const [usersList, setUsersList] = useState([]);
  const [users, setUsers] = useState([]);
  const [userID, setUserID] = useState("");
  const [isSendMessageLoading, setIsSendMessageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: user } = useSelector((state) => state.user);

  const handleClose = () => {
    setMessage({ subject: "", text: "" });
    onClose();
    setUserID("");
  };

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const url = params.portalid
        ? `/api/users?portalid=${params.portalid || "root"}`
        : "/api/users";
      const response = await fetchWrapper(url, {}, "fetch-user-list");
      if (!response.ok) throw new Error("Download failed");
      const data = await response.json();
      setUsersList(data);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message?.subject || !message?.text) return;
    const { id } = userID;
    const messageData = {
      sender: user?.id,
      receiver: id,
      portalId: params.portalid || "root",
      subject: message.subject,
      text: encryptMessage(message.text),
    };
    setIsSendMessageLoading(true);
    try {
      const response = await fetchWrapper(
        "/api/messages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        },
        "create-message"
      );
      if (!response.ok) throw new Error("Failed to send message");
      setMessage({ subject: "", text: "" });
      setUserID("");
      onClose();
      await onMessageSend();
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendMessageLoading(false);
    }
  };

  useEffect(() => {
    const mapped = usersList.map((u) => ({
      ...u,
      value: u.boxUserId,
      label: `${`${u.firstName || ""} ${u.lastName || ""}`.trim()} (${u.email})`,
    }));
    const loggedInUserId = user?.boxUserId;
    setUsers(mapped.filter((u) => u.value !== loggedInUserId));
  }, [usersList]);

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="mx-auto w-full max-w-2xl bg-background border-border p-0"
        overlayClassName="bg-black/30"
        showCloseButton={false}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border px-4 py-4 space-y-0">
          <DialogTitle className="text-xl text-foreground font-medium">
            Add New Message
          </DialogTitle>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:bg-muted rounded-full p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {sendTo ? (
            <div className="w-full">
              <div className="flex items-center justify-between border border-border rounded px-3 py-2 bg-background">
                <div className="text-sm text-foreground">
                  {sendTo.firstName} {sendTo.lastName} ({sendTo.email})
                </div>
              </div>
            </div>
          ) : (
            <Select
              styles={reactSelectStyles}
              menuPortalTarget={typeof document !== "undefined" ? document.body : null}
              isClearable
              isSearchable
              value={users.find((u) => u.value === sendTo) || userID}
              onChange={(e) => setUserID(e)}
              options={users}
              placeholder="To"
              loadingMessage={() => "Fetching users..."}
              isLoading={isLoading}
            />
          )}

          <Input
            type="text"
            value={message.subject}
            onChange={(e) =>
              setMessage((prev) => ({ ...prev, subject: e.target.value }))
            }
            required
            placeholder="Enter Subject"
            className="bg-background"
          />

          <Textarea
            placeholder="Write a message..."
            rows={10}
            className="w-full h-24 resize-none bg-background text-foreground placeholder:text-muted-foreground"
            value={message.text}
            onChange={(e) =>
              setMessage((prev) => ({ ...prev, text: e.target.value }))
            }
          />

          <div className="flex justify-between space-x-3 mt-3">
            <Button
              variant="outline"
              className="px-3 py-3"
              onClick={handleClose}
              disabled={isSendMessageLoading}
            >
              Cancel
            </Button>
            <Button
              className="px-3 py-3"
              onClick={handleSendMessage}
              disabled={isSendMessageLoading}
            >
              {isSendMessageLoading && (
                <LoaderSpinner size={16} className="text-primary-foreground mr-1" />
              )}
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── ViewAllMessage ─── */
const ViewAllMessage = ({ isOpen, onClose }) => {
  const params = useParams();
  const [messages, setMessages] = useState([]);
  const { data: user } = useSelector((state) => state?.user);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "asc" });

  const fetchMessages = async () => {
    try {
      setIsMessagesLoading(true);
      const res = await fetchWrapper(
        `/api/messages?portalId=${params?.portalid || "root"}&senderId=${user?.id}`,
        {},
        "fetch-messages"
      );
      const data = await res.json();
      setMessages(data?.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchMessages();
  }, [isOpen]);

  const sortedMessages =
    messages &&
    [...messages].sort((a, b) => {
      if (sortConfig.key === "createdAt") {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.key === "type") {
        const typeA = a?.sender?.id === user?.id ? "Send" : "Received";
        const typeB = b?.sender?.id === user?.id ? "Send" : "Received";
        return sortConfig.direction === "asc"
          ? typeA.localeCompare(typeB)
          : typeB.localeCompare(typeA);
      }
      return 0;
    });

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleReadMessage = async (message) => {
    if (message?.receiver?.id === user?.id && !message.seen) {
      console.log("message.id:", message.id);
      const messageData = { messageId: message?.id, seen: true };
      try {
        await fetchWrapper(`/api/messages?messageId=${message.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        });
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === message.id ? { ...msg, seen: true } : msg
          )
        );
        setSelectedMessage(messages.find((msg) => msg.id === message.id));
      } catch (error) {
        console.error("Error marking message as seen:", error);
      }
    }
    return setSelectedMessage(messages.find((msg) => msg.id === message.id));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="mx-auto max-w-[90vw] w-[1200px] h-[80vh] bg-background border-border p-0"
          overlayClassName="bg-black/30"
          showCloseButton={false}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <DialogTitle className="text-lg font-semibold text-foreground">
              All Messages
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:bg-muted p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-[calc(80vh-73px)] relative mt-5 text-sm px-5 sm:px-10">
            {isMessagesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <LoaderSpinner size={28} className="text-secondary-foreground" />
              </div>
            ) : (
              <div className="h-[97%] overflow-y-auto hidden-scrollbar">
                <div className="border border-border bg-card shadow-sm rounded-lg">
                  <Table className="w-full text-sm shadow-md overflow-hidden rounded-lg">
                    <TableHeader>
                      <TableRow className="bg-muted text-sm border-b border-border">
                        <TableHead className="p-4 text-left font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>Date</span>
                            <button onClick={() => toggleSort("createdAt")}>
                              <ChevronUp
                                className={`h-4 w-4 ${sortConfig.key === "createdAt" &&
                                    sortConfig.direction === "asc"
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                  }`}
                              />
                            </button>
                            <button onClick={() => toggleSort("createdAt")}>
                              <ChevronDown
                                className={`h-4 w-4 ${sortConfig.key === "createdAt" &&
                                    sortConfig.direction === "desc"
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                  }`}
                              />
                            </button>
                          </div>
                        </TableHead>
                        <TableHead className="p-4 text-left font-semibold text-foreground">
                          Contact
                        </TableHead>
                        <TableHead className="p-4 text-left font-semibold text-foreground">
                          Subject
                        </TableHead>
                        <TableHead className="p-4 text-left font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <span>Type</span>
                            <button onClick={() => toggleSort("type")}>
                              <ChevronUp
                                className={`h-4 w-4 ${sortConfig.key === "type" &&
                                    sortConfig.direction === "asc"
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                  }`}
                              />
                            </button>
                            <button onClick={() => toggleSort("type")}>
                              <ChevronDown
                                className={`h-4 w-4 ${sortConfig.key === "type" &&
                                    sortConfig.direction === "desc"
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                  }`}
                              />
                            </button>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!messages || messages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            <p className="text-foreground text-sm">
                              No Messages to Show !!!
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...sortedMessages].reverse().map((row, index) => (
                          <TableRow
                            key={index}
                            className={`border-b border-border text-foreground hover:bg-accent/30 transition cursor-pointer ${row?.receiver?.id === user?.id && !row?.seen
                                ? "bg-muted font-bold"
                                : "bg-background font-normal"
                              }`}
                            onClick={() => handleReadMessage(row)}
                          >
                            <TableCell className="p-4 whitespace-nowrap">
                              {formatDate(row?.createdAt)}
                            </TableCell>
                            <TableCell className="p-4 whitespace-nowrap">
                              {row?.receiver
                                ? `${row.receiver.firstName} ${row.receiver.lastName}`
                                : "Unknown"}
                            </TableCell>
                            <TableCell className="p-4 whitespace-nowrap">
                              {row?.subject || "No Subject"}
                            </TableCell>
                            <TableCell className="p-4 whitespace-nowrap">
                              <Badge
                                variant={
                                  row?.sender?.id === user?.id ? "secondary" : "outline"
                                }
                              >
                                {row?.sender?.id === user?.id ? "Sent" : "Received"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MessagePreview
        isOpen={selectedMessage !== null}
        onClose={() => setSelectedMessage(null)}
        message={selectedMessage}
        onMessageUpdate={fetchMessages}
      />
    </>
  );
};

/* ─── MessageSection (main export) ─── */
const MessageSection = ({ clientId }) => {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isOpenNewMessageModal, setIsOpenNewMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isOpenAllMessageSection, setIsOpenAllMessageSection] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "asc" });
  const { data: user } = useSelector((state) => state.user);
  const router = useRouter();

  const fetchMessages = async () => {
    try {
      setIsMessagesLoading(true);
      const res = await fetchWrapper(
        `/api/messages?portalId=${params?.portalid || "root "}&senderId=${clientId ? clientId : user?.id
        }`,
        {},
        "fetch-messages"
      );
      const data = await res.json();
      setMessages(data?.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const sortedMessages =
    messages &&
    [...messages].sort((a, b) => {
      if (sortConfig.key === "createdAt") {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      } else if (sortConfig.key === "type") {
        const typeA = a?.sender?.id === user?.id ? "Send" : "Received";
        const typeB = b?.sender?.id === user?.id ? "Send" : "Received";
        return sortConfig.direction === "asc"
          ? typeA.localeCompare(typeB)
          : typeB.localeCompare(typeA);
      }
      return 0;
    });

  const handleReadMessage = async (message) => {
    if (message?.receiver?.id === user?.id && !message.seen) {
      console.log("message.id:", message.id);
      const messageData = { messageId: message?.id, seen: true };
      try {
        await fetchWrapper(`/api/messages?messageId=${message.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        });
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === message.id ? { ...msg, seen: true } : msg
          )
        );
        setSelectedMessage(messages.find((msg) => msg.id === message.id));
      } catch (error) {
        console.error("Error marking message as seen:", error);
      }
    }
    return setSelectedMessage(messages.find((msg) => msg.id === message.id));
  };

  useEffect(() => {
    setMessages([]);
  }, [router]);

  return (
    <Card className="rounded-xl border border-border max-h-[350px] bg-card shadow-none">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between bg-card p-3 border-b border-border rounded-t-xl space-y-0">
        <h3 className="text-lg font-semibold text-foreground">Messaging</h3>
        <Button
          className="px-3 py-3 text-sm"
          onClick={() => setIsOpenNewMessageModal((prev) => !prev)}
        >
          <Plus className="size-4 mr-1" />
          New
        </Button>
      </CardHeader>

      {/* Messages List */}
      <CardContent className="p-0">
        <div className="max-h-[290px] overflow-y-auto rounded-b-xl">
          {loading ? (
            <div className="min-h-[320px] flex items-center justify-center">
              <LoaderSpinner className="text-muted-foreground" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14">
              <h4 className="text-foreground font-semibold text-lg mb-1">
                No Messages Yet
              </h4>
              <p className="text-muted-foreground text-sm mb-5 text-center">
                You don&apos;t have any messages right now.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedMessages
                .slice(-5)
                .reverse()
                .map((row, index) => (
                  <div
                    key={index}
                    className={`py-3 hover:bg-accent/30 cursor-pointer transition ${row?.receiver?.id === user?.id && !row?.seen
                        ? "bg-primary/10 border-l-4 border-l-primary"
                        : "bg-card"
                      }`}
                    onClick={() => handleReadMessage(row)}
                  >
                    <div className="px-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${row?.receiver?.id === user?.id && !row?.seen
                                ? "bg-primary"
                                : "bg-muted-foreground"
                              }`}
                          />
                          <span
                            className={`text-sm font-medium ${row?.receiver?.id === user?.id && !row?.seen
                                ? "text-foreground font-semibold"
                                : "text-foreground"
                              }`}
                          >
                            {row?.receiver
                              ? `${row.receiver.firstName} ${row.receiver.lastName}`
                              : "Unknown"}
                          </span>
                          <Badge
                            variant={
                              row?.sender?.id === user?.id ? "secondary" : "outline"
                            }
                            className="text-xs"
                          >
                            {row?.sender?.id === user?.id ? "Sent" : "Received"}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(row?.createdAt)}
                        </span>
                      </div>
                      <div className="ml-5">
                        <p
                          className={`text-sm ${row?.receiver?.id === user?.id && !row?.seen
                              ? "text-foreground font-medium"
                              : "text-muted-foreground"
                            }`}
                        >
                          {getDisplayText(row?.text)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* View More */}
      {messages && messages?.length > 5 && (
        <div className="p-3 border-t border-border">
          <div
            className="flex items-center justify-center text-sm text-secondary-foreground hover:text-secondary-foreground/80 cursor-pointer font-medium"
            onClick={() => setIsOpenAllMessageSection((prev) => !prev)}
          >
            View More
          </div>
        </div>
      )}

      {/* New Message Modal */}
      <NewMessageModal
        isOpen={isOpenNewMessageModal}
        onClose={() => setIsOpenNewMessageModal(false)}
        onMessageSend={fetchMessages}
      />

      {/* Message Preview Modal */}
      <MessagePreview
        isOpen={selectedMessage !== null}
        onClose={() => setSelectedMessage(null)}
        message={selectedMessage}
        onMessageUpdate={fetchMessages}
      />

      {/* View All Messages */}
      <ViewAllMessage
        isOpen={isOpenAllMessageSection}
        onClose={() => {
          setIsOpenAllMessageSection(false);
          fetchMessages();
        }}
      />
    </Card>
  );
};

export default MessageSection;
