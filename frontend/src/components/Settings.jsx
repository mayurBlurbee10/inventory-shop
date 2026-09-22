import React, { useState } from 'react';
import { Settings as SettingsIcon, Users, Layout, Box, FileText, ShoppingBag, FileSpreadsheet, ChevronRight, X, Plug } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import AppearanceContent from './AppearanceContent';
import UsersContent from './Settings/UsersContent';
import BoxSettingsContent from './Settings/BoxSettingsContent';
import ContentManagementContent from './Settings/ContentManagementContent';
import IdentityManagementContent from './Settings/IdentityManagementContent';
import InvoicingContent from './Settings/InvoicingContent';
import ProductsContent from './Settings/ProductsContent';

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');

  if (!isOpen) return null;

  const tabs = [
    { id: 'appearance', label: 'Theme', icon: Layout },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'products', label: 'Widgets', icon: ShoppingBag },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'identity', label: 'Identity Management', icon: Users },
    { id: 'invoicing', label: 'Forms', icon: FileSpreadsheet },
    { id: 'Integrations', label: 'Integrations', icon: Plug },
    { id: 'box', label: 'Box Settings', icon: Box }
  ];

  const getActiveContent = () => {
    switch (activeTab) {
      case 'appearance':
        return <AppearanceContent />;
      case 'users':
        return <UsersContent />;
      case 'identity':
        return <IdentityManagementContent />;
      case 'content':
        return <ContentManagementContent />;
      case 'invoicing':
        return <InvoicingContent />;
      case 'box':
        return <BoxSettingsContent />;
      case 'Integrations':
        return <div><h1 className='text-gray-700'>Coming Soon..</h1></div>;
      case 'products':
        return <ProductsContent />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-7xl h-[90vh] flex p-0 overflow-hidden bg-background border border-border"
        overlayClassName="bg-black/50"
        showCloseButton={false}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 text-gray-400 hover:text-gray-500"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="w-2/5 md:w-64 border-r border-gray-600 p-3 bg-[#3f4347] flex-shrink-0">
          <h2 className="text-xl font-semibold text-white mb-6">Settings</h2>
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-in-out ${activeTab === id
                    ? 'bg-white/95 text-gray-900'
                    : 'text-white/90 hover:bg-white/10'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${activeTab === id ? 'text-gray-700' : 'text-white/90'
                    }`} />
                  <span>{label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${activeTab === id ? 'text-gray-700' : 'text-white/90'
                  }`} />
              </button>
            ))}
          </nav>
        </div>
        <div className="w-3/5 md:flex-1 p-6 overflow-y-auto bg-gray-50">
          {getActiveContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
