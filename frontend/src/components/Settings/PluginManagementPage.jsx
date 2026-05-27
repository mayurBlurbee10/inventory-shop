import React from 'react';
import { Puzzle, Settings, Power, PowerOff, RefreshCw, Loader } from 'lucide-react';
import { useSelector } from 'react-redux';
import usePlugins from 'Plugins/hooks/usePlugins';

// Plugin Management Page - Admin Interface
const PluginManagementPage = () => {
    const {
        pluginsLoaded,
        loading,
        error,
        availablePlugins,
        portalPluginConfigs,
        addPluginToPortal,
        togglePluginStatus,
        isPluginConfigured,
        isPluginActive,
        refreshPlugins
    } = usePlugins();
    const { data: config } = useSelector((state) => state.portal);
    const portalId = config?.id;

    if (!pluginsLoaded && loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="w-full flex justify-center">
                    <Loader className="w-5 h-5 animate-spin text-gray-600" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <h3 className="text-red-800 font-semibold text-lg mb-2">Error Loading Plugins</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => handleRefreshPlugins()}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const handleRefreshPlugins = async () => {
        if (refreshPlugins) {
            await refreshPlugins;
            window.location.reload();
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Plugin Management</h1>
                        <p className="text-gray-600 text-lg">
                            Manage plugins for this portal. Enable or disable functionality as needed.
                        </p>
                    </div>
                    <button
                        onClick={() => handleRefreshPlugins()}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <Puzzle className="w-8 h-8 text-blue-500 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Total Plugins</p>
                            <p className="text-2xl font-bold text-gray-900">{availablePlugins.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <Power className="w-8 h-8 text-green-500 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Active Plugins</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {portalPluginConfigs.filter(config => config.isEnabled && config.portalId === portalId).length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center">
                        <PowerOff className="w-8 h-8 text-gray-500 mr-3" />
                        <div>
                            <p className="text-sm text-gray-600">Inactive Plugins</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {portalPluginConfigs.filter(config => !config.isEnabled && config.portalId === portalId).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Plugins List */}
            <div className="bg-white border border-gray-200 rounded-lg">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Available Plugins</h2>
                    <p className="text-gray-600 mt-1">Manage plugin functionality</p>
                </div>

                <div className="p-6">
                    {availablePlugins.length === 0 ? (
                        <div className="text-center py-12">
                            <Puzzle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Plugins Available</h3>
                            <p className="text-gray-600">Plugins will appear here once they are registered in the system.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {availablePlugins.map(plugin => {
                                const isConfigured = isPluginConfigured(plugin.pluginKey);
                                const isActive = isPluginActive(plugin.pluginKey);
                                const config = portalPluginConfigs.find(c => c.pluginKey === plugin.pluginKey);

                                return (
                                    <div key={plugin.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center mb-3">
                                                    <Puzzle className="w-6 h-6 text-blue-500 mr-3" />
                                                    <h3 className="text-lg font-semibold text-gray-900">{plugin.pluginName}</h3>
                                                    <span className={`ml-3 px-2 py-1 text-xs rounded-full ${!isConfigured
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {!isConfigured ? 'Not Added' : isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>

                                                <p className="text-gray-600 mb-3">{plugin.description}</p>

                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span>Version: {plugin.version}</span>
                                                    <span>Key: {plugin.pluginKey}</span>
                                                </div>

                                                {/* {config && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center text-sm text-gray-500">
                              <Settings className="w-4 h-4 mr-2" />
                              <span>Configuration ID: {config.id}</span>
                              <span className="mx-2">•</span>
                              <span>Created: {new Date(config.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        )} */}
                                            </div>

                                            <div className="ml-6">
                                                <button
                                                    onClick={() =>
                                                        !isConfigured
                                                            ? addPluginToPortal(plugin.pluginKey)
                                                            : togglePluginStatus(plugin.pluginKey)
                                                    }
                                                    disabled={loading}
                                                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${!isConfigured
                                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                                        : isActive
                                                            ? 'bg-red-500 text-white hover:bg-red-600'
                                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                                        }`}
                                                >
                                                    {!isConfigured ? (
                                                        <>
                                                            <Power className="w-4 h-4 mr-2" />
                                                            Add Plugin
                                                        </>
                                                    ) : isActive ? (
                                                        <>
                                                            <PowerOff className="w-4 h-4 mr-2" />
                                                            Inactive
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Power className="w-4 h-4 mr-2" />
                                                            Activate
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PluginManagementPage;
