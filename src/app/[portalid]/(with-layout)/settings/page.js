"use client";
import AppearanceContent from "@/components/AppearanceContent";
import BoxSettingsContent from "@/components/Settings/BoxSettingsContent";
import ContentManagementContent from "@/components/Settings/ContentManagementContent";
import CustomizationContent from "@/components/Settings/CustomizationContent";
import IdentityManagementContent from "@/components/Settings/IdentityManagementContent";
import InvoicingContent from "@/components/Settings/InvoicingContent";
import MyPageContent from "@/components/Settings/MyPageContent";
import ProductsContent from "@/components/Settings/ProductsContent";
import ReportsContent from "@/components/Settings/ReportsContent";
import UsersContent from "@/components/Settings/UsersContent";
import { getUserData } from "@/lib/auth";
import {
  Box,
  ChartLine,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Layout,
  Menu,
  Plug,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

function SettingsPage() {
  const [activeTab, setActiveTab] = useState("customization");
  const [isUserData, setIsUserData] = useState("");
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const { data: config } = useSelector((state) => state.portal);
  const [colors, setColors] = useState({
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
  });

  useEffect(() => {
    const userData = getUserData();
    setIsUserData(userData?.isOnboardingRequired);
  }, []);
  // console.log('isUserData', isUserData);

  const tabs = [
    // { id: 'homepage_configuration', label: 'Home Page', icon: FileText },
    { id: "customization", label: "Customization", icon: Layout },
    // { id: 'my_page', label: 'Pages', icon: Layout },
    // { id: 'appearance', label: 'Theme', icon: Layout },
    { id: "users", label: "Users", icon: Users },
    // { id: 'products', label: 'Widgets', icon: ShoppingBag },
    // { id: 'content', label: 'Content', icon: FileText },
    { id: "identity", label: "Identity Management", icon: Users },
    // { id: 'invoicing', label: 'Forms', icon: FileSpreadsheet },
    // { id: 'Integrations', label: 'Integrations', icon: Plug },
    // { id: 'box', label: 'Box Settings', icon: Box }
    { id: "reports", label: "Reports", icon: ChartLine },
  ];

  const getActiveContent = () => {
    switch (activeTab) {
      // case 'homepage_configuration':
      //   return <ContentManagementContent isManageRequired="true" onboardingStatus={isUserData} colors={colors} setColors={setColors}/>;
      case "customization":
        return <CustomizationContent />;
      // case 'my_page':
      //   return <MyPageContent/>;
      // case 'appearance':
      //   return <AppearanceContent />;
      case "users":
        return <UsersContent />;
      case "identity":
        return <IdentityManagementContent />;

      // case 'invoicing':
      //   return <InvoicingContent />;
      // case 'box':
      //   return <BoxSettingsContent />;
      // case 'Integrations':
      //   return <div><h1 className='text-gray-700'>Coming Soon..</h1></div>;
      // case 'products':
      //   return <ProductsContent />;
      case "reports":
        return <ReportsContent />;
      default:
        return null;
    }
  };

  return (
    // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg flex justify-center relative w-full min-h-[calc(100vh-180px)] lg:h-[calc(100vh-180px)]">
      <div className="hidden lg:block w-2/5 md:w-72 border-r h-[calc(100vh-120px)] border-[#dee2e6] p-3 bg-white text-gray-700 max-w-xs">
        <h2 className="text-xl text-gray-800 font-semibold mb-6">Tools</h2>
        <nav className="space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out ${
                activeTab === id
                  ? "bg-[#2563eb]/95 text-white"
                  : "text-gray-700/90 hover:bg-blue-600/10"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div>
                  <Icon
                    className={`w-5 h-5 ${
                      activeTab === id ? "text-white" : "text-gray-700/90"
                    }`}
                  />
                </div>
                <span className="text-left">{label}</span>
              </div>
              <div>
                {" "}
                <ChevronRight
                  className={`w-4 h-4 ${
                    activeTab === id ? "text-white" : "text-gray-700/80"
                  }`}
                />
              </div>
            </button>
          ))}
        </nav>
      </div>
      <div
        className={`block lg:hidden absolute top-2 left-2 z-10 ${
          isSideBarOpen ? "hidden" : "block"
        }`}
      >
        <Menu
          className="w-6 h-6 text-gray-800 cursor-pointer"
          onClick={() => setIsSideBarOpen((prev) => !prev)}
        />
      </div>
      {isSideBarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSideBarOpen(false)}
          />

          {/* Fixed Sidebar */}
          <div className="fixed h-[calc(100vh)] z-40 top-0 left-0 flex">
            <div className="w-56 md:w-72 border-r border-[#dee2e6] p-3 bg-white text-gray-700 max-w-xs shadow-lg">
              <div className="flex justify-between items-center mt-2 mb-4">
                <h2 className="text-md text-gray-800 font-semibold">Tools</h2>
                <button onClick={() => setIsSideBarOpen(false)}>
                  <X className="w-5 h-5 text-gray-600 hover:text-gray-800 cursor-pointer" />
                </button>
              </div>
              <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-160px)]">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => {
                      setActiveTab(id);
                      setIsSideBarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out ${
                      activeTab === id
                        ? "bg-[#2563eb]/95 text-white"
                        : "text-gray-700/90 hover:bg-blue-600/10"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div>
                        <Icon
                          className={`w-5 h-5 ${
                            activeTab === id ? "text-white" : "text-gray-700/90"
                          }`}
                        />
                      </div>
                      <span className="text-left">{label}</span>
                    </div>
                    <div>
                      <ChevronRight
                        className={`w-4 h-4 ${
                          activeTab === id ? "text-white" : "text-gray-700/80"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </>
      )}
      <div className="md:flex-1 min-h-[calc(100vh-180px)] overflow-auto hidden-scrollbar w-full p-6">
        {getActiveContent()}
      </div>
    </div>
    // </div>
  );
}

export default SettingsPage;
