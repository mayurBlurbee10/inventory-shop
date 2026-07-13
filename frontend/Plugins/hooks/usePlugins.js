import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import pluginAPIService from '../services/PluginAPIService.js';
import { BoxAIPluginButton } from '../box-ai/BoxAIPlugin.js';

const PLUGIN_COMPONENT_MAP = {
  box_ai: BoxAIPluginButton,
};

// Hook for using the plugin system with backend API
export const usePlugins = () => {
  const [pluginsLoaded, setPluginsLoaded] = useState(false);
  const [availablePlugins, setAvailablePlugins] = useState([]);
  const [portalPluginConfigs, setPortalPluginConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { data: config } = useSelector((state) => state.portal);
  const portalId = config?.id;

  useEffect(() => {
    if (portalId) {
      loadPlugins();
    }
  }, [portalId]);

  const loadPlugins = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load available plugins and portal configs in parallel
      const [plugins, configs] = await Promise.all([
        pluginAPIService.getAvailablePlugins(),
        pluginAPIService.getPortalPluginConfigs(portalId)
      ]);

      setAvailablePlugins(plugins);
      setPortalPluginConfigs(configs);
      setPluginsLoaded(true);
    } catch (err) {
      setError(err.message);
      console.error('Error loading plugins:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get active plugins for current portal
  const getActivePlugins = () => {
    return portalPluginConfigs.filter(config => config.isEnabled && config.portalId === portalId);
  };

  // Check if specific plugin is configured for portal
  const isPluginConfigured = (pluginKey) => {
    return portalPluginConfigs.some(config => 
      config.pluginKey === pluginKey && config.portalId === portalId
    );
  };

  // Check if specific plugin is active
  const isPluginActive = (pluginKey) => {
    return portalPluginConfigs.some(config => 
      config.pluginKey === pluginKey && config.isEnabled && config.portalId === portalId
    );
  };

  // Get plugin configuration
  // const getPluginConfig = (pluginKey) => {
  //   return portalPluginConfigs.find(config => 
  //     config.pluginKey === pluginKey
  //   );
  // };

  // Add plugin to portal
  const addPluginToPortal = async (pluginKey) => {
    try {
      setLoading(true);
      const plugin = availablePlugins.find(p => p.pluginKey === pluginKey);
      
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      await pluginAPIService.addPluginToPortal(portalId, pluginKey);
      await loadPlugins(); // Reload to get updated configs
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error adding plugin to portal:', err);
      return false;
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  // Toggle plugin status (activate/deactivate)
  const togglePluginStatus = async (pluginKey) => {
    try {
      setLoading(true);
      const plugin = availablePlugins.find(p => p.pluginKey === pluginKey);
      
      if (!plugin) {
        throw new Error('Plugin not found');
      }

      await pluginAPIService.togglePluginStatus(portalId, pluginKey);
      await loadPlugins(); // Reload to get updated configs
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error toggling plugin status:', err);
      return false;
    } finally {
      setLoading(false);
      window.location.reload();
    }
  };

  // Get active plugin components
  const activePluginComponents = useMemo(() => {
    if (!pluginsLoaded) return [];

    return portalPluginConfigs
      .filter((config) => config.isEnabled && config.portalId === portalId)
      .map((config) => {
        const plugin = availablePlugins.find(
          (p) => p.pluginKey === config.pluginKey
        );
        if (!plugin) return null;

        const Component = PLUGIN_COMPONENT_MAP[plugin.pluginKey];
        if (!Component) return null;

        return {
          key: plugin.pluginKey,
          component: Component,
        };
      })
      .filter(Boolean);
  }, [pluginsLoaded, portalPluginConfigs, availablePlugins, portalId]);

  const getActivePluginComponents = () => activePluginComponents;

  return {
    pluginsLoaded,
    loading,
    error,
    availablePlugins,
    portalPluginConfigs,
    getActivePlugins,
    isPluginConfigured,
    isPluginActive,
    // getPluginConfig,
    addPluginToPortal,
    togglePluginStatus,
    getActivePluginComponents,
    activePluginComponents,
    refreshPlugins: loadPlugins
  };
};

export default usePlugins;