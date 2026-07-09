"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, FileSearch, Mail, PlusCircle, User } from "lucide-react";
import AddUserModal from "./AddUserModal";
import FileViewerModal from "./FileViewerModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import UploadArea from "../UploadArea";
import { useParams } from "next/navigation";
import ViewProfileModal from "./ViewProfileModal";
import { toast } from "react-toastify";
import LoaderSpinner from "../Common/Elements/LoaderSpinner";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const UsersContent = () => {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [isViewProfileModal, setIsViewProfileModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [onDeleteUser, setOnDeleteUser] = useState(false);
  const fileInputRef = useRef(null);
  const params = useParams();
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  const fetchUsers = async () => {
    try {
      const url = params.portalid
        ? `/api/users?portalid=${params.portalid || "root"}`
        : "/api/users";
      const response = await fetchWrapper(url, {}, "fetch-user");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError("Failed to load users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);
  useEffect(() => {
    if (onDeleteUser) {
      fetchUsers();
      setOnDeleteUser(false);
    }
  }, [onDeleteUser]);

  const handleAddUser = async (newUser) => {
    setUsers((prev) => [...prev, newUser]);
    await fetchUsers()
  };

  const handleViewFiles = (user) => {
    setSelectedUser(user);
    setShowFileViewer(true);
  };

  const handleBrowse = (event) => {
    if (event.type === "click") {
      fileInputRef.current?.click();
    } else {
      handleFileSelect(event);
    }
  };

  const handleReInviteUser = async (user) => {
    try {
      const response = await fetchWrapper(
        "/api/users/resendInviteLink",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email, portalid: params.portalid || "root" }),
        },
        "resend-invite"
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to Resend invite link");
      }
      toast.success("Invite sent successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      try {
        setError("");
        setLoading(true);
        const uploadData = new FormData();
        uploadData.append("file", files[0]);
        const requestOptions = {
          method: "POST",
          body: uploadData,
        };
        const response = await fetchWrapper(
          "/api/box/create-user/bulk",
          requestOptions,
          "bulk"
        );
        if (!response.ok) throw new Error("Failed to create users");
        const savedData = await response.json();
        if (savedData.createdUsers.length > 0) {
          setUsers((prev) => [...prev, ...savedData.createdUsers]);
        }
        setShowUploadArea(false);
        if (savedData.errors.length > 0) {
          setError(JSON.stringify(savedData.errors));
        }
      } catch (error) {
        console.error("Error uploading files:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const sortedUsers =
    users &&
    [...users].sort((a, b) => {
      if (sortConfig.key === "name") {
        return sortConfig.direction === "asc"
          ? a.firstName.localeCompare(b.firstName)
          : b.firstName.localeCompare(a.firstName);
      } else if (sortConfig.key === "email") {
        return sortConfig.direction === "asc"
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      }
      return 0;
    });

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };


  const renderSortButtons = (key) => (
    <div className="flex items-center gap-1">
      <button
        className="flex items-center justify-center"
        onClick={() => toggleSort(key)}
      >
        <ChevronUp
          className={cn(
            "h-4 w-4",
            sortConfig.key === key && sortConfig.direction === "asc"
              ? "text-foreground"
              : "text-muted-foreground/50"
          )}
        />
      </button>
      <button
        className="flex items-center justify-center"
        onClick={() => toggleSort(key)}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4",
            sortConfig.key === key && sortConfig.direction === "desc"
              ? "text-foreground"
              : "text-muted-foreground/50"
          )}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex w-full flex-col items-center justify-between space-y-3 sm:flex-row sm:space-y-0">
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-medium text-foreground">
            User Management
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, roles, and permissions efficiently
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="px-3 py-3">
          <PlusCircle className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {showUploadArea && (
        <div className="mb-6">
          <UploadArea
            isForImport={true}
            onBrowse={handleBrowse}
            onClose={() => setShowUploadArea(false)}
          />
        </div>
      )}
      {/* TODO: handel drag and drop & file upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv"
        onChange={handleFileSelect}
      />

      {error && (
        <Alert variant="destructive" className="border-destructive/30">
          <AlertDescription className="text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center py-8">
          <LoaderSpinner size={32} className="text-secondary-foreground" />
        </div>
      ) : (
        <Card className="custom-scrollbar mt-5 overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="uppercase">
                  <div className="flex items-center justify-start gap-2">
                    <span>Company</span>
                    {renderSortButtons("name")}
                  </div>
                </TableHead>
                <TableHead className="uppercase">
                  <div className="flex items-center justify-start gap-2">
                    <span>Email</span>
                    {renderSortButtons("email")}
                  </div>
                </TableHead>
                <TableHead className="uppercase">Role</TableHead>
                <TableHead className="text-right uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id} className="h-20">
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {user?.company?.logo ? (
                          <AvatarImage
                            src={user.company.logo}
                            alt={`${`${user.firstName || ""} ${user.lastName || ""}`.trim()} logo`}
                            className="object-contain"
                          />
                        ) : null}
                        <AvatarFallback className="bg-accent text-sm font-medium text-primary-solid">
                          {user.firstName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm font-medium text-foreground">
                        {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {user?.permissions?.find(
                      (permission) =>
                        permission.portalId === (params.portalid || "root"),
                    )?.role || "-"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="icons"
                        size="icon"
                        className="rounded-full"
                        title="View Files"
                        onClick={() => handleViewFiles(user)}
                      >
                        <FileSearch className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="icons"
                        size="icon"
                        className="rounded-full"
                        title="View Profile"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsViewProfileModal((prev) => !prev);
                        }}
                      >
                        <User className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="icons"
                        size="icon"
                        className="rounded-full"
                        title="Re-invite"
                        onClick={() => handleReInviteUser(user)}
                      >
                        <Mail className="h-5 w-5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <ViewProfileModal
        isOpen={isViewProfileModal}
        handleClose={() => {
          setIsViewProfileModal(false);
        }}
        user={selectedUser}
        setUser={setSelectedUser}
        setOnDeleteUser={setOnDeleteUser}
        onSumbit={fetchUsers}
      />

      <AddUserModal
        users={users}
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddUser}
      />

      <FileViewerModal
        isOpen={showFileViewer}
        onClose={() => {
          setShowFileViewer(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};

export default UsersContent;
