"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, FileSearch, Import, Mail, Plus, PlusCircle, Search, User } from "lucide-react";
import AddUserModal from "./AddUserModal";
import FileViewerModal from "./FileViewerModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import UploadArea from "../UploadArea";
import { useParams } from "next/navigation";
import ViewProfileModal from "./ViewProfileModal";
import { toast } from "react-toastify";
import Button from "../Common/Elements/Button";

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


  return (
    <div className="space-b-6">
      <div className="flex justify-between items-center space-x-4 ">
      <div className="flex flex-col sm:flex-row justify-between items-center w-full space-y-3 sm:space-y-0">
      <div className="text-center sm:text-left">
            <h3 className="text-lg font-medium text-gray-900">
              User Management
            </h3>
            <p className="text-gray-600 text-sm">
              Manage user accounts, roles, and permissions efficiently
            </p>
          </div>
          {/* <button
            onClick={() => setShowAddModal(true)}
           className="w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center px-4 py-2 text-white bg-[#2463EB] rounded-md hover:bg-[#2463EB]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button> */}
          <Button
          onClick={() => setShowAddModal(true)}
          type="Primary"
          label="Add User"
          icon={PlusCircle}
          />
        </div>
        {/* <div>
          <button
            onClick={() => setShowUploadArea(true)}
            className="px-4 py-2 border border-[#2463EB] text-[#2463EB] bg-white rounded-md inline-flex items-center transition-colors duration-200 hover:bg-[#2463EB] hover:text-white focus:outline-none focus:ring focus:ring-[#2463EB]/50"
          >
            <Import className="w-4 h-4 mr-2" />
            Bulk Import
          </button>
        </div> */}
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
        <div className="p-4 bg-red-50 text-red-600 rounded-md">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-8 min-h-[50vh] items-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-x-scroll custom-scrollbar mt-5">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <div className="flex items-center justify-start gap-2">
                    <span className="block">Company</span>
                    <button className="flex items-center justify-center" onClick={() => toggleSort("name")}>
                      <ChevronUp className={`h-4 w-4 ${sortConfig.key === "name" && sortConfig.direction === "asc" ? "text-black" : "text-gray-400"}`} />
                    </button>
                    <button className="flex items-center justify-center" onClick={() => toggleSort("name")}>
                      <ChevronDown className={`h-4 w-4 ${sortConfig.key === "name" && sortConfig.direction === "desc" ? "text-black" : "text-gray-400"}`} />
                    </button>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  <div className="flex items-center justify-start gap-2">
                    <span className="block">Email</span>
                    <button className="flex items-center justify-center" onClick={() => toggleSort("email")}>
                      <ChevronUp className={`h-4 w-4 ${sortConfig.key === "email" && sortConfig.direction === "asc" ? "text-black" : "text-gray-400"}`} />
                    </button>
                    <button className="flex items-center justify-center" onClick={() => toggleSort("email")}>
                      <ChevronDown className={`h-4 w-4 ${sortConfig.key === "email" && sortConfig.direction === "desc" ? "text-black" : "text-gray-400"}`} />
                    </button>
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user?.company?.logo ? (
                        <img
                          src={user.company.logo}
                          alt={`${`${user.firstName || ''} ${user.lastName || ''}`.trim()} logo`}
                          className="h-8 w-8 object-contain rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">
                            {user.firstName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-3 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        title="View Files"
                        className="text-[#1A4C8A] hover:text-[#15407A] flex justify-center items-center w-10 h-10 hover:bg-gray-100 rounded-full"
                        onClick={() => handleViewFiles(user)}
                      >
                        <FileSearch className="w-5 h-5" />
                      </button>
                      <button
                        title="View Profile"
                        className="text-[#1A4C8A] hover:text-[#15407A] flex justify-center items-center w-10 h-10 hover:bg-gray-100 rounded-full"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsViewProfileModal((prev) => !prev);
                        }}
                      >
                        <User className="w-5 h-5" />
                      </button>
                      <button
                        title="Re-invite"
                        className="text-[#1A4C8A] hover:text-[#15407A] flex justify-center items-center w-10 h-10 hover:bg-gray-100 rounded-full"
                        onClick={() => handleReInviteUser(user)}
                      >
                        <Mail className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
