import { useChat } from "@/hooks/useChat";
import { setMessages } from "@/store/services/messageService";
import { Dialog } from "@headlessui/react";
import { ChevronDown, Inbox, Loader2, Send, X } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "./Elements/Button";
import DeleteConfirmDialog from "../DeleteConfirmDialog";

const MessagingModal = ({ isOpen, onClose, receiver }) => {
  const messagesEndRef = useRef(null);
  const params = useParams();
  const [isSendMessageLoading, setIsSendMessageLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [portalId, setPortalId] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isOpenEditMessageModal, setIsOpenEditMessageModal] = useState(false);
  const [isOpenDeleteMessageModal, setIsOpenDeleteMessageModal] =
    useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isOpenDropdown, setIsOpenDropdown] = useState(null);

  // const { messages } = useSelector((state) => state.message);

  const { data: user } = useSelector((state) => state.user);
  // const dispatch = useDispatch();
  const {
    messages,
    sendMessage,
    editMessage,
    deleteMessage,
    onlineUsers,
    isLoadingMessages,
  } = useChat(user?.id, user?.id, receiver?.id, portalId);
  const [filteredMessages, setFilteredMessages] = useState(messages);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    if (params?.portalid) {
      setPortalId(params.portalid);
    }
  }, [params]);

  const handleSendMessage = async (e) => {
    try {
      e.preventDefault();
      setIsSendMessageLoading(true);
      if (!message.trim()) return;
      await sendMessage(message);
      setMessage("");
    } catch (error) {
      console.log(error);
    } finally {
      setIsSendMessageLoading(false);
    }
  };

  const handleSaveEdit = async (msg) => {
    try {
      setIsSendMessageLoading(true);
      if (!message.trim()) return;
      await editMessage(msg?.id, message);
      setMessage("");
      setSelectedMessage(null);
      setIsOpenDropdown(null);
      setIsOpenEditMessageModal(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSendMessageLoading(false);
    }
  };

  const handleDelete = async (e) => {
    try {
      e.preventDefault();
      setIsDeleteLoading(true);
      await deleteMessage(selectedMessage?.id);
      setMessage("");
      setSelectedMessage(null);
      setIsOpenDropdown(null);
      setIsOpenDeleteMessageModal(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsDeleteLoading(false);
    }
  };

  console.log("receiver", receiver);
  console.log("filteredMessages", filteredMessages);
  console.log("onlineUsers", onlineUsers);

  function formatTimestamp(isoString) {
    const date = new Date(isoString);
    const now = new Date();

    const localDate = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );

    const isToday =
      localDate.getDate() === now.getDate() &&
      localDate.getMonth() === now.getMonth() &&
      localDate.getFullYear() === now.getFullYear();

    const isYesterday =
      localDate.getDate() === now.getDate() - 1 &&
      localDate.getMonth() === now.getMonth() &&
      localDate.getFullYear() === now.getFullYear();

    const timeString = new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZone: "Asia/Kolkata",
    }).format(new Date());

    if (isToday) {
      return `Today at ${timeString}`;
    } else if (isYesterday) {
      return `Yesterday at ${timeString}`;
    } else {
      return (
        new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(localDate) + ` at ${timeString}`
      );
    }
  }

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <Dialog open={isOpen} onClose={() => {}} className="relative z-20">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4 text-[#000000e8]">
        <Dialog.Panel className="mx-auto max-w-[90vw] w-[1200px] h-[80vh] bg-white rounded-lg shadow-xl relative flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              <div className="flex px-5">
                <div className="flex w-8 h-8 items-center justify-center p-2 rounded-full bg-blue-600 text-white font-bold text-sm">
                  {receiver?.name
                    ?.split(" ")
                    .map((word) => word.charAt(0).toUpperCase())
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="ml-2">
                  <p>{receiver?.name}</p>
                  <p className="text-xs text-gray-400 font-normal">
                    Active Now
                  </p>
                </div>
              </div>
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full text-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat Messages Section */}
          {isLoadingMessages ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="text-blue-500 animate-spin" />
            </div>
          ) : (
            <div
              className="flex-1 overflow-y-auto hidden-scrollbar px-5 pt-1 pb-3 sm:px-10 space-y-2"
              ref={messagesEndRef}
            >
              {messages &&
                messages.length > 0 &&
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex w-full my-2 group ${
                      msg?.sender?.id === user?.id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {/* Avatar for Receiver */}
                    {msg?.sender?.id !== user?.id && (
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm mr-2">
                        {msg?.sender?.name
                          ?.split(" ")
                          .map((word) => word.charAt(0).toUpperCase())
                          .slice(0, 2)
                          .join("")}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`relative p-3 max-w-xs md:max-w-sm lg:max-w-md rounded-lg shadow ${
                        msg?.sender?.id === user?.id
                          ? "bg-gray-50 text-black ml-auto"
                          : "bg-gray-50 text-black mr-auto"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between ${
                          msg?.sender?.id === user?.id && "mr-5"
                        }`}
                      >
                        <span className="text-xs text-gray-600">
                          {msg?.sender?.id === user?.id
                            ? `Me`
                            : `${msg?.sender?.email}`}
                        </span>
                        <span className="text-xs text-gray-400 ml-3">
                          {formatTimestamp(msg?.createdAt)}
                        </span>
                      </div>

                      {/* Dropdown Trigger (Fixed Group Hover) */}
                      <div
                        className={`absolute top-1 right-0 mt-1 mr-2 opacity-0 transition-opacity duration-200 ${
                          msg?.sender?.id === user?.id &&
                          "group-hover:opacity-100"
                        }`}
                      >
                        <div
                          className="cursor-pointer text-gray-600"
                          onClick={() => {
                            setSelectedMessage((prev) =>
                              prev?.id === msg?.id ? null : msg
                            );
                            setIsOpenDropdown((prev) =>
                              prev?.id === msg?.id ? null : msg
                            );
                          }}
                        >
                          <ChevronDown />
                        </div>
                      </div>

                      {/* Dropdown Menu */}
                      {isOpenDropdown?.id === msg?.id && (
                        <div
                          ref={dropdownRef}
                          className={`absolute top-6 z-10 bg-white border rounded-md shadow-md text-sm space-y-1 ${
                            msg?.sender?.id === user?.id ? "right-0" : "left-0"
                          }`}
                        >
                          <button
                            className="w-full text-left hover:bg-gray-100 p-2"
                            onClick={() => {
                              setIsOpenEditMessageModal((prev) => !prev);
                              setMessage(msg?.text);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="w-full text-left hover:bg-gray-100 p-2"
                            onClick={() => {
                              setIsOpenDeleteMessageModal((prev) => !prev);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}

                      {/* Message Text */}
                      <p className="text-sm font-lato mt-1">{msg?.text}</p>
                    </div>

                    {/* Avatar for Sender */}
                    {msg?.sender?.id === user?.id && (
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-400 text-white font-bold text-sm ml-2">
                        {msg?.sender?.name
                          ?.split(" ")
                          .map((word) => word.charAt(0).toUpperCase())
                          .slice(0, 2)
                          .join("")}
                      </div>
                    )}
                  </div>
                ))}
              {!messages.length && (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <Inbox className="h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-lg font-medium">No messages yet</p>
                  <p className="text-sm text-gray-500">
                    Start a conversation by sending a message.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Message Input Section */}
          <div className="border-t p-4">
            {isOpenEditMessageModal ? (
              <div className="flex flex-col bg-gray-100 p-3 rounded-md shadow-inner">
                <h1 className="font-lato pb-3">Edit Message</h1>
                <textarea
                  placeholder="Edit your message..."
                  className="border w-full h-20 rounded-md shadow-inner px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none placeholder-gray-400"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end mt-2 space-x-2">
                  <Button
                    label={"Cancel"}
                    onClick={() => setIsOpenEditMessageModal(false)}
                  />
                  <Button
                    label={"Save"}
                    type={"Primary"}
                    onClick={() => handleSaveEdit(selectedMessage)}
                    isLoading={isSendMessageLoading}
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendMessage}>
                <div className="flex items-end text-black">
                  <textarea
                    placeholder="Write a message..."
                    className="border w-full h-20 rounded-md shadow-inner px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 resize-none placeholder-gray-400"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                  />
                  <button
                    type="submit"
                    className="w-10 h-10 ml-3 rounded-full bg-gray-200 flex justify-center items-center"
                  >
                    {isSendMessageLoading ? (
                      <div className="spinner" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Panel>
        <DeleteConfirmDialog
          isModalOpen={isOpenDeleteMessageModal}
          setIsModalOpen={setIsOpenDeleteMessageModal}
          handleDelete={handleDelete}
          title="Delete message?"
          content="This message will be deleted for all participants in the conversation"
          isLoading={isDeleteLoading}
        />
      </div>
    </Dialog>
  );
};

export default MessagingModal;
