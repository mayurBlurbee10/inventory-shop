import { FolderPlus, House, Plus, Settings, Upload, UsersRound } from 'lucide-react'
import React from 'react'

function Sidepanel({
    sidepanelDropdown,
    setSidepanelDropdown,
    setIsNewFolderModalOpen,
    setShowUploadArea,
    router,
  }) {
  return (
    <div className="max-w-[260px] w-full">
    <div className="p-4">
      <div className="relative">
        {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
        <button
          className="flex items-center gap-2 py-3 px-5 mb-4 bg-white rounded-lg custom-shadow text-gray-800 group hover:bg-blue-100 transition-all ease-in-out duration-100 relative"
          onClick={() => setSidepanelDropdown((prev) => !prev)}
        >
          <Plus /> New
        </button>

        {/* DROPDOWN SECTION Done*/}
        {sidepanelDropdown && (
          <div className="absolute top-16 overflow-hidden left-0 max-w-52 w-full bg-white shadow py-2">
            {/* <div className="pb-2 border-b-gray-300  border-b"> */}
            {/* <button className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100">
                <FilePlus className="h-5 w-5" />
                New document
              </button> */}

            <button
              className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100"
              onClick={() => setIsNewFolderModalOpen((prev) => !prev)}
            >
              <FolderPlus className="h-5 w-5" />
              New folder
            </button>
            <button
              className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100"
              onClick={() => setShowUploadArea((prev) => !prev)}
            >
              <Upload className="h-5 w-5" />
              Upload
            </button>
            {/* </div> */}
            {/* <div className="pt-2">
              <button className="flex items-center gap-4 w-full py-2 px-3 bg-white text-gray-800 text-sm hover:bg-gray-100">
                <Upload className="h-5 w-5" />
                Upload
              </button>
            </div> */}
          </div>
        )}

        <button className="flex items-center gap-2 w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1 active:bg-sky-200 active:text-sky-800" onClick={() => router.push("/home")}>
          <House className="h-5 w-5" /> Home
        </button>

        <button className="flex items-center gap-2 w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1" onClick={() => router.push("/sharewithme")}>
          <UsersRound className="h-5 w-5" /> Shared with me
        </button>

        <button className="flex items-center gap-2 w-full rounded-full font-medium py-2 px-3 text-gray-800 text-sm hover:bg-gray-200 my-1" onClick={() => router.push("/settings")}>
          <Settings className="h-5 w-5" /> Settings
        </button>
      </div>
    </div>
  </div>
  )
}

export default Sidepanel