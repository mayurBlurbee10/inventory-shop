"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut } from 'lucide-react';
import FileExplorer from '@/components/FileExplorer';
import ActionButtons from '@/components/ActionButtons';
import UploadArea from '@/components/UploadArea';
import Footer from '@/components/Footer';
import { getUserData, clearUserData, isAdmin } from '@/app/lib/auth';
import DialogBox from '@/components/DialogBox';
import { fetchWrapper } from '../lib/fetchWrapper';

const processBoxFiles = (files) => {
  const itemsMap = new Map();
  const rootItems = [];

  files.forEach(file => {
    const item = {
      id: file.id,
      name: file.name,
      type: file.type || 'file',
      size: file.size,
      created_at: file.created_at,
      modified_at: file.modified_at,
      children: []
    };
    itemsMap.set(file.id, item);

    if (!file.parent || !itemsMap.has(file.parent?.id)) {
      rootItems.push(item);
    } else {
      const parent = itemsMap.get(file.parent.id);
      parent?.children.push(item);
    }
  });

  return rootItems;
};

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const Header = ({ user, userIsAdmin, router }) => (
  <header className="bg-white border-b border-gray-100 shadow-sm">
    <div className="max-w-[1600px] mx-auto h-28 px-8 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <img src="/logo.png" alt="Wealthportal" className="h-16 w-auto" />
      </div>
      
      <div className="flex items-center space-x-8">
        <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
          Dashboard
        </button>
        <button className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
          Shared documents
        </button>
        {userIsAdmin && (
          <button 
            onClick={() => router.push('/settings')}
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200 font-medium"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        )}
        <div className="flex items-center space-x-3 pl-4 border-l border-gray-100">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${userIsAdmin ? 'bg-blue-600' : 'bg-gray-700'}`}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-medium">{user?.name}</span>
            {userIsAdmin && <span className="text-blue-600 text-sm font-medium">Administrator</span>}
          </div>
        </div>
      </div>
    </div>
  </header>
);

const AccountInfo = ({ user, userIsAdmin }) => (
  <div className="bg-white rounded-xl p-7 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors duration-200">
    <h3 className="text-[22px] font-medium text-gray-900 mb-5">Account Info</h3>
    <div className="space-y-3">
      <p className="text-gray-600 flex justify-between items-center">
        <span className="text-gray-500">Email</span>
        <span className="font-medium">{user?.email}</span>
      </p>
      {user?.boxUserId && (
        <p className="text-gray-600 flex justify-between items-center">
          <span className="text-gray-500">Box ID</span>
          <span className="font-medium">{user.boxUserId}</span>
        </p>
      )}
      {user?.role && (
        <p className="text-gray-600 flex justify-between items-center">
          <span className="text-gray-500">Role</span>
          <span className={`font-medium ${userIsAdmin ? 'text-blue-600' : ''}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
        </p>
      )}
    </div>
  </div>
);

const QuickActions = ({ userIsAdmin, router, handleLogout }) => (
  <div className="bg-white rounded-xl p-7 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors duration-200">
    <h3 className="text-[22px] font-medium text-gray-900 mb-5">Quick Actions</h3>
    <div className="space-y-2">
      {userIsAdmin && (
        <button 
          onClick={() => router.push('/settings')} 
          className="w-full py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-left px-4 flex items-center space-x-3 transition-colors duration-200"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
      )}
      <button 
        onClick={handleLogout}
        className="w-full py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg text-left px-4 flex items-center space-x-3 transition-colors duration-200"
      >
        <LogOut className="w-5 h-5" />
        <span className="font-medium">Sign Out</span>
      </button>
    </div>
  </div>
);

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [filesList, setFilesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploadedfilePath, setUpladedFilePath] = useState('');

  const handleBrowse = (event) => {
    if(event.type === "click"){
      fileInputRef.current?.click();
    } else {
      handleFileSelect(event);
    }
  }
  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      try {
        setIsLoading(true);
        const uploadData = new FormData();
        uploadData.append("file", files[0]);
        if(!!selectedItem && selectedItem.type=="folder"){
          uploadData.append("boxFolderId", selectedItem.id);
        }else{
          const userData = getUserData();
          uploadData.append("boxFolderId", userData.boxFolderId);
        }
        
        const requestOptions = {
          method: 'POST',
          body: uploadData,
        };
        
        const response = await fetchWrapper("/api/box/files", requestOptions, 'uploadFile')
        if (!response.ok) throw new Error('Failed to upload files');
        setIsModalOpen(true);
        setShowUploadArea(false);
        await refreshFiles();
        const path = getFolderPath(filesList, selectedItem.id||userData.boxFolderId);
        const location =`
        <div>
          <div>
            Location: Home${path}
          </div>
          <div>
            Name: ${files[0].name}
          </div>
        </div>
        `;
        setUpladedFilePath(location);
      } catch (error) {
        console.error('Error uploading files:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const refreshFiles = async () => {
    try {
      setIsLoading(true);
      const userData = getUserData();
      const requestOptions = {
        method: 'GET',
      };
      const response = await fetchWrapper(`/api/box/folders?folderId=${userData.boxFolderId}`, requestOptions, 'fetchFile')
      if (!response.ok) throw new Error('Failed to fetch files');
      const data = await response.json();
      setFilesList(data.items)
    } catch (error) {
      console.error('Error refreshing files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearUserData();
    router.push('/login');
  };

  const getFolderPath = (data, folderId, currentPath = "") => {
    for (const item of data) {
      if (item.id === folderId) {
        return currentPath + "/" + item.name;
      }

      if (item.type === "folder" && item.children && item.children.length > 0) {
        const path = getFolderPath(item.children, folderId, currentPath + "/" + item.name);
        if (path) {
          return path;
        }
      }
    }
    return "";
  }

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push('/login');
      return;
    }

    setUser(userData);
    // if (userData.boxFiles) {
    //   setFiles(processBoxFiles(userData.boxFiles));
    // }
    refreshFiles();
  }, [router]);

  if (isLoading) return <LoadingSpinner />;

  const userIsAdmin = isAdmin();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gray-50 flex-1">
        <Header user={user} userIsAdmin={userIsAdmin} router={router} />

        <div className="max-w-[1600px] mx-auto p-8">
          <div className="flex space-x-8">
            <div className="flex-[7]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-medium text-gray-900 mb-1">
                    Shared Documents
                  </h2>
                  <p className="text-gray-500">
                    Securely share content with your advisor and trusted
                    collaborators
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <ActionButtons
                    onFolderCreated={refreshFiles}
                    onUploadClick={() => setShowUploadArea(true)}
                    selectedItem={selectedItem}
                  />
                </div>
              </div>

              {showUploadArea && (
                <div className="mb-6">
                  <UploadArea
                    isForImport = {false}
                    onBrowse={handleBrowse}
                    onClose={() => setShowUploadArea(false)}
                  />
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                multiple
              />

              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <FileExplorer data={filesList} selectedItem={selectedItem} setSelectedItem={setSelectedItem} />
              </div>
            </div>

            <div className="flex-[3]">
              <div className="space-y-6">
                <AccountInfo user={user} userIsAdmin={userIsAdmin} />
                <QuickActions
                  userIsAdmin={userIsAdmin}
                  router={router}
                  handleLogout={handleLogout}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <Footer />
      </div>
      <DialogBox 
      title='File Uploaded' 
      message='File uploaded successfully!'
      fileLocation={uploadedfilePath}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}/>
    </div>
  );
}
