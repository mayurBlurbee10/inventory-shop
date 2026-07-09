import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ThemeSwitch } from '@/components/ui/theme-switch';

const PROVIDERS = [
  {
    key: 'microsoft',
    title: 'Microsoft Authentication',
    description: 'Enable sign-in with Microsoft Azure AD',
    fields: [
      { field: 'clientId', label: 'Client ID' },
      { field: 'clientSecret', label: 'Client Secret' },
      { field: 'tenantId', label: 'Tenant ID' },
      { field: 'redirectUri', label: 'Redirect URI' },
    ],
  },
  {
    key: 'okta',
    title: 'Okta Authentication',
    description: 'Enable sign-in with Okta',
    fields: [
      { field: 'orgUrl', label: 'Organization URL' },
      { field: 'clientId', label: 'Client ID' },
      { field: 'clientSecret', label: 'Client Secret' },
      { field: 'redirectUri', label: 'Redirect URI' },
    ],
  },
  {
    key: 'google',
    title: 'Google Authentication',
    description: 'Enable sign-in with Google',
    fields: [
      { field: 'clientId', label: 'Client ID' },
      { field: 'clientSecret', label: 'Client Secret' },
      { field: 'redirectUri', label: 'Redirect URI' },
    ],
  },
  {
    key: 'oauth',
    title: 'OAuth 2.0',
    description: 'Configure a custom OAuth 2.0 provider',
    fields: [
      { field: 'authorizationUrl', label: 'Authorization URL' },
      { field: 'tokenUrl', label: 'Token URL' },
      { field: 'clientId', label: 'Client ID' },
      { field: 'clientSecret', label: 'Client Secret' },
      { field: 'redirectUri', label: 'Redirect URI' },
      { field: 'scope', label: 'Scope' },
    ],
  },
];

const IdentityManagementContent = () => {
  const [authProviders, setAuthProviders] = useState({
    microsoft: false,
    okta: false,
    google: false,
    oauth: false,
  });

  const [providerConfigs, setProviderConfigs] = useState({
    microsoft: { clientId: '', clientSecret: '', tenantId: '', redirectUri: '' },
    okta: { orgUrl: '', clientId: '', clientSecret: '', redirectUri: '' },
    google: { clientId: '', clientSecret: '', redirectUri: '' },
    oauth: {
      authorizationUrl: '',
      tokenUrl: '',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      scope: '',
    },
  });

  const handleToggleProvider = (provider) => {
    setAuthProviders((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const handleConfigChange = (provider, field, value) => {
    setProviderConfigs((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between">
        <h3 className="text-lg font-medium text-foreground">
          Identity Management
        </h3>
        <Button className="px-3 py-3">Save Changes</Button>
      </div>

      <Card className="divide-y divide-border">
        {PROVIDERS.map(({ key, title, description, fields }) => {
          const isEnabled = authProviders[key];
          return (
            <div key={key} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-foreground">{title}</h4>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <ThemeSwitch
                  checked={isEnabled}
                  onCheckedChange={() => handleToggleProvider(key)}
                />
              </div>

              {isEnabled && (
                <div className="mt-4 space-y-4 border-t border-border pt-4">
                  {fields.map(({ field, label }) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={`${key}-${field}`}>{label}</Label>
                      <Input
                        id={`${key}-${field}`}
                        type={field.toLowerCase().includes('secret') ? 'password' : 'text'}
                        value={providerConfigs[key][field]}
                        onChange={(e) => handleConfigChange(key, field, e.target.value)}
                        className="h-10 !bg-background"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
};

export default IdentityManagementContent;
