import React, { useState } from 'react';
import Button from '../Common/Elements/Button';

const IdentityManagementContent = () => {
  const [authProviders, setAuthProviders] = useState({
    microsoft: false,
    okta: false,
    google: false,
    oauth: false
  });
  
  const [providerConfigs, setProviderConfigs] = useState({
    microsoft: {
      clientId: '',
      clientSecret: '',
      tenantId: '',
      redirectUri: ''
    },
    okta: {
      orgUrl: '',
      clientId: '',
      clientSecret: '',
      redirectUri: ''
    },
    google: {
      clientId: '',
      clientSecret: '',
      redirectUri: ''
    },
    oauth: {
      authorizationUrl: '',
      tokenUrl: '',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      scope: ''
    }
  });

  const handleToggleProvider = (provider) => {
    setAuthProviders(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const handleConfigChange = (provider, field, value) => {
    setProviderConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const renderProviderConfig = (provider) => {
    if (!authProviders[provider]) return null;

    const configs = {
      microsoft: [
        { field: 'clientId', label: 'Client ID' },
        { field: 'clientSecret', label: 'Client Secret' },
        { field: 'tenantId', label: 'Tenant ID' },
        { field: 'redirectUri', label: 'Redirect URI' }
      ],
      okta: [
        { field: 'orgUrl', label: 'Organization URL' },
        { field: 'clientId', label: 'Client ID' },
        { field: 'clientSecret', label: 'Client Secret' },
        { field: 'redirectUri', label: 'Redirect URI' }
      ],
      google: [
        { field: 'clientId', label: 'Client ID' },
        { field: 'clientSecret', label: 'Client Secret' },
        { field: 'redirectUri', label: 'Redirect URI' }
      ],
      oauth: [
        { field: 'authorizationUrl', label: 'Authorization URL' },
        { field: 'tokenUrl', label: 'Token URL' },
        { field: 'clientId', label: 'Client ID' },
        { field: 'clientSecret', label: 'Client Secret' },
        { field: 'redirectUri', label: 'Redirect URI' },
        { field: 'scope', label: 'Scope' }
      ]
    };

    return (
      <div className="mt-4 space-y-4 border-t pt-4">
        {configs[provider].map(({ field, label }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700">
              {label}
            </label>
            <input
              type={field.includes('secret') ? 'password' : 'text'}
              value={providerConfigs[provider][field]}
              onChange={(e) => handleConfigChange(provider, field, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Identity Management</h3>
        {/* <button className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Save Changes
        </button> */}
        <Button
          type="Primary"
          label="Save Changes"
        />
      </div>

      <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
        {/* Microsoft Authentication */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Microsoft Authentication</h4>
                <p className="text-sm text-gray-500">Enable sign-in with Microsoft Azure AD</p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => handleToggleProvider('microsoft')}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${authProviders.microsoft ? 'bg-blue-600' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${authProviders.microsoft ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </div>
          {renderProviderConfig('microsoft')}
        </div>

        {/* Okta Authentication */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Okta Authentication</h4>
                <p className="text-sm text-gray-500">Enable sign-in with Okta</p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => handleToggleProvider('okta')}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${authProviders.okta ? 'bg-blue-600' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${authProviders.okta ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </div>
          {renderProviderConfig('okta')}
        </div>

        {/* Google Authentication */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Google Authentication</h4>
                <p className="text-sm text-gray-500">Enable sign-in with Google</p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => handleToggleProvider('google')}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${authProviders.google ? 'bg-blue-600' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${authProviders.google ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </div>
          {renderProviderConfig('google')}
        </div>

        {/* OAuth2.0 Generic */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h4 className="text-lg font-medium text-gray-900">OAuth 2.0</h4>
                <p className="text-sm text-gray-500">Configure a custom OAuth 2.0 provider</p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => handleToggleProvider('oauth')}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${authProviders.oauth ? 'bg-blue-600' : 'bg-gray-200'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${authProviders.oauth ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          </div>
          {renderProviderConfig('oauth')}
        </div>
      </div>
    </div>
  );
};

export default IdentityManagementContent;