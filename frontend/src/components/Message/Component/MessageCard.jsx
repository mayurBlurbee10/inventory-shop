"use client";
import { ArrowLeft, Send } from "lucide-react";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useSocket } from "@/app/lib/useSocket";
import { getUserInitials } from "@/utils/helper";
import { useSelector } from "react-redux";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";

const formatMsgTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const MESSAGES_API_PATH = "/api/real-messages";

const MessageCard = ({
  selectedUser,
  onBack,
  currentUserId,
  portalId,
}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputBoxRef = useRef(null);
  const currentUser = useMemo(
    () => ({ id: currentUserId || "user", name: "You" }),
    [currentUserId],
  );
  const [expandedMessages, setExpandedMessages] = useState(new Set());
  const { socket, connected, onlineUserIds } = useSocket();
  const useRealtime = Boolean(currentUserId && portalId && selectedUser?.id);
  const { data: config } = useSelector((state) => state.portal);
  const isSelectedUserOnline =
    selectedUser?.online || onlineUserIds.includes(selectedUser?.id);

  const toggleExpandMessage = (id) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const formatMessage = useCallback(
    (message) => ({
      id: message.id,
      sender: message.sender?.id ?? message.senderId ?? message.sender,
      text: message.text,
      time: formatMsgTime(message.createdAt),
    }),
    [],
  );

  useEffect(() => {
    if (!useRealtime) return;
    setMessagesLoading(true);
    const url = `${MESSAGES_API_PATH}?portalId=${encodeURIComponent(portalId)}&senderId=${encodeURIComponent(currentUserId)}&receiverId=${encodeURIComponent(selectedUser.id)}`;
    fetchWrapper(url, {}, "fetch-messages")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => {
        const list = Array.isArray(data?.data) ? data.data : [];
        setMessages(list.map(formatMessage));
      })
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));
  }, [useRealtime, portalId, currentUserId, selectedUser?.id, formatMessage]);

  useEffect(() => {
    if (!socket || !useRealtime) return;
    socket.emit("join_conversation", {
      portalId,
      otherUserId: selectedUser.id,
    });
    const onNewMessage = (payload) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [...prev, formatMessage(payload)];
      });
    };
    socket.on("new_message", onNewMessage);
    return () => {
      socket.off("new_message", onNewMessage);
      socket.emit("leave_conversation", {
        portalId,
        otherUserId: selectedUser.id,
      });
    };
  }, [socket, useRealtime, portalId, selectedUser?.id, formatMessage]);

  const handleSendOrSave = useCallback(() => {
    const text = input.trim();
    if (!text || !useRealtime || sending) return;

    if (useRealtime && socket && connected) {
      socket.emit("send_message", {
        receiverId: selectedUser.id,
        text,
        portalId,
      });
      setInput("");
      return;
    }

    setSending(true);
    fetchWrapper(
      MESSAGES_API_PATH,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          portalId,
          text,
        }),
      },
      "create-message",
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data?.data) return;
        setMessages((prev) => [...prev, formatMessage(data.data)]);
        setInput("");
      })
      .finally(() => setSending(false));
  }, [
    input,
    selectedUser?.id,
    useRealtime,
    socket,
    connected,
    portalId,
    sending,
    formatMessage,
  ]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className="bg-white flex flex-col h-full min-h-0"
      style={{
        "--accent": config?.accentColor || "#2563EB",
        "--primary": config?.primaryColor || "#ffffff",
        "--secondary": config?.secondaryColor || "#2563EB",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-white shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-gray-700 hover:text-gray-900 font-semibold"
              onClick={onBack}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary)] flex items-center justify-center mr-3 shrink-0">
            <span className="text-sm font-bold text-[var(--secondary)]">
              {getUserInitials(selectedUser?.firstName + ' ' + selectedUser?.lastName)}
            </span>
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                isSelectedUserOnline ? "bg-green-500" : "bg-gray-400"
              }`}
              aria-label={isSelectedUserOnline ? "Online" : "Offline"}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--secondary)] truncate">
              {selectedUser?.firstName} {selectedUser?.lastName}
            </p>
            <p className="text-xs text-[var(--secondary)] truncate">
              {selectedUser?.email ?? ""}
            </p>
            <div className="flex items-center gap-1">
              <span
                className={`h-2 w-2 rounded-full ${
                  isSelectedUserOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <p
                className={`text-xs ${
                  isSelectedUserOnline ? "text-green-600" : "text-gray-500"
                }`}
              >
                {isSelectedUserOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 hidden-scrollbar relative">
        {messagesLoading && (
          <div className="flex justify-center items-center h-full text-gray-500 text-sm">
            <LoaderSpinner size={32} className="text-[var(--secondary)]" />
          </div>
        )}
        {!messagesLoading &&
          messages.map((msg) => {
            const isCurrentUser = msg?.sender === currentUser?.id;
            const isExpanded = expandedMessages.has(msg.id);
            const needsToggle = (msg.text?.length || 0) > 80;

            return (
              <div
                key={msg.id}
                className={`flex flex-col mb-4 ${
                  isCurrentUser ? "items-end" : "items-start"
                }`}
              >
                {/* Message Bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm text-sm ${
                    isCurrentUser
                      ? "bg-[var(--primary)] text-[var(--accent)] rounded-br-md"
                      : "bg-white text-[var(--secondary)] border border-gray-200 rounded-bl-md"
                  }`}
                >
                  <div
                    className={`break-words ${
                      isExpanded ? "" : "line-clamp-2 overflow-hidden"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {needsToggle && (
                    <button
                      type="button"
                      onClick={() => toggleExpandMessage(msg.id)}
                      className={`text-xs mt-1 font-semibold hover:font-bold ${
                        isCurrentUser
                          ? "text-[var(--accent)] hover:text-gray-200"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {isExpanded ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-xs text-gray-400 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="border-t px-4 py-3 bg-white flex items-center gap-2 shrink-0">
        <input
          ref={inputBoxRef}
          type="text"
          className="flex-1 min-h-[44px] text-gray-600 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendOrSave();
            }
          }}
          disabled={!useRealtime || sending}
        />
        <button
          type="button"
          onClick={handleSendOrSave}
          disabled={!input.trim() || !useRealtime || sending}
          className="p-2 rounded-lg bg-[var(--primary)] transition-all duration-200 text-[var(--accent)] hover:bg-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      {useRealtime && !connected && (
        <p className="text-xs text-amber-600 px-4 pb-2 text-center">
          Connecting...
        </p>
      )}
    </div>
  );
};

export default React.memo(MessageCard);
