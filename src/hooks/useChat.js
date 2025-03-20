import { fetchWrapper } from "@/app/lib/fetchWrapper";
// import { useSocket } from "@/context/SocketProvider";
import { useEffect, useState } from "react";

export const useChat = (userId, senderId, receiverId, portalId) => {
  // const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const fetchMessages = async () => {
    try {
      setIsLoadingMessages(true);
      if (!receiverId) {
        return;
      }
      setMessages([]);
      const res = await fetchWrapper(
        `/api/messages?portalId=${portalId}&senderId=${senderId}&receiverId=${receiverId}`,
        {},
        "fetch-messages"
      );
      const data = await res.json();
      setMessages(data?.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    // if (!isConnected || !userId) {
    //   console.log("Not connected");
    //   return;
    // };

    // socket.emit("userJoined", userId);

    fetchMessages();

    // const handleNewMessage = (message) => setMessages(message);
    // socket.on("newMessage", handleNewMessage);

    // const handleOnlineUsers = (users) => setOnlineUsers(users);
    // socket.on("onlineUser", handleOnlineUsers);

    // return () => {
    //   socket.off("newMessage", handleNewMessage);
    //   socket.off("onlineUser", handleOnlineUsers);
    // };
    // }, [isConnected, userId, senderId, receiverId, portalId]);
  }, [userId, senderId, receiverId, portalId]);

  const sendMessage = async (text) => {
    // if (!isConnected) {
    //   console.error("Socket is not connected. Cannot send message.");
    //   return;
    // }

    const messageData = {
      sender: senderId,
      receiver: receiverId,
      portalId,
      text,
    };

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

      // socket.emit("sendMessage", messageData);
      await fetchMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const editMessage = async (messageId, text) => {
    // if (!isConnected) {
    //   console.error("Socket is not connected. Cannot send message.");
    //   return;
    // }

    const messageData = {
      messageId,
      text,
    };

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

      // socket.emit("sendMessage", messageData);
      await fetchMessages();
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const deleteMessage = async (messageId) => {
    // if (!isConnected) {
    //   console.error("Socket is not connected. Cannot send message.");
    //   return;
    // }

    try {
      const response = await fetchWrapper(
        "/api/messages",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId }),
        },
        "delete-message"
      );

      if (!response.ok) throw new Error("Failed to delete message");

      // socket.emit("sendMessage", messageData);
      await fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return { messages, sendMessage, onlineUsers, editMessage, deleteMessage, isLoadingMessages };
};
