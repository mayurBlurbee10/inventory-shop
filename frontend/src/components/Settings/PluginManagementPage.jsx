import React from 'react';
import { Puzzle, Power, PowerOff, RefreshCw, Loader } from 'lucide-react';
import { useSelector } from 'react-redux';
import usePlugins from '../../../Plugins/hooks/usePlugins';
import { cn } from '@/app/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

    const handleRefreshPlugins = async () => {
        if (refreshPlugins) {
            await refreshPlugins;
            window.location.reload();
        }
    };

    if (!pluginsLoaded && loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="flex w-full justify-center">
                    <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Alert variant="destructive" className="border-destructive/30">
                    <AlertTitle className="text-lg text-destructive">
                        Error Loading Plugins
                    </AlertTitle>
                    <AlertDescription className="mb-4 text-destructive/90">
                        {error}
                    </AlertDescription>
                    <Button variant="destructive" onClick={() => handleRefreshPlugins()}>
                        <RefreshCw className="h-4 w-4" />
                        Retry
                    </Button>
                </Alert>
            </div>
        );
    }

    const activeCount = portalPluginConfigs.filter(
        (c) => c.isEnabled && c.portalId === portalId
    ).length;
    const inactiveCount = portalPluginConfigs.filter(
        (c) => !c.isEnabled && c.portalId === portalId
    ).length;

    return (
        <div className="mx-auto max-w-6xl p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-bold text-foreground">
                            Plugin Management
                        </h1>
                        <p className="text-lg text-muted-foreground">
                            Manage plugins for this portal. Enable or disable functionality as needed.
                        </p>
                    </div>
                    <Button onClick={() => handleRefreshPlugins()} disabled={loading} className="px-3 py-3">
                        <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center p-6">
                        <Puzzle className="mr-3 h-8 w-8 text-primary-solid" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Plugins</p>
                            <p className="text-2xl font-bold text-foreground">
                                {availablePlugins.length}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center p-6">
                        <Power className="mr-3 h-8 w-8 text-success" />
                        <div>
                            <p className="text-sm text-muted-foreground">Active Plugins</p>
                            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center p-6">
                        <PowerOff className="mr-3 h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="text-sm text-muted-foreground">Inactive Plugins</p>
                            <p className="text-2xl font-bold text-foreground">{inactiveCount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Plugins List */}
            <Card>
                <CardHeader className="border-b border-border">
                    <CardTitle className="text-xl">Available Plugins</CardTitle>
                    <CardDescription>Manage plugin functionality</CardDescription>
                </CardHeader>

                <CardContent className="p-6">
                    {availablePlugins.length === 0 ? (
                        <div className="py-12 text-center">
                            <Puzzle className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-medium text-foreground">
                                No Plugins Available
                            </h3>
                            <p className="text-muted-foreground">
                                Plugins will appear here once they are registered in the system.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {availablePlugins.map((plugin) => {
                                const isConfigured = isPluginConfigured(plugin.pluginKey);
                                const isActive = isPluginActive(plugin.pluginKey);

                                return (
                                    <div
                                        key={plugin.id}
                                        className="rounded-lg border border-border p-6 transition-shadow hover:shadow-md"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="mb-3 flex items-center">
                                                    <Puzzle className="mr-3 h-6 w-6 text-primary-solid" />
                                                    <h3 className="text-lg font-semibold text-foreground">
                                                        {plugin.pluginName}
                                                    </h3>
                                                    <Badge
                                                        className={cn(
                                                            'ml-3',
                                                            !isConfigured
                                                                ? 'bg-warning/15 text-warning-foreground'
                                                                : isActive
                                                                    ? 'bg-success/15 text-success'
                                                                    : 'bg-muted text-muted-foreground'
                                                        )}
                                                    >
                                                        {!isConfigured
                                                            ? 'Not Added'
                                                            : isActive
                                                                ? 'Active'
                                                                : 'Inactive'}
                                                    </Badge>
                                                </div>

                                                <p className="mb-3 text-muted-foreground">
                                                    {plugin.description}
                                                </p>

                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <span>Version: {plugin.version}</span>
                                                    <span>Key: {plugin.pluginKey}</span>
                                                </div>
                                            </div>

                                            <div className="ml-6">
                                                <Button
                                                    onClick={() =>
                                                        !isConfigured
                                                            ? addPluginToPortal(plugin.pluginKey)
                                                            : togglePluginStatus(plugin.pluginKey)
                                                    }
                                                    disabled={loading}
                                                    variant={isConfigured && isActive ? 'destructive' : 'default'}
                                                    className={cn(
                                                        'px-3 py-3',
                                                        !isConfigured &&
                                                            'bg-success text-success-foreground hover:bg-success/90'
                                                    )}
                                                >
                                                    {!isConfigured ? (
                                                        <>
                                                            <Power className="h-4 w-4" />
                                                            Add Plugin
                                                        </>
                                                    ) : isActive ? (
                                                        <>
                                                            <PowerOff className="h-4 w-4" />
                                                            Inactive
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Power className="h-4 w-4" />
                                                            Activate
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PluginManagementPage;
