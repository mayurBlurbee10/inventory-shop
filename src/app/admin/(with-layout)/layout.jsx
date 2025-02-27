"use client";
import { clearUserData } from "@/app/lib/auth";
import {
  setActiveUsers,
  setPortals,
  setSuperUsers,
} from "@/store/services/portalService";
import { setCurrentUser } from "@/store/services/userService";
import { FileText, Layout, LogOut, MenuIcon, Users, X } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const SidePanel = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname.includes("dashboard");
  const isReports = pathname.includes("reports");
  const isUserManagement = pathname.includes("user-management");
  return (
    <div className="w-80 bg-[#0061D5] z-50 p-6 flex flex-col h-screen fixed left-0">
      <div className="mb-8">
        <Image
          src="/M_Strategy_logo.png"
          alt="Client Logo"
          width={100}
          height={80}
          className="w-auto mx-auto"
        />
      </div>

      <nav className="space-y-4 flex-1">
        <button
          className={`flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded-lg transition-colors hover:bg-blue-600
            ${
              isDashboard
                ? "bg-blue-700"
                : "hover:bg-blue-650"
            }`}
          onClick={() => router.push("dashboard")}
        >
          <Layout className="w-5 h-5 mr-3" />
          Dashboard
        </button>
        <button
          className={`flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded-lg transition-colors hover:bg-blue-600
            ${
              isReports
                ? "bg-blue-700"
                : "hover:bg-blue-650"
            }`}
          onClick={() => router.push("reports")}
        >
          <FileText className="w-5 h-5 mr-3" />
          Reports
        </button>

        <button
          className={`flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded-lg transition-colors hover:bg-blue-600
            ${
              isUserManagement
                ? "bg-blue-700"
                : "hover:bg-blue-650"
            }`}
          onClick={() => router.push("user-management")}
        >
          <Users className="w-5 h-5 mr-3" />
          User Management
        </button>
      </nav>
      <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors mt-auto">
        Powered by MStrategy
      </button>
    </div>
  );
};

const DashboardHeader = ({
  user,
  accountDropdown,
  setAccountDropdown,
  handleLogout,
}) => {
  const pathname = usePathname();
  const [currentPage, setCurrentPage] = useState("Portals");
  const { data: portals, superUsers: superUsers } = useSelector(
    (state) => state.portal
  );

  useEffect(() => {
    setCurrentPage(
      pathname.includes("/dashboard")
        ? "Portals"
        : pathname.includes("/reports")
        ? "Reports"
        : "Super User"
    );
  }, [pathname]);

  return (
    <div className="flex justify-between items-start">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {currentPage}
        </h1>
        <p className="text-sm text-gray-500">
          Managing{" "}
          {currentPage === "Super User" ? superUsers?.length : portals?.length}{" "}
          {currentPage}
        </p>
      </div>
      <div className="flex items-center space-x-8 cursor-pointer">
        <div
          className="flex items-center space-x-3 pl-4 border-l border-gray-100 relative"
          onClick={(e) => {
            e.stopPropagation();
            setAccountDropdown((prev) => !prev);
          }}
        >
          {/* ADD CLICK EVENT FOR DROPDOWN DONE*/}
          <div
            className={`size-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-[#0061D5]`}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex flex-col text-sm xl:text-base">
            <span className="text-gray-900 font-medium">{user?.name}</span>
          </div>

          {/* DROPDOWN SECTION DONE*/}
          {accountDropdown && (
            <div className="absolute top-12 overflow-hidden right-0 rounded-2xl custom-shadow max-w-60 w-60 bg-indigo-50 py-2 z-20">
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
  );
};

export default function AdminDashboardLayout({ children }) {
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [accountDropdown, setAccountDropdown] = useState(false);

  const router = useRouter();

  const { data: user } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const clearStoreData = () => {
    dispatch(setPortals([]));
    dispatch(setActiveUsers(0));
    dispatch(setSuperUsers([]));
    dispatch(setCurrentUser(null));
  };

  const handleLogout = () => {
    setAccountDropdown(false);
    clearUserData();
    clearStoreData();
    router.push("login");
  };
  return (
    <div
      className="min-h-screen bg-gray-50"
      onClick={() => {
        setAccountDropdown(false);
      }}
    >
      <div
        className={`sm:hidden fixed w-full border-b border-gray-200 top-0 left-0  z-50 bg-white p-4 flex items-center justify-start ${
          sidePanelOpen ? "hidden" : "block"
        }`}
        onClick={() => setSidePanelOpen((prev) => !prev)}
      >
        {sidePanelOpen ? "" : <MenuIcon className="" />}
      </div>

      {sidePanelOpen && (
        <div
          className="fixed top-4 left-4 z-[60] text-white cursor-pointer"
          onClick={() => setSidePanelOpen(false)}
        >
          <X className="" />
        </div>
      )}
      <div
        className={`sm:block z-[50]  ${sidePanelOpen ? "block" : "hidden"} `}
      >
        <SidePanel />
      </div>

      <div className="flex-1 pt-10 sm:pt-0 sm:ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:py-8 pt-10">
          <DashboardHeader
            user={user}
            accountDropdown={accountDropdown}
            setAccountDropdown={setAccountDropdown}
            handleLogout={handleLogout}
          />
          {children}
        </div>
      </div>
    </div>
  );
}
