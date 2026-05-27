import React from 'react';
import { usePlugins } from './hooks/usePlugins';

// Plugin Renderer - Renders all active plugin components from backend
const PluginRenderer = ({ config = {}, pluginKeys = [] }) => {
  const { pluginsLoaded, loading, error, getActivePluginComponents } = usePlugins();

  // if (loading) {
  //   return (
  //     <div className="flex items-center space-x-2">
  //       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
  //       <span className="text-xs text-gray-500">Loading plugins...</span>
  //     </div>
  //   );
  // }

  if (error) {
    console.error('Plugin loading error:', error);
    return null;
  }

  if (!pluginsLoaded) {
    return null;
  }

  const activePluginComponents = getActivePluginComponents();
  
  // Filter plugins based on pluginKeys if provided
  const filteredComponents = pluginKeys.length > 0 
    ? activePluginComponents.filter(({ key }) => pluginKeys.includes(key))
    : activePluginComponents;

  return (
    <>
      {filteredComponents.map(({ key, component: PluginComponent }) => (
        <PluginComponent key={key} config={config} />
      ))}
    </>
  );
};

export default PluginRenderer;