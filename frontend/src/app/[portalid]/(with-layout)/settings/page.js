"use client";

import CustomizationContent from "@/components/Settings/CustomizationContent";
import IdentityManagementContent from "@/components/Settings/IdentityManagementContent";
import ReportsContent from "@/components/Settings/ReportsContent";
import UsersContent from "@/components/Settings/UsersContent";
import { getUserData } from "@/lib/auth";
import {
  ChartLine,
  ChevronRight,
  Layout,
  Palette,
  Plug,
  Users,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PluginManagementPage from "@/components/Settings/PluginManagementPage";
import ThemeContent from "@/components/Settings/ThemeContent";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";

function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isUpdatingRef = useRef(false);

  const tabFromURL = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromURL || "configuration");
  const [isUserData, setIsUserData] = useState("");
  const [isSideBarOpen, setIsSideBarOpen] = useState(false);
  const [showMorePopup, setShowMorePopup] = useState(false);
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

  const tabs = [
    { id: "configuration", label: "Configuration", icon: Layout },
    { id: "identity", label: "Identity Management", icon: Users },
    { id: "reports", label: "Reports", icon: ChartLine },
    { id: "users", label: "User Access", icon: Users },
    { id: "plugins", label: "Plugins", icon: Plug },
    { id: "theme", label: "Theme", icon: Palette },
  ];

  const moreTabs = [
    // Add any additional tabs here that should appear in the "more" dropdown
  ];

  const getActiveContent = () => {
    switch (activeTab) {
      case "configuration":
        return <CustomizationContent />;
      case "users":
        return <UsersContent />;
      case "identity":
        return <IdentityManagementContent />;
      case "reports":
        return <ReportsContent />;
      case "plugins":
        return <PluginManagementPage />;
      case "theme":
        return <ThemeContent />;
      default:
        return null;
    }
  };

  return (
    <div className="relative flex h-[87vh] w-full justify-center rounded-lg bg-background scrollbar-hide">
      <div className="hidden w-2/5 max-w-xs border-r border-border bg-background p-3 text-muted-foreground md:w-72 lg:block scrollbar-hide">
        <h2 className="text-md mb-6 font-semibold text-foreground">Tools</h2>
        <nav className="space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const isMoreTab = id === "more";
            return (
              <div
                key={id}
                className="relative"
                ref={isMoreTab ? moreMenuRef : null}
              >
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (isMoreTab) {
                      setShowMorePopup((prev) => !prev);
                    } else {
                      handleTabChange(id);
                    }
                  }}
                  className={cn(
                    "h-auto w-full justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-secondary-foreground",
                    isActive && "bg-accent font-semibold text-secondary-foreground",
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-5 w-5" />
                    <span className="text-left">{label}</span>
                  </div>
                  {isMoreTab && <ChevronRight className="h-4 w-4" />}
                </Button>

                {isMoreTab && showMorePopup && (
                  <div className="absolute left-full top-0 z-50 ml-3 w-72 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-2xl">
                    {moreTabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-foreground transition-colors hover:bg-accent"
                      >
                        <tab.icon className="h-5 w-5 text-muted-foreground" />
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
      <div className="mt-6 w-full overflow-y-auto p-6 hidden-scrollbar lg:mt-0">
        {getActiveContent()}
      </div>
    </div>
  );
}

export default SettingsPage;
