"use client";
import { clearUserData, getUserData } from "@/app/lib/auth";
import { FileText, Layout, LogOut, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MasterUsersContent from "./MasterUsersContent";
import { useSelector } from "react-redux";

const SidePanel = ({ setCurrentPage }) => {
  const handelItemClick = (item) => {
    setCurrentPage(item);
  };

  return (
    <div className="w-80 bg-[#0061D5] p-6 flex flex-col h-screen fixed left-0">
      <div className="mb-8">
        <Image
          src="/logo_admin.png"
          alt="Client Logo"
          width={150}
          height={100}
          className="w-auto mx-auto"
        />
      </div>

      <nav className="space-y-4 flex-1">
        <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors">
          <Layout className="w-5 h-5 mr-3" />
          Dashboard
        </button>
        <button
          className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors"
          onClick={() => handelItemClick("Super User")}
        >
          <Users className="w-5 h-5 mr-3" />
          User Management
        </button>
        <button
          className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors"
          onClick={() => handelItemClick("Report")}
        >
          <FileText className="w-5 h-5 mr-3" />
          Reports
        </button>
      </nav>
      <button className="flex items-center text-white hover:text-gray-200 w-full px-4 py-2 rounded transition-colors mt-auto">
        Powered by MStrategy
      </button>
    </div>
  );
};

const DashboardHeader = ({
  currentPage,
  currentPageCount,
  user,
  accountDropdown,
  setAccountDropdown,
  handleLogout,
}) => (
  <>
    <div className="flex justify-between items-start">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          {currentPage}
        </h1>
        <p className="text-sm text-gray-500">
          Managing {currentPageCount} {" "}
          {currentPageCount > 1 ? `${currentPage}s` : `${currentPage}`}
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
            className={`size-8 xl:size-10 rounded-full flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-blue-600`}
          >
            {user?.firstName?.charAt(0) || "U"}
          </div>
          <div className="flex flex-col text-sm xl:text-base">
            <span className="text-gray-900 font-medium">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}</span>
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
  </>
);

export default function MasterDashboard() {
  const router = useRouter();
  // const [user, setUser] = useState(null);
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [currentPageCount, setCurrentPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState("Super User");

  const { data: user } = useSelector((state) => state.user);

  const handleLogout = () => {
    setAccountDropdown(false);
    clearUserData();
    router.push("/master/login");
  };

  useEffect(() => {
    const userData = getUserData();
    if (!userData) {
      router.push("login");
      return;
    }

    // setUser(userData);
  }, [router]);

    useEffect(()=>{
      setCurrentPageCount(0);
    },[currentPage])

  return (
    <div
      className="min-h-screen bg-gray-50 flex"
      onClick={() => {
        setAccountDropdown(false);
      }}
    >
      <SidePanel setCurrentPage={setCurrentPage} />
      <div className="flex-1 ml-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardHeader
            currentPageCount={currentPageCount}
            currentPage={currentPage}
            user={user}
            accountDropdown={accountDropdown}
            setAccountDropdown={setAccountDropdown}
            handleLogout={handleLogout}
          />
          {currentPage === "Super User" && (
            <MasterUsersContent setCurrentPageCount={setCurrentPageCount} />
          )}
        </div>
      </div>
    </div>
  );
}
