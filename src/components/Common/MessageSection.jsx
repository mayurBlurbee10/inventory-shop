import { fetchWrapper } from "@/app/lib/fetchWrapper";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  MoreVertical,
  Plus,
  Reply,
  Save,
  Tag,
  Trash,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "./Elements/Button";
import Select from "react-select";
import { Dialog } from "@headlessui/react";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import AllTaskModal from "./AllTaskModal";
import { toast } from "react-toastify";
import { decryptMessage, encryptMessage } from "@/app/lib/crypto";
import LoaderSpinner from "./Elements/LoaderSpinner";

const formatDate = (timestamp) => {
  if(timestamp){
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US");
  }else {
    const date = new Date(Date.now());
    return date.toLocaleDateString("en-US");
  }
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

const MessagePreview = ({ isOpen, onClose, message, onMessageUpdate }) => {
  const params = useParams();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMessageUpdateLoading, setIsMessageUpdateLoading] = useState(false);
  const [isMessageDeleteLoading, setIsMessageDeleteLoading] = useState(false);
  const [editedMessage, setEditedMessage] = useState({
    subject: "",
    text: "",
  });
  const menuRef = useRef(null);
  const [isMessageDeleteModalOpen, setIsMessageDeleteModalOpen] =
    useState(false);
  const [isMessageReplyLoading, setIsMessageReplyLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState({
    subject: "",
    text: "",
  });
  const [isReplying, setIsReplying] = useState(false);
  const { data : user } = useSelector((state) => state?.user);

  const handleEditMessage = async () => {
    if (!editedMessage.text.trim() || !editedMessage.subject.trim()) {
      return;
    }
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
    const messageData = {
      messageId: message?.id,
    };
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
      toast.success("Message deleted successfully")
    } catch (error) {
      console.error("Error updating message:", error);
    } finally {
      setIsMessageDeleteLoading(false);
    }
  };

  // Handle clicks outside dropdown to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

 

  const handleReplyMessage = async () => {
    if (!replyMessage?.text) {
      return;
    }
    const messageData = {
      sender: user?.id,
      receiver: message?.sender?.id === user?.id ? message?.receiver?.id : message?.sender?.id,
      portalId: params.portalid || "root",
      subject: message.subject,
      text: encryptMessage(replyMessage.text),
      parentMessage: message?.id
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

      setReplyMessage({
        // subject: "",
        text: "",
      });
      await onMessageUpdate();
      onClose();
      setIsReplying(false);
      toast.success("Message sent successfully")
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsMessageReplyLoading(false);
      
    }
  };

  useEffect(() => {
    setEditedMessage({
      subject: message?.subject ? message?.subject : "",
      text: getDisplayText(message?.text),
    });
  }, [message]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center">
        <Dialog.Panel className="max-w-2xl mx-auto bg-white shadow-xl rounded-lg border border-gray-300 w-full max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-lg border-b border-gray-200 mb-4">
            <div className="flex justify-between items-center border-b p-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                📩 Message Details
              </h2>
              <div className="relative" ref={menuRef}>
                {message?.receiver?.id !== user?.id && (
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-gray-500 hover:text-gray-700 transition"
                  >
                    <MoreVertical className="size-5" />
                  </button>
                )}
                {showMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white shadow-md rounded-lg border border-gray-200 z-10">
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                        setIsReplying(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Edit className="size-4 text-blue-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsMessageDeleteModalOpen((prev) => !prev);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100 flex items-center space-x-2"
                    >
                      <Trash2 className="size-4 text-red-500" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="space-y-5 mt-4 text-gray-700 px-6">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Date:</span>
              <span className="text-gray-600">
                {formatDate(message?.createdAt)}
              </span>
            </div>

             {/* Sender */}
             <div className="flex items-center space-x-2">
              <span className="font-medium">Sender:</span>
              <span className="text-gray-600">
                {message?.sender?.firstName + " " + message?.sender?.lastName || "Unknown"}
              </span>
            </div>

            {/* Receiver */}
            <div className="flex items-center space-x-2">
              <span className="font-medium">Receiver:</span>
              <span className="text-gray-600">
                {message?.receiver?.firstName + " " + message?.receiver?.lastName || "Unknown"}
              </span>
            </div>

            <div className="space-y-5">
                {/* Subject */}
                <div className="flex items-center border-b pb-4">
                    <span className="font-medium text-gray-700 mr-5">Subject:</span>
                    {isEditing ? (
                        <input
                        className="flex-1 p-2 border border-gray-300 rounded-md transition bg-white"
                        value={editedMessage?.subject}
                        onChange={(e) =>
                            setEditedMessage((prev) => ({
                            ...prev,
                            subject: e.target.value,
                            }))
                        }
                        />
                    ) : (
                        <div className="flex-1 p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {message?.subject || "No Subject"}
                        </div>
                    )}
                </div>
                {/* Message Body */}
                <div className="flex flex-col border-b pb-4">
                    <span className="font-medium text-gray-700 mb-1">Message:</span>
                    {isEditing ? (
                    <textarea
                        className="w-full p-2 border border-gray-300 rounded-md transition bg-white resize-none"
                        rows={"8"}
                        value={editedMessage?.text}
                        onChange={(e) =>
                        setEditedMessage((prev) => ({
                            ...prev,
                            text: e.target.value,
                        }))
                        }
                    />
                    ) : (
                    <div className="p-3 max-h-[200px] overflow-y-auto bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {getDisplayText(message?.text) || "No message content."}
                    </div>
                    )}
                </div>
            </div>
          </div>
          <div className={`${isReplying ? "max-h-[100px]":"max-h-[200px]"} overflow-auto px-6`}>
            {message?.replies?.length > 0 ? (
              message.replies.map((reply) => (
                <div key={reply.id} className="flex mt-3">
                  <div className="flex gap-3">
                    <span
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-800 font-semibold border border-white"
                    >
                      {((reply?.sender?.firstName + " " + reply?.sender?.lastName ?? "")[0] ?? "?").toUpperCase()}
                    </span>

                  </div>
                  <span className="text-gray-200 mx-3">|</span>
                  <div className="border-gray-300 rounded-md text-gray-700">
                    <div className="text-gray-500 text-sm font-lato ">{reply.sender?.firstName + " " + reply.sender?.lastName}</div>
                    <div><p>{getDisplayText(reply?.text)}</p></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full flex justify-center text-gray-800 text-sm p-3"><p>No replies yet</p></div>
            )}
          </div>
          {isReplying && (
            <div className="space-y-4 mt-5 px-6">
              {/* {message && message?.sender?.id && (
                <div className="w-full">
                  <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2 bg-white">
                    <div className="text-sm text-[#495057]">
                      {message?.sender?.name} ({message?.sender?.email})
                    </div>
                  </div>
                </div>
              )}

              <div className="cursor-pointer w-full text-gray-700 text-sm px-4 py-2 border border-gray-300 rounded-md flex justify-between items-center placeholder-gray-400">
                <input
                  type="text"
                  value={replyMessage.subject}
                  onChange={(e) =>
                    setReplyMessage((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  required
                  placeholder="Enter Subject"
                  className="w-full focus:outline-none cursor-pointer"
                />
              </div> */}

              <textarea
                placeholder="Write a message..."
                rows="10"
                className="border w-full cursor-pointer h-16 rounded-md px-4 py-2 text-sm outline-none text-gray-700 resize-none placeholder-gray-400"
                value={replyMessage.text}
                onChange={(e) =>
                  setReplyMessage((prev) => ({ ...prev, text: e.target.value }))
                }
              />
            </div>
          )}

          {/* Footer Buttons */}
          <div className=" flex justify-end space-x-3 px-6 pb-4">
            <Button
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                } else if (isReplying) {
                  setIsReplying(false);
                } else {
                  onClose();
                }
              }}
              label="Close"
              type="Secondary"
              disabled={isMessageUpdateLoading || isMessageReplyLoading}
            />
             {!isReplying && !isEditing && (
              <Button
                onClick={() => setIsReplying(true)}
                icon={Reply}
                label="Reply"
                type="Primary"
                isLoading={isMessageReplyLoading}
                disabled={isMessageReplyLoading}
              />
             )}
           {(isEditing || isReplying) && (
              <Button
                onClick={isEditing ? handleEditMessage : handleReplyMessage}
                icon={Save}
                label="Save"
                type="Primary"
                isLoading={isMessageReplyLoading || isMessageUpdateLoading}
                disabled={isMessageReplyLoading || isMessageUpdateLoading}
              />
            )}
            {/* <NewMessageModal
              isOpen={isReplying}
              onClose={() => setIsReplying(false)}
              onSubmit={handleReplyMessage}
              sendTo={message?.sender}
            /> */}
          </div>

        </Dialog.Panel>
      </div>
      <DeleteConfirmDialog
        isModalOpen={isMessageDeleteModalOpen}
        setIsModalOpen={setIsMessageDeleteModalOpen}
        handleDelete={handleDeleteMessage}
        title="Delete message?"
        content="This message will be deleted for all participants in the conversation."
        isLoading={isMessageDeleteLoading}
      />
    </Dialog>
  );
};

const NewMessageModal = ({ isOpen, onClose, onMessageSend, sendTo}) => {
  const params = useParams();
  const [message, setMessage] = useState({
    subject: "",
    text: "",
  });
  const [usersList, setUsersList] = useState([]);
  const [users, setUsers] = useState([]);
  const [userID, setUserID] = useState("");
  const [isSendMessageLoading, setIsSendMessageLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const handleClose = () => {
    setMessage({
      subject : "",
      text : ""
    })
    onClose();
    setUserID("");
  }

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

  const filterUser = () => {
    return users.find((u) => u?.boxUserId === userID.value);
  };

  const handleSendMessage = async () => {
    if (!message?.subject || !message?.text) {
      return;
    }
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

      setMessage({
        subject: "",
        text: "",
      });
      setUserID("");
      onClose();
      await onMessageSend();
      toast.success("Message sent successfully")
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendMessageLoading(false);
    }
  };

  useEffect(() => {
    const users = usersList.map((user) => ({
      ...user,
      value: user.boxUserId,
      label: `${`${user.firstName || ''} ${user.lastName || ''}`.trim()} (${user.email})`,
    }));

    const loggedInUserId = user?.boxUserId;

    const filteredUsers = users.filter((user) => user.value !== loggedInUserId);

    setUsers(filteredUsers);
  }, [usersList]);

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-lg bg-white shadow-md">
          <div className="flex justify-between items-center border-b p-4">
            <Dialog.Title className="text-xl text-gray-600 font-medium">
              Add New Message
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-600 hover:bg-gray-100 rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {
                sendTo ?
                  <div className="w-full">
                    <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2 bg-white">
                      <div className="text-sm text-[#495057]">
                        {sendTo?.firstName + " " + sendTo?.lastName} ({sendTo?.email})
                      </div>
                    </div>
                  </div>
                  : <Select
                    className="flex-1 bg-white text-[#495057] text-sm focus:outline-none min-w-[250px] rounded-md"
                    classNamePrefix="Enter email address"
                    isClearable={true}
                    isSearchable={true}
                    value={users.find(user => user.value === sendTo) || userID}
                    onChange={(e) => setUserID(e)}
                    options={users}
                    placeholder="To"
                    loadingMessage={() => "Fetching users..."}
                    isLoading={isLoading}
                  />
              }
              
              <div className="cursor-pointer w-full text-gray-700 text-sm px-4 py-2 border border-gray-300 rounded-md flex justify-between items-center placeholder-gray-400">
                <input
                  type="text"
                  value={message.subject}
                  onChange={(e) =>
                    setMessage((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  required
                  placeholder="Enter Subject"
                  className="w-full focus:outline-none cursor-pointer"
                />
              </div>

              <textarea
                placeholder="Write a message..."
                rows={"10"}
                className="border w-full cursor-pointer h-24 rounded-md px-4 py-2 text-sm outline-none text-gray-700 resize-none placeholder-gray-400"
                value={message.text}
                onChange={(e) =>
                  setMessage((prev) => ({ ...prev, text: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-between space-x-3 mt-3">
              <Button
                onClick={handleClose}
                disabled={isSendMessageLoading}
                type="Secondary"
                label="Cancel"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isSendMessageLoading}
                isLoading={isSendMessageLoading}
                type="Primary"
                label="Add"
              />
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

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
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen]);

  const sortedMessages = messages && [...messages].sort((a, b) => {
    if (sortConfig.key === "createdAt"){
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    } else if (sortConfig.key === "type") {
      // Sort by Message Type (Send / Received)
      const typeA = a?.sender?.id === user?.id ? "Send" : "Received";
      const typeB = b?.sender?.id === user?.id ? "Send" : "Received";
      return sortConfig.direction === "asc"
        ? typeA.localeCompare(typeB) // Sort Send First
        : typeB.localeCompare(typeA); // Sort Received First
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
    const messageData = {
      messageId: message?.id,
      seen: true 
    };
    try {
      await fetch(`/api/messages?messageId=${message.id}`, {
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
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4 text-[#000000e8]">
        <Dialog.Panel className="mx-auto max-w-[90vw] w-[1200px] h-[80vh] bg-white shadow-xl rounded-lg relative">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              All Messages
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-600 hover:bg-gray-100 p-1 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[calc(80vh-73px)] relative mt-5 font-lato text-sm px-5 sm:px-10 ">
            {isMessagesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <LoaderSpinner size={28} className="text-blue-500" />
              </div>
            ) : (
              <div className="h-[97%] overflow-y-auto hidden-scrollbar">
                <div className="border border-gray-200 bg-white shadow-sm rounded-lg">
                  <table className="w-full text-sm font-lato shadow-md overflow-hidden rounded-lg">
                      <thead>
                        <tr className="bg-gray-200 text-sm text-gray-700 border-b">
                          <th className="p-4 text-left font-semibold">
                            <div className="flex items-center justify-start gap-2">
                              <span className="block">Date</span>
                              <button className="flex items-center justify-center" onClick={() => toggleSort("createdAt")}>
                                <ChevronUp className={`h-4 w-4 ${sortConfig.key === "createdAt" && sortConfig.direction === "asc" ? "text-black" : "text-gray-400"}`} />
                              </button>
                              <button className="flex items-center justify-center" onClick={() => toggleSort("createdAt")}>
                                <ChevronDown className={`h-4 w-4 ${sortConfig.key === "createdAt" && sortConfig.direction === "desc" ? "text-black" : "text-gray-400"}`} />
                              </button>
                            </div>
                          </th>
                          <th className="p-4 text-left font-semibold">
                            <div className="flex items-center justify-start gap-2">
                              <span className="block">Contact</span>
                            </div>
                          </th>
                          <th className="p-4 text-left font-semibold">
                            <div className="flex items-center justify-start gap-2">
                              <span className="block">Subject</span>
                            </div>
                          </th>
                          <th className="p-4 text-left font-semibold">
                            <div className="flex items-center justify-start gap-2">
                              <span className="block">Type</span>
                              <button className="flex items-center justify-center" onClick={() => toggleSort("type")}>
                                <ChevronUp className={`h-4 w-4 ${sortConfig.key === "type" && sortConfig.direction === "asc" ? "text-black" : "text-gray-400"}`} />
                              </button>
                              <button className="flex items-center justify-center" onClick={() => toggleSort("type")}>
                                <ChevronDown className={`h-4 w-4 ${sortConfig.key === "type" && sortConfig.direction === "desc" ? "text-black" : "text-gray-400"}`} />
                              </button>
                            </div>
                          </th>
                        </tr>
                      </thead>
                    <tbody className="overflow-y-auto">
                      {!messages || messages.length === 0 ? (
                        <tr className="text-center">
                          <td colSpan="3">
                            <p className="font-lato text-[#212529] text-sm py-4">
                              No Messages to Show !!!
                            </p>
                          </td>
                        </tr>
                      ) : (
                        [...sortedMessages].reverse().map((row, index) => (
                          <tr
                            key={index}
                            className={`border-b text-gray-800 hover:bg-gray-50 transition ${row?.receiver?.id === user?.id && !row?.seen
                                ? "bg-gray-100 font-bold"
                                : "bg-white font-normal"
                              }`}
                            onClick={() => handleReadMessage(row)}
                          >
                            <td className="p-4 whitespace-nowrap">
                              {formatDate(row?.createdAt)}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {row?.receiver?.firstName + " " + row?.receiver?.lastName || "Unknown"}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {row?.subject || "No Subject"}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {row?.sender?.id === user?.id ? "Send" : "Received"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
      <MessagePreview
        isOpen={selectedMessage !== null}
        onClose={() => setSelectedMessage(null)}
        message={selectedMessage}
        onMessageUpdate={fetchMessages}
      />
    </Dialog>
  );
};

const MessageSection = ({clientId}) => {
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
        `/api/messages?portalId=${params?.portalid || "root "}&senderId=${clientId ? clientId : user?.id}`,
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

  const sortedMessages = messages && [...messages].sort((a, b) => {
    if (sortConfig.key === "createdAt"){
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
    } else if (sortConfig.key === "type") {
      // Sort by Message Type (Send / Received)
      const typeA = a?.sender?.id === user?.id ? "Send" : "Received";
      const typeB = b?.sender?.id === user?.id ? "Send" : "Received";
      return sortConfig.direction === "asc"
        ? typeA.localeCompare(typeB) // Sort Send First
        : typeB.localeCompare(typeA); // Sort Received First
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
    const messageData = {
      messageId: message?.id,
      seen: true 
    };
    try {
      await fetch(`/api/messages?messageId=${message.id}`, {
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

//   const LoadingSpinner = () => (
//     <div className="flex justify-center items-center py-8">
//       <div className="spinner"/>
//     </div>
//   );
  
//   if(isMessagesLoading){
//     return <LoadingSpinner/>
// }
useEffect(() => {
  setMessages([])
}, [router])

  return (
    <div className="relative text-gray-700">
      {/* Header */}
      <div className="grid grid-cols-3 items-center">
        <div></div>
        <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
          Messaging
        </h3>
        <Button
          label={"New"}
          icon={Plus}
          onClick={() => setIsOpenNewMessageModal((prev) => !prev)}
          type={"Secondary"}
          className="mb-2 w-24 h-10 ml-auto"
        />
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-auto w-full">
          <div className="border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-sm text-gray-700">
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center justify-start gap-2">
                        <span className="block">Date</span>
                        <button className="flex items-center justify-center" onClick={() => toggleSort("createdAt")}>
                          <ChevronUp className={`h-4 w-4 ${sortConfig.key === "createdAt" && sortConfig.direction === "asc" ?  "text-black" : "text-gray-400"}`}  />
                        </button>
                        <button className="flex items-center justify-center" onClick={() => toggleSort("createdAt")}>
                          <ChevronDown className={`h-4 w-4 ${sortConfig.key === "createdAt" && sortConfig.direction === "desc" ?  "text-black" : "text-gray-400"}`}  />
                        </button>
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center justify-start gap-2">
                        <span className="block">Contact</span>
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center justify-start gap-2">
                        <span className="block">Subject</span>
                      </div>
                    </th>
                    <th className="p-4 text-left font-semibold">
                      <div className="flex items-center justify-start gap-2">
                        <span className="block">Type</span>
                        <button className="flex items-center justify-center" onClick={() => toggleSort("type")}>
                          <ChevronUp className={`h-4 w-4 ${sortConfig.key === "type" && sortConfig.direction === "asc" ? "text-black" : "text-gray-400"}`} />
                        </button>
                        <button className="flex items-center justify-center" onClick={() => toggleSort("type")}>
                          <ChevronDown className={`h-4 w-4 ${sortConfig.key === "type" && sortConfig.direction === "desc" ? "text-black" : "text-gray-400"}`} />
                        </button>
                      </div>
                    </th>
                </tr>
              </thead>
              <tbody className="overflow-y-auto">
                {!messages || messages.length === 0 ? (
                  // <tr>
                  //   <td colSpan={'4'} >
                  //   {isMessagesLoading ? 
                  //   <div className="spinner"/> 
                  //   : <p className="font-lato text-[#212529] text-sm py-4">
                  //       No Messages to Show !!!
                  //     </p>}
                  //   </td>
                  // </tr>
                    <tr>
                      <td colSpan={"6"}>
                        <div className="min-h-[100px] flex items-center justify-center">
                          {isMessagesLoading
                            ? <LoaderSpinner size={28} className="text-blue-500" />
                            : <p className="font-lato text-[#212529] text-sm py-4">
                              No Messages to Show !!!
                            </p>}
                        </div>
                      </td>
                    </tr>
                ) : (
                  sortedMessages.slice(-5).reverse().map((row, index) => (
                    <tr
                      key={index}
                      className={`border-t last:border-b hover:bg-gray-50 text-sm cursor-pointer transition ${row?.receiver?.id === user?.id && !row?.seen
                        ? "bg-gray-50 font-bold"
                        : "bg-white font-normal"
                      }`}
                      onClick={() => handleReadMessage(row)}
                    >
                      <td className="p-4 whitespace-nowrap">
                        {formatDate(row?.createdAt)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {row?.receiver?.firstName + " " + row?.receiver?.lastName || "Unknown"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {row?.subject || "No Subject"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {row?.sender?.id === user?.id ? "Sent" :  "Received"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Message Button Below Table */}
      {messages && messages?.length > 5 && (
        <div className="flex justify-end">
          <div
            className="flex items-center justify-end text-sm text-blue-500 cursor-pointer"
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

      {/* View All Message */}
      <ViewAllMessage 
        isOpen={isOpenAllMessageSection}
        onClose={() => {setIsOpenAllMessageSection(false); fetchMessages();}}
      />
    </div>
  );
};

export default MessageSection;
