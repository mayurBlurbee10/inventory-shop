import { fetchWrapper } from '@/app/lib/fetchWrapper';

// Plugin API Service
class PluginAPIService {
  // Get all available plugins
  async getAvailablePlugins() {
    try {
      const response = await fetchWrapper('/api/inbuild-plugins', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch available plugins');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching available plugins:', error);
      return [];
    }
  }

  // Get portal plugin configurations
  async getPortalPluginConfigs(portalId) {
    try {
      const response = await fetchWrapper(`/api/portal-plugin-configs/portal/${portalId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch portal plugin configs');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching portal plugin configs:', error);
      return [];
    }
  }

  // Add plugin to portal (create new configuration)
  async addPluginToPortal(portalId, pluginKey) {
    try {
      const response = await fetchWrapper('/api/portal-plugin-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalId,
          pluginKey,
          isEnabled: true,
          configuration: {}
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add plugin to portal');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error adding plugin to portal:', error);
      throw error;
    }
  }

  // Toggle plugin status (more efficient than activate/deactivate)
  async togglePluginStatus(portalId, pluginKey) {
    try {
      const response = await fetchWrapper(`/api/portal-plugin-configs/portal/${portalId}/plugin/${pluginKey}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle plugin status');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error toggling plugin status:', error);
      throw error;
    }
  }

  // Update plugin configuration
  async updatePluginConfig(configId, config) {
    try {
      const response = await fetchWrapper(`/api/portal-plugin-configs/${configId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to update plugin config');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error updating plugin config:', error);
      throw error;
    }
  }
}

// Create singleton instance
const pluginAPIService = new PluginAPIService();
export default pluginAPIService;