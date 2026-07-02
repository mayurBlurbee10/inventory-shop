"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import UserCard from "./Component/UserCard";
import MessageCard from "./Component/MessageCard";
import { getUserDataSync } from "@/app/lib/auth";
import { useSelector } from "react-redux";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useSocket } from "@/app/lib/useSocket";

export default function MessageComponent() {
  const params = useParams();
  const portalId = params?.portalid ?? "root";
  const currentUser = getUserDataSync();
  const currentUserId = currentUser?.id ?? null;
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const { data: config } = useSelector((state) => state.portal);
  const [view, setView] = useState("list");
  const { onlineUserIds } = useSocket();

  const isUserOnline = (userId) => onlineUserIds.includes(userId);

  useEffect(() => {
    if (!currentUserId) {
      setUsers([]);
      setUsersLoading(false);
      return;
    }

    setUsersLoading(true);
    setUsersError("");
    const url = `/api/users?portalid=${encodeURIComponent(portalId)}`;
    fetchWrapper(url, {}, "fetch-users-message")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // const isAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;
        // const targetRole = isAdmin ? UserRole.USER : UserRole.ADMIN;
        const mapped = list
          .filter((u) => u.id !== currentUserId)
          .map((u) => ({
            id: u.id,
            firstName: u.firstName ?? u.email ?? "Unknown",
            lastName: u.lastName ?? "",
            email: u.email ?? "",
            company: u.company,
            chats: [],
          }));
        setUsers(mapped);
        if (mapped.length) setSelectedUser(mapped[0]);
      })
      .catch(() => {
        setUsers([]);
        setSelectedUser(null);
        setUsersError("Unable to load message users.");
      })
      .finally(() => setUsersLoading(false));
  }, [portalId, currentUser?.role, currentUserId]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setView("chat");
  };

  const handleDeleteUser = (userId) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
    if (selectedUser?.id === userId) {
      const remainingUsers = users.filter((u) => u.id !== userId);
      setSelectedUser(remainingUsers[0] || null);
      setView("list");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden">
        {view === "list" ? (
          <div className="h-full min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto hidden-scrollbar">
              {usersLoading ? (
                <div className="flex justify-center items-center h-full text-[var(--secondary)] text-sm">
                  <LoaderSpinner size={32} />
                </div>
              ) : users.length ? (
                users.map((user) => (
                  <div
                    key={user.id}
                    className={`p-1 ${
                      selectedUser?.id === user?.id
                        ? "bg-gray-300 text-black"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <UserCard
                      user={{ ...user, online: isUserOnline(user.id) }}
                      onSelect={handleSelectUser}
                      config={config}
                    />
                  </div>
                ))
              ) : usersError ? (
                <div className="flex items-center justify-center h-full px-4 text-center text-sm text-red-500">
                  {usersError}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--secondary)]">
                  No users available.
                </div>
              )}
            </div>
          </div>
        ) : selectedUser ? (
          <div className="h-full min-h-0 overflow-auto">
            <MessageCard
              selectedUser={{
                ...selectedUser,
                online: isUserOnline(selectedUser.id),
              }}
              onBack={() => setView("list")}
              onDeleteUser={handleDeleteUser}
              currentUserId={currentUserId}
              portalId={config?.id}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--secondary)]">
            Select a user to start a conversation.
          </div>
        )}
      </div>
    </div>
  );
}
