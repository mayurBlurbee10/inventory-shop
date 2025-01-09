"use client";

import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  FolderPlus,
  Headset,
  House,
  LogOut,
  Menu,
  Plus,
  Settings,
  Upload,
  UsersRound,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import TechSupport from "./TechSupport";

function Header({
  user,
  userIsAdmin,
  router,
  handleLogout,
  accountDropdown,
  setAccountDropdown,
  config,
  handelSettings,
  setIsNewFolderModalOpen,
  setShowUploadArea,
}) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isOpenNewFolder, setIsOpenNewFolder] = useState(false);
  const [isTechSupportModalOpen, setIsTechSupportModalOpen] = useState(false);

  useEffect(() => {
    setIsSideMenuOpen(false);
  }, [router]);

  return (
    <>
      <header className=" border-gray-100 py-2">
        <div className="px-4 xl:px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div
              className="flex items-center md:hidden"
              onClick={() => setIsSideMenuOpen((prev) => !prev)}
            >
              <Menu className="translate-y-1/3 xl:translate-y-1/2 text-[#3c4043]" />
            </div>
            {/* <img src="/logo.png" alt="Wealthportal" className="h-12 w-auto" /> */}
            <img
              src={
                user?.company?.logo
                  ? user.company.logo.replace("/api/upload", "/uploads")
                  : config?.logo || "/logo.png"
              }
              alt="Premierportal"
              className="h-12 xl:h-24 w-auto"
            />
          </div>

          <div className="flex items-center space-x-8">
            <div
              className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
              onClick={() => setAccountDropdown((prev) => !prev)}
            >
              {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
              <div
                className={`size-8 xl:size-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${
                  userIsAdmin ? "bg-blue-600" : "bg-gray-700"
                }`}
              >
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex flex-col text-sm xl:text-base">
                <span className="text-gray-900 font-medium">{user?.name}</span>
                {userIsAdmin && (
                  <span className="text-blue-600 text-sm font-medium">
                    Administrator
                  </span>
                )}
              </div>

              {/* DROPDOWN SECTION DONE*/}
              {accountDropdown && (
                <div className="absolute top-16 overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
                  <button className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200">
                    <CircleUserRound className="h-5 w-5" /> Account Info
                  </button>
                  {userIsAdmin && (
                    <button
                      onClick={handelSettings}
                      className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                    >
                      <Settings className="h-5 w-5" />
                      Settings
                    </button>
                  )}
                  {userIsAdmin && (
                    <button
                      onClick={() => setIsTechSupportModalOpen((prev) => !prev)}
                      className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                    >
                      <Headset className="h-5 w-5" />
                      Tech Support
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {user?.company?.logo && (
          <div className="fixed bottom-1 right-7 pb-1 pl-3 pr-3 mr-5 hidden xl:block bg-white shadow p-1 rounded-md z-10">
            <div>
              <p className="text-gray-500 text-[9px]">Powered by</p>
            </div>
            <div className="flex items-center justify-center">
              {/* <img src="/logo.png" alt="Premierportal" className="h-20 w-auto" /> */}
              <img
                src={config?.logo || "/logo.png"}
                alt="Premierportal"
                className="h-16 w-auto"
              />
            </div>
          </div>
        )}
      </header>
      {isSideMenuOpen && (
        <div className="max-w-[260px] h-screen flex  md:hidden bg-gray-50 absolute left-0 top-0 text-[#3c4043] z-20">
          <div className="p-8">
            <div className="flex items-center justify-end">
              <button
                onClick={() => setIsSideMenuOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6 text-[#3c4043]" />
              </button>
            </div>
            <div className="flex flex-col px-5">
              <button
                className="flex items-center justify-between w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1 active:bg-sky-200 active:text-sky-800"
                onClick={() => setIsOpenNewFolder((prev) => !prev)}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" /> New
                </div>
                {isOpenNewFolder ? (
                  <ChevronDown size={16} color="#374151" />
                ) : (
                  <ChevronRight size={16} color="#374151" />
                )}
              </button>
              {isOpenNewFolder && (
                <div>
                  <button
                    className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setIsNewFolderModalOpen((prev) => !prev);
                      setIsOpenNewFolder(false);
                      setIsSideMenuOpen(false);
                    }}
                  >
                    <FolderPlus className="h-5 w-5" />
                    New folder
                  </button>
                  <button
                    className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100"
                    onClick={() => {
                      setShowUploadArea((prev) => !prev);
                      setIsOpenNewFolder(false);
                      setIsSideMenuOpen(false);
                    }}
                  >
                    <Upload className="h-5 w-5" />
                    Upload
                  </button>
                </div>
              )}
              <button
                className="flex items-center gap-2 w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1 active:bg-sky-200 active:text-sky-800"
                onClick={() => router.push("home")}
              >
                <House className="h-5 w-5" /> Home
              </button>

              <button
                className="flex items-center gap-2 w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1"
                onClick={() => router.push("sharewithme")}
              >
                <UsersRound className="h-5 w-5" /> Shared with me
              </button>

              <button
                className="flex items-center gap-2 w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1"
                onClick={handelSettings}
              >
                <Settings className="h-5 w-5" /> Settings
              </button>
            </div>
          </div>
        </div>
      )}
      <TechSupport
        isOpen={isTechSupportModalOpen}
        onClose={() => setIsTechSupportModalOpen(false)}
      />
    </>
  );
}

export default Header;
