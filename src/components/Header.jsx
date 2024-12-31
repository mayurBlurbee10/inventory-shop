import { CircleUserRound, LogOut, Settings } from 'lucide-react'
import React from 'react'

function Header({
    user,
    userIsAdmin,
    router,
    handleLogout,
    accountDropdown,
    setAccountDropdown,
  }) {
  return (
    <header className=" border-gray-100 py-2">
    <div className="px-8 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <img src="/logo.png" alt="Wealthportal" className="h-12 w-auto" />
      </div>

      <div className="flex items-center space-x-8">
        <div
          className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
          onClick={() => setAccountDropdown((prev) => !prev)}
        >
          {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 ${
              userIsAdmin ? "bg-blue-600" : "bg-gray-700"
            }`}
          >
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col">
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
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2 w-full p-3 bg-indigo-50 text-gray-800 text-sm hover:bg-slate-200"
              >
                <Settings className="h-5 w-5" />
                Setting
              </button>
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
  </header>
  )
}

export default Header