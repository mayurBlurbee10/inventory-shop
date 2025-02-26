'use client'
import AppearanceContent from '@/components/AppearanceContent';
import BoxSettingsContent from '@/components/Settings/BoxSettingsContent';
import ContentManagementContent from '@/components/Settings/ContentManagementContent';
import IdentityManagementContent from '@/components/Settings/IdentityManagementContent';
import InvoicingContent from '@/components/Settings/InvoicingContent';
import MyPageContent from '@/components/Settings/MyPageContent';
import ProductsContent from '@/components/Settings/ProductsContent';
import ReportsContent from '@/components/Settings/ReportsContent';
import UsersContent from '@/components/Settings/UsersContent';
import { getUserData } from '@/lib/auth';
import { Box, ChartLine, ChevronRight, FileSpreadsheet, FileText, Layout, Plug, ShoppingBag, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('homepage_configuration');
  const [isUserData, setIsUserData] = useState("");
  const { data: config } = useSelector((state) => state.portal);
  const [colors, setColors] = useState({
    primaryColor : config.primaryColor,
    secondaryColor : config.secondaryColor,
    accentColor : config.accentColor
  })

  useEffect(() => {
    const userData = getUserData();
    setIsUserData(userData?.isOnboardingRequired)
  }, []);
  // console.log('isUserData', isUserData);

  const tabs = [
    { id: 'homepage_configuration', label: 'Home Page', icon: FileText },
    { id: 'my_page', label: 'Pages', icon: Layout },
    // { id: 'appearance', label: 'Theme', icon: Layout },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Widgets', icon: ShoppingBag },
    // { id: 'content', label: 'Content', icon: FileText },
    { id: 'identity', label: 'Identity Management', icon: Users },
    // { id: 'invoicing', label: 'Forms', icon: FileSpreadsheet },
    { id: 'Integrations', label: 'Integrations', icon: Plug },
    // { id: 'box', label: 'Box Settings', icon: Box }
    { id: 'reports', label: 'Reports', icon: ChartLine }
  ];

  const getActiveContent = () => {
    switch (activeTab) {
      case 'homepage_configuration':
        return <ContentManagementContent isManageRequired="true" onboardingStatus={isUserData} colors={colors} setColors={setColors}/>;
      case 'my_page':
        return <MyPageContent/>;
      // case 'appearance':
      //   return <AppearanceContent />;
      case 'users':
        return <UsersContent />;
      case 'identity':
        return <IdentityManagementContent />;
     
      // case 'invoicing':
      //   return <InvoicingContent />;
      // case 'box':
      //   return <BoxSettingsContent />;
      case 'Integrations':
        return <div><h1 className='text-gray-700'>Coming Soon..</h1></div>;
      case 'products':
        return <ProductsContent />;
        case 'reports':
        return <ReportsContent />;
      default:
        return null;
    }
  };

  return (
    // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg flex justify-center relative w-full h-[85vh]">
      <div className="w-2/5 md:w-72 border-r border-[#dee2e6] p-3 bg-white text-gray-700 max-w-xs">
        <h2 className="text-xl text-gray-800 font-semibold mb-6">Tools</h2>
        <nav className="space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out ${activeTab === id
                ? 'bg-[#5a7dff]/95 text-white'
                : 'text-gray-700/90 hover:bg-blue-600/10'
                }`}
            >
              <div className="flex items-center space-x-3">
                <div><Icon className={`w-5 h-5 ${activeTab === id ? 'text-white' : 'text-gray-700/90'
                  }`} /></div>
                <span className='text-left'>{label}</span>
              </div>
              <div> <ChevronRight className={`w-4 h-4 ${activeTab === id ? 'text-white' : 'text-gray-700/80'
                }`} /></div>
            </button>
          ))}
        </nav>
      </div>
      <div className="md:flex-1 w-full p-6 overflow-y-auto">
        {getActiveContent()}
      </div>
    </div>
    // </div>
  );
}

export default SettingsPage