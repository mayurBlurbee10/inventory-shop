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
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
            <Card className="flex-1 min-h-0 overflow-hidden border-border shadow-sm">
              <CardContent className="flex h-full min-h-0 flex-col p-0">
                <div className="flex-1 min-h-0 overflow-y-auto bg-card hidden-scrollbar">
                  {usersLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      <LoaderSpinner size={32} className="text-secondary-foreground" />
                    </div>
                  ) : users.length ? (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className={
                          selectedUser?.id === user?.id
                            ? "bg-accent text-accent-foreground"
                            : "bg-card text-card-foreground"
                        }
                      >
                        <UserCard
                          user={{ ...user, online: isUserOnline(user.id) }}
                          onSelect={handleSelectUser}
                          config={config}
                        />
                      </div>
                    ))
                  ) : usersError ? (
                    <div className="flex h-full items-center justify-center px-4">
                      <Alert
                        variant="destructive"
                        className="max-w-md border-destructive/30"
                      >
                        <AlertDescription className="text-center text-destructive">
                          {usersError}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No users available.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a user to start a conversation.
          </div>
        )}
      </div>
    </div>
  );
}
