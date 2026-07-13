import React, { useMemo } from 'react';
import { usePlugins } from './hooks/usePlugins';

// Plugin Renderer - Renders all active plugin components from backend
const PluginRenderer = ({ config = {}, pluginKeys = [] }) => {
  const { pluginsLoaded, error, activePluginComponents } = usePlugins();

  const filteredComponents = useMemo(
    () =>
      pluginKeys.length > 0
        ? activePluginComponents.filter(({ key }) => pluginKeys.includes(key))
        : activePluginComponents,
    [activePluginComponents, pluginKeys]
  );

  if (error) {
    console.error('Plugin loading error:', error);
    return null;
  }

  if (!pluginsLoaded) {
    return null;
  }

  return (
    <>
      {filteredComponents.map(({ key, component: PluginComponent }) => (
        <PluginComponent key={key} config={config} />
      ))}
    </>
  );
};

export default PluginRenderer;