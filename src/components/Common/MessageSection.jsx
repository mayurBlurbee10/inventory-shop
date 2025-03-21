import { fetchWrapper } from "@/app/lib/fetchWrapper";
import {
  Calendar,
  Edit,
  Loader2,
  MoreVertical,
  Plus,
  Save,
  Tag,
  Trash,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "./Elements/Button";
import Select from "react-select";
import { Dialog } from "@headlessui/react";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import AllTaskModal from "./AllTaskModal";

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-GB");
};

const MessagePreview = ({ isOpen, onClose, message, onMessageUpdate }) => {
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

  const handleEditMessage = async () => {
    if (!editedMessage.text.trim() || !editedMessage.subject.trim()) {
      return;
    }
    const messageData = {
      messageId: message?.id,
      subject: editedMessage.subject,
      text: editedMessage.text,
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

  useEffect(() => {
    setEditedMessage({
      subject: message?.subject,
      text: message?.text,
    });
  }, [message]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="max-w-2xl mx-auto p-6 bg-white shadow-xl rounded-lg border border-gray-300 w-full">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-2xl font-semibold text-gray-800">
              📩 Message Details
            </h2>
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <MoreVertical className="size-5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white shadow-md rounded-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
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

          {/* Message Content */}
          <div className="space-y-5 mt-4 text-gray-700">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Date:</span>
              <span className="text-gray-600">
                {formatDate(message?.createdAt)}
              </span>
            </div>

            {/* Receiver */}
            <div className="flex items-center space-x-2">
              <span className="font-medium">Receiver:</span>
              <span className="text-gray-600">
                {message?.receiver?.name || "Unknown"}
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
                    <div className="p-3 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                        {message?.text || "No message content."}
                    </div>
                    )}
                </div>
            </div>
            </div>

          {/* Footer Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <Button
              onClick={isEditing ? () => setIsEditing(false) : onClose}
              label="Close"
              type="Secondary"
              disabled={isMessageUpdateLoading}
            />
            {isEditing && (
              <Button
                onClick={handleEditMessage}
                icon={Save}
                label="Save"
                type="Primary"
                isLoading={isMessageUpdateLoading}
                disabled={isMessageUpdateLoading}
              />
            )}
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

const NewMessageModal = ({ isOpen, onClose, onMessageSend }) => {
  const params = useParams();
  const [message, setMessage] = useState({
    subject: "",
    text: "",
  });
  const [usersList, setUsersList] = useState([]);
  const [users, setUsers] = useState([]);
  const [userID, setUserID] = useState("");
  const [isSendMessageLoading, setIsSendMessageLoading] = useState(false);

  const { data: user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

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
      portalId: params.portalid,
      subject: message.subject,
      text: message.text,
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
        body: "",
      });
      setUserID("");
      onClose();
      await onMessageSend();
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
      label: `${user.name} (${user.email})`,
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
        <Dialog.Panel className="mx-auto w-full max-w-2xl rounded-lg bg-white pt-6 px-6 pb-4 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl text-gray-600 font-medium">
              Add New Message
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="">
            <div className="space-y-4">
              <Select
                className="flex-1 bg-white text-[#495057] text-sm focus:outline-none min-w-[250px] rounded-md"
                classNamePrefix="Enter email address"
                isClearable={true}
                isSearchable={true}
                value={userID}
                onChange={(e) => setUserID(e)}
                options={users}
                placeholder="To"
              />
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
                value={message.body}
                onChange={(e) =>
                  setMessage((prev) => ({ ...prev, text: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-between space-x-3 mt-3">
              <Button
                onClick={onClose}
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

  const fetchMessages = async () => {
    try {
      setIsMessagesLoading(true);
      const res = await fetchWrapper(
        `/api/messages?portalId=${params?.portalid}&senderId=${user?.id}`,
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
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[calc(80vh-73px)] relative mt-5 font-lato text-sm px-5 sm:px-10 ">
            {isMessagesLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="h-[97%] overflow-y-auto hidden-scrollbar">
                <div className="border border-gray-200 bg-white shadow-sm rounded-lg">
                  <table className="w-full text-sm font-lato shadow-md overflow-hidden rounded-lg">
                    <thead className="bg-gray-100 text-gray-700 text-left sticky top-0">
                      <tr className="bg-gray-100 text-sm text-gray-700">
                        <th className="p-4 text-left font-semibold">Date</th>
                        <th className="p-4 text-left font-semibold">
                          Receiver
                        </th>
                        <th className="p-4 text-left font-semibold">Subject</th>
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
                        messages.map((row, index) => (
                          <tr
                            key={index}
                            className={`border-b text-gray-800 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-gray-100 transition`}
                            onClick={() => setSelectedMessage(row)}
                          >
                            <td className="p-4 whitespace-nowrap">
                              {formatDate(row?.createdAt)}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              {row?.receiver?.name || "Unknown"}
                            </td>
                            <td className="p-4 font-medium whitespace-nowrap">
                              {row?.subject || "No Subject"}
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

const MessageSection = () => {
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isOpenNewMessageModal, setIsOpenNewMessageModal] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isOpenAllMessageSection, setIsOpenAllMessageSection] = useState(false);

  const { data: user } = useSelector((state) => state.user);

  const fetchMessages = async () => {
    try {
      setIsMessagesLoading(true);
      const res = await fetchWrapper(
        `/api/messages?portalId=${params?.portalid}&senderId=${user?.id}`,
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

  return (
    <div className="mt-7 relative text-gray-700">
      {/* Header */}
      <div className="grid grid-cols-3">
        <div></div>
        <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
          Messaging
        </h3>
        <Button
          label={"New Message"}
          icon={Plus}
          onClick={() => setIsOpenNewMessageModal((prev) => !prev)}
          type={"Secondary"}
          className="mb-2 w-40 ml-auto"
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
                  <th className="p-4 text-left font-semibold">Date</th>
                  <th className="p-4 text-left font-semibold">Receiver</th>
                  <th className="p-4 text-left font-semibold">Subject</th>
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
                  messages.slice(0, 5).map((row, index) => (
                    <tr
                      key={index}
                      className="border-t last:border-b hover:bg-gray-50 text-sm cursor-pointer transition"
                      onClick={() => setSelectedMessage(row)}
                    >
                      <td className="p-4 whitespace-nowrap">
                        {formatDate(row?.createdAt)}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {row?.receiver?.name || "Unknown"}
                      </td>
                      <td className="p-4 font-medium whitespace-nowrap">
                        {row?.subject || "No Subject"}
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
      <div className="flex justify-end">
        <div
          className="flex items-center justify-end text-sm text-blue-500 cursor-pointer"
          onClick={() => setIsOpenAllMessageSection((prev) => !prev)}
        >
          View More
        </div>
      </div>

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
