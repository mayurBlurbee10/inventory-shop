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
import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import PluginManagementPage from "@/components/Settings/PluginManagementPage";

function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: config } = useSelector((state) => state.portal);
  const isUpdatingRef = useRef(false);

  const tabFromURL = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromURL || "configuration");
  const [isUserData, setIsUserData] = useState("");
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [showMorePopup, setShowMorePopup] = useState(false);
  const [colors, setColors] = useState({
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
  });
  const moreMenuRef = useRef(null);

  useEffect(() => {
    const userData = getUserData();
    setIsUserData(userData?.isOnboardingRequired);
  }, []);
  useEffect(() => {
    if (!isUpdatingRef.current && tabFromURL && tabFromURL !== activeTab) {
      setActiveTab(tabFromURL);
    }
  }, [tabFromURL, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMorePopup(false);
      }
    };

    if (showMorePopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMorePopup]);

  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return;

    isUpdatingRef.current = true;
    setActiveTab(tabId);

    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);
    router.replace(`?${params.toString()}`);

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);

    if (window.innerWidth < 1024) {
      setIsSideBarOpen(false);
    }
  };

  const shouldHighlightMyFormsTab = () => {
    return ["forms_management", "form_submission"].includes(activeTab);
  };

  const isTabActive = (tabId) => {
    if (tabId === "forms_management") {
      return shouldHighlightMyFormsTab();
    }
    setActiveTab(tabId);
    return activeTab === tabId;
  };

  const tabs = [
    // { id: 'homepage_configuration', label: 'Home Page', icon: FileText },
    { id: "configuration", label: "Configuration", icon: Layout },
    // { id: 'my_page', label: 'Pages', icon: Layout },
    // { id: 'appearance', label: 'Theme', icon: Layout },
    // { id: 'products', label: 'Widgets', icon: ShoppingBag },
    // { id: 'content', label: 'Content', icon: FileText },
    { id: "identity", label: "Identity Management", icon: Users },
    // { id: 'invoicing', label: 'Forms', icon: FileSpreadsheet },
    // { id: 'Integrations', label: 'Integrations', icon: Plug },
    // { id: 'box', label: 'Box Settings', icon: Box }
    { id: "reports", label: "Reports", icon: ChartLine },
    { id: "users", label: "User Access", icon: Users },
    { id: "plugins", label: "Plugins", icon: Plug },
  ];

  const moreTabs = [
    // Add any additional tabs here that should appear in the "more" dropdown
  ];

  const getActiveContent = () => {
    switch (activeTab) {
      // case 'homepage_configuration':
      //   return <ContentManagementContent isManageRequired="true" onboardingStatus={isUserData} colors={colors} setColors={setColors}/>;
      case "configuration":
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
      case "plugins":
        return <PluginManagementPage />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg flex justify-center relative w-full h-[87vh]">
      <div className="hidden lg:block w-2/5 md:w-72 border-r border-[#dee2e6] p-3 bg-gray-50 text-gray-700 max-w-xs">
        <h2 className="text-md text-gray-800 font-semibold mb-6">
          Tools
        </h2>
        <nav className="space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const isMoreTab = id === "more";
            return (
              <div key={id} className="relative" ref={isMoreTab ? moreMenuRef : null}>
                <button
                  onClick={() => {
                    if (isMoreTab) {
                      setShowMorePopup((prev) => !prev);
                    } else {
                      handleTabChange(id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ease-in-out
          ${isActive ? "font-semibold" : "hover:bg-accent"
                    }`}
                  style={{
                    backgroundColor: isActive
                      ? config.accentColor
                      : "transparent",

                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = config.accentColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "";
                    }
                  }}
                >
                  <div className="flex items-center space-x-3 text-black">
                    <div>
                      <Icon
                        className="w-5 h-5"
                      />
                    </div>
                    <span className="text-left">{label}</span>
                  </div>
                  <div>
                    {isMoreTab && <ChevronRight
                      className="w-4 h-4"
                      style={{
                        color: isActive ? config.secondaryColor : "inherit",
                      }}
                    />}
                  </div>
                </button>

                {isMoreTab && showMorePopup && (
                  <div className="absolute top-0 left-full ml-3 w-72 bg-white rounded-2xl border border-gray-200 shadow-2xl p-2 z-50">
                    {moreTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <tab.icon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
      {/* {isSideBarOpen && (
        <div className="absolute z-40 top-0 left-0 h-[87vh] flex">
          <div className="w-72 border-r border-[#dee2e6] p-3 bg-white text-gray-700 max-w-xs shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md text-gray-800 font-semibold">
                Manage Portal
              </h2>
              <div
                className="hover:bg-gray-100 rounded-full flex justify-start p-1 cursor-pointer"
                onClick={() => setIsSideBarOpen(false)}
              >
                <X className="w-6 h-6 " />
              </div>
            </div>
            {tabs.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => {
                    handleTabChange(id);
                    setIsSideBarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ease-in-out hover:font-bold
          ${isActive ? "font-semibold" : "text-gray-700/90 hover:bg-blue-600/10"
                    }`}
                  style={{
                    backgroundColor: isActive
                      ? config.accentColor
                      : "transparent", // <-- your active bg color
                    color: isActive ? config.secondaryColor : "",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = config.secondaryColor;
                      e.currentTarget.style.backgroundColor =
                        config.accentColor;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = ""; // reset to gray
                      e.currentTarget.style.backgroundColor = "";
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <Icon
                        className="w-5 h-5"
                        style={{
                          color: isActive ? config.secondaryColor : "inherit",
                        }}
                      />
                    </div>
                    <span className="text-left">{label}</span>
                  </div>
                  <div>
                    <ChevronRight
                      className="w-4 h-4"
                      style={{
                        color: isActive ? config.secondaryColor : "inherit",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )} */}
      <div className="w-full p-6 overflow-y-auto mt-6 lg:mt-0">
        {getActiveContent()}
      </div>


    </div>
  );
}

export default SettingsPage;
