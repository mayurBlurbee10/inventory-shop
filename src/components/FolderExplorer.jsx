"use client";

import {
  Copy,
  Download,
  EllipsisVertical,
  Eye,
  File,
  FileIcon,
  Send,
  Share2,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import PreviewModal from "./FileExplorer/PreviewModal";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Select from 'react-select';

const ShareModal = ({ isOpen, onClose, item, onShareLinkToggle, usersList}) => {
  const [userID, setUserID] = useState('');
  const [copied, setCopied] = useState(false);
  const [userList, setUserList] = useState([]);
  const [sharedLink, setSharedLink] = useState(
    item?.shared_link
      ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-file/${item?.id}`
      : null
  );
  const [collabLoading, setCollabLoading] = useState(false);
  const [collaborator, setCollaborator] = useState([]);

  useEffect(() => {
    setSharedLink(
      item?.shared_link
      ? `${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-file/${item?.id}`
      : null
    );
    setCollaborator(item?.collaborators ? item.collaborators : []);
  }, [item]);

  useEffect(() => {
    const users = usersList.map(user => ({
      value: user.boxUserId,
      label: `${user.name} (${user.email})`
    }));
    setUserList(users);
  }, [usersList]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (sharedLink) {
      navigator.clipboard.writeText(sharedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailShare = async () => {
    try {
      setCollabLoading(true);
      const obj =  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID:userID.value, "role": "viewer", "itemId":item?.id}),
      };
      const response = await fetchWrapper(`api/box/files/share`, obj, 'addCollaborator');
      if (!response.ok) throw new Error('Failed to add collaborator');
      const data = await response.json();
      setCollabLoading(false);
      onAddCollaborator({'id':data.response.id, userID:userID.value, isForAdd: true})
      setUserID('');
    } catch (error) {
      console.error('Add Collaborator error:', error);
      setCollabLoading(false);
    }
  };

  const handleToggleShare = async() => {

      const link = await generateSharedLink(item.id, sharedLink === null)
      if(link !== undefined){
        const newSharedLink =
          sharedLink !== null
            ? null
            : `${process.env.NEXT_PUBLIC_APP_BASE_URL}/shared-file/${item?.id}`;
        setSharedLink(newSharedLink);
        if (onShareLinkToggle) {
          onShareLinkToggle(item.id, newSharedLink);
        }
      }
  };

  const generateSharedLink = async(fileId, isShareable) => {
    try {
      setCollabLoading(true);
      const requestOptions = {
        method: 'GET',
      };
      const response = await fetchWrapper(
        `/api/box/files/share?fileId=${fileId}&isShareable=${isShareable}`, 
        requestOptions, 
        'generateSharedLink'
      );
      setCollabLoading(false);
      if (!response.ok) throw new Error('Failed to get links');
      const data = await response.json();
      return data.sharedLink
    } catch (error) {
      console.error('Failed to get links:', error);
      setCollabLoading(false);
    }
  };

  const handelRemoveCollaborator = async (collaborator) => {
    try {
      setCollabLoading(true);
      const obj = {
        method: "DELETE",
      };
      const response = await fetchWrapper(
        `api/box/files/share?collaboratorId=${collaborator.id}&userId=${collaborator.user.id}`,
        obj,
        "removeCollaborator"
      );
      if (!response.ok) throw new Error("Failed to remove collaborator");
      const data = await response.json();
      setCollabLoading(false);
      onAddCollaborator({
        id: collaborator.id,
        userID: collaborator.user.id,
        isForAdd: false,
      });
    } catch (error) {
      console.error("Remove collaborator error:", error);
      setCollabLoading(false);
    }
  };

  const onAddCollaborator = (collab) => {
    if(collab.isForAdd) {
      const user = usersList.find((user)=>user.boxUserId == collab.userID)
      const collabIndex = collaborator.findIndex(collabs => collabs.id == collab.id);
      console.log('collabIndex: ^^^^^', collabIndex)
      if(collabIndex>-1){
        collaborator[collabIndex]={id:collab.id, role:collab.role, user:{name:user.name, id:user.boxUserId}};
      } else {
        collaborator.push({id:collab.id, role:'viewer', user:{name:user.name, id:user.boxUserId}})
      }
    } else {
      const index = collaborator.findIndex((collabs)=>collabs.id==collab.id);
      if (index > -1) {
        collaborator.splice(index, 1);
      }
    }
    setCollaborator(collaborator)
  };

  const handleRoleChange = async(event, userId, collaborationId) => {
    try {
      setCollabLoading(true);
      const newRole = event.target.value;
      const obj =  {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID:userId, role: newRole, "itemId":collaborationId, updateRole: true}),
      };
      const response = await fetchWrapper(`api/box/files/share`, obj, 'changeCollaboratorRole');
      if (!response.ok) throw new Error('Failed to change collaborator role');
      const data = await response.json();
      setCollabLoading(false);
      onAddCollaborator({
        id: collaborationId,
        userID: userId,
        isForAdd: true,
        role: newRole
      });
    } catch (error) {
      console.error("Change collaborator role error:", error);
      setCollabLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {item?.name}
        </h3>

        <div className="space-y-6">
          {item?.type === "file" && (
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="text-sm font-medium text-gray-700">
                  Share link
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => handleToggleShare()}
                    className={`
                    relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    ${sharedLink !== null ? "bg-blue-600" : "bg-gray-200"}
                    `}
                  >
                    <span
                      className={`
                      pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                      ${sharedLink !== null ? "translate-x-5" : "translate-x-0"}
                      `}
                    />
                  </button>
                </div>
              </div>
              {sharedLink !== null && (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={sharedLink}
                    readOnly
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-sm focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="shrink-0 px-5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <Copy size={16} />
                    <span>{copied ? "Copied!" : "Copy"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {item?.type === "folder" && (
            <div className="space-y-2">
              <label className="text-gray-800">Share via email</label>
              <div className="flex items-center gap-3">
                <Select
                  className="flex-1 py-2.5 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  classNamePrefix="Enter email address"
                  isClearable={true}
                  isSearchable={true}
                  value={userID}
                  onChange={(e) => setUserID(e)}
                  options={userList}
                />
                <button
                  onClick={handleEmailShare}
                  disabled={!userID}
                  className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                    ${
                      userID
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <Send size={16} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          )}
          {collaborator.slice(1).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-gray-700 py-2 pr-2">
                <div>Name</div>
                <div>Permissions</div>
                <div></div>
              </div>
              {collaborator.length > 0 &&
                collaborator.slice(1).map((content) => (
                  <div className="flex items-center justify-between gap-3 text-gray-700 hover:bg-gray-50 rounded-lg py-2 pr-2 group">
                    <div>{content?.user.name}</div>
                    <div>
                      <select 
                        value={content?.role}
                        onChange={(e) => handleRoleChange(e, content?.user.id, content.id)}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="uploader">Uploader</option>
                        <option value="co-owner">Co-owner</option>
                      </select>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          handelRemoveCollaborator(content);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-md text-gray-600"
                        title="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {collabLoading && (
          <div className='absolute top-0 left-0 rounded-xl h-full w-full bg-[#00000038] flex items-center justify-center'>
            <div className="border-blue-500 w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) }
      </div>
    </div>
  );
};

function FolderExplorer({
  fileList,
  setDeleteDropdown,
  deleteDropdown,
  setPath,
  path,
  currentFilesList,
  setCurrentFilesList,
  setSelectedItem,
  selectedItem,
  handleShareLink
}) {
  const [previewFileId, setPreviewFileId] = useState("");
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [shareFile, setShareFile] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);

  useEffect(() => {
    setCurrentFilesList(
      path.length === 0 ? fileList : path[path.length - 1].children
    );
    // setSelectedItem(path === 0 && null);
  }, [path]);

  useEffect(() => {
    fetchUser();
  }, [])

  const handleFolderClick = (folder) => {
    setSelectedItem(folder);
    setPath((prev) => [...prev, folder]);
  };


  const handleDelete = (id) => {
    setDeleteDropdown((prev) => (prev === id ? null : id));
  };

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const handleShare = (file) => {
    setShareFile(file);
    setIsShareModalOpen(true);
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fetchWrapper(
        `api/box/download?fileId=${fileId}`,
        {},
        "download"
      );
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleShareLinkToggle = (itemId, newSharedLink) => {
    if(handleShareLink){
      handleShareLink(itemId, newSharedLink);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetchWrapper(`api/box/users`, {}, 'fetchUserList');
      if (!response.ok) throw new Error('Download failed');
      const data = await response.json();
      setUsersList(data);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <>
      {currentFilesList &&
        currentFilesList.length > 0 &&
        currentFilesList.map((file, index) => {
          return (
            <tr
              key={index}
              className="px-3 hover:bg-gray-50 divide-gray-200 border-b border-b-gray-200 group active:bg-sky-200 active:text-sky-800"
            >
              <td
                className="py-3 pl-4"
                onClick={() =>
                  file.type === "folder" && handleFolderClick(file)
                }
              >
                <div className="flex items-center justify-start gap-3">
                  <File className="h-5 w-5 text-[#3c4043]" />
                  <span className="text-[#3c4043] mt-1 font-semibold text-sm truncate max-w-56">
                    {file?.name}
                  </span>
                </div>
              </td>

              <td className="py-3">
                <div className="flex items-center justify-start gap-2">
                  <span className="text-gray-600 text-sm">You opened</span>
                  <span className="rounded-full bg-gray-600 h-1 w-1 block"></span>
                  <span className="text-gray-600 text-sm">9:30 AM</span>
                </div>
              </td>

              <td className="py-3">
                <div className="flex items-center">
                  <div>
                    <img
                      src="https://img.freepik.com/premium-vector/avatar-icon0002_750950-43.jpg?uid=R149831676&ga=GA1.1.983684055.1709024503&semt=ais_hybrid"
                      className="h-8 w-8 object-contain rounded-full mr-3"
                    />
                  </div>
                  <p className="text-gray-600 text-sm truncate max-w-40 w-full">
                    me
                  </p>
                </div>
              </td>

              <td className="py-3">
                <div className="flex items-center gap-3">
                  <UsersRound className="h-5 w-5 text-gray-600" />
                  <span className="text-gray-600 text-sm truncate max-w-40 w-full">
                    My folder
                  </span>
                </div>
              </td>

              <td className="py-3 pr-3">
                <div className="flex items-center justify-end">
                  <div className="opacity-0 flex items-center justify-start gap-2 group-hover:opacity-100">
                    {/* FOR ONLY FILES */}
                    {file.type === "file" && (
                      <button
                        className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(file?.id);
                          setDeleteDropdown(null);
                        }}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                    <button
                      className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(file);
                        setDeleteDropdown(null);
                      }}
                      title="Share"
                    >
                      <Share2 className="h-4 w-4 text-gray-600" />
                    </button>
                    {file.type === "file" && (
                      <button
                        className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file.id, file.name);
                          setDeleteDropdown(null);
                        }}
                        title="Download"
                      >
                        <Download className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                    
                  </div>
                  <div className="relative">
                    {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
                    <button
                      className="h-8 w-8 rounded-full hover:bg-gray-200 flex items-center justify-center relative"
                      onClick={() => handleDelete(file?.id)}
                    >
                      <EllipsisVertical className="h-4 w-4 text-gray-600" />
                    </button>

                    {/* DELETE DROPDOWN DONE*/}
                    {deleteDropdown === file?.id && (
                      <div className="absolute top-8 left-[-120px] shadow w-40 bg-white rounded-lg z-10 overflow-hidden">
                        <button className="hover:bg-gray-200 w-full py-2 px-3 flex items-center gap-3 text-gray-600">
                          <Trash2 className="h-4 w-4 text-gray-600" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          );
        })}
      {currentFilesList && currentFilesList?.length === 0 && (
        <tr className="px-3">
          <td className="col-span-4">
            <EmptyState />
          </td>
        </tr>
      )}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        fileId={previewFileId}
      />
       <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        item={shareFile}
        onShareLinkToggle={handleShareLinkToggle}
        usersList={usersList}
      />
    </>
  );
}
const EmptyState = () => (
  <div className="flex flex-col w-full items-center justify-center py-12 text-gray-500">
    <FileIcon size={48} className="mb-4 opacity-50" />
    <p>No files or folders found</p>
  </div>
);
export default FolderExplorer;
