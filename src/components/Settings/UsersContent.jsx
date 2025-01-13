"use client";
import React, { useState, useEffect, useRef } from "react";
import { Import, Plus } from "lucide-react";
import AddUserModal from "./AddUserModal";
import FileViewerModal from "./FileViewerModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import UploadArea from "../UploadArea";
import { useParams } from "next/navigation";
import ViewProfileModal from "./ViewProfileModal";

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

  const fetchUsers = async () => {
    try {
      const url = params.portalid
        ? `/api/users?portalid=${params.portalid}`
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
    if(onDeleteUser){
      fetchUsers();
      setOnDeleteUser(false)
    }
  }, [onDeleteUser]);

  const handleAddUser = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
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

  return (
    <div className="space-b-6">
      <div className="flex justify-between items-center space-x-4 pr-4">
        <div className="flex justify-between items-center w-full">
          <div>
            <h3 className="text-lg font-medium text-gray-900">User Management</h3>
            <p className='text-gray-600 text-sm'>Manage user accounts, roles, and permissions efficiently</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-white bg-[#2463EB] rounded-md hover:bg-[#2463EB] inline-flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </button>
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
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user?.company?.logo ? (
                        <img
                          src={user.company.logo}
                          alt={`${user.name} logo`}
                          className="h-8 w-8 object-contain rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-[#1A4C8A] hover:text-[#15407A] mr-4"
                      onClick={() => handleViewFiles(user)}
                    >
                      View Files
                    </button>
                    <button
                      className="text-[#1A4C8A] hover:text-[#15407A]"
                      onClick={() => {
                        setIsViewProfileModal((prev) => !prev);
                        setSelectedUser(user);
                      }}
                    >
                      View Profile
                    </button>
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
