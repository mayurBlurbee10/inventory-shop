import React, { useState } from 'react';
import { Sun, Moon, Palette } from 'lucide-react';

const AppearanceContent = () => {
  const [selectedTheme, setSelectedTheme] = useState('modern');

  const themes = [
    {
      name: 'Modern',
      icon: Palette,
      description: 'Clean and contemporary',
      preview: (
        <div className="space-y-2 w-full">
          <div className="h-2 w-3/4 bg-blue-400 rounded" />
          <div className="h-2 w-1/2 bg-purple-400 rounded" />
          <div className="h-2 w-2/3 bg-pink-400 rounded" />
          <div className="flex space-x-1 mt-3">
            <div className="h-3 w-3 rounded-sm bg-blue-400" />
            <div className="h-3 w-3 rounded-sm bg-purple-400" />
            <div className="h-3 w-3 rounded-sm bg-pink-400" />
          </div>
        </div>
      ),
      bgClass: 'bg-gradient-to-r from-blue-50 to-purple-50'
    },
    {
      name: 'Professional',
      icon: Sun,
      description: 'Refined and corporate',
      preview: (
        <div className="space-y-2 w-full">
          <div className="h-2 w-3/4 bg-gray-400 rounded" />
          <div className="h-2 w-1/2 bg-gray-300 rounded" />
          <div className="h-2 w-2/3 bg-gray-400 rounded" />
          <div className="flex space-x-1 mt-3">
            <div className="h-3 w-3 rounded-sm bg-gray-400" />
            <div className="h-3 w-3 rounded-sm bg-gray-300" />
            <div className="h-3 w-3 rounded-sm bg-gray-400" />
          </div>
        </div>
      ),
      bgClass: 'bg-gradient-to-r from-gray-50 to-slate-100'
    },
    {
      name: 'Minimal',
      icon: Moon,
      description: 'Simple and focused',
      preview: (
        <div className="space-y-2 w-full">
          <div className="h-2 w-3/4 bg-gray-200 rounded" />
          <div className="h-2 w-1/2 bg-gray-200 rounded" />
          <div className="h-2 w-2/3 bg-gray-200 rounded" />
          <div className="flex space-x-1 mt-3">
            <div className="h-3 w-3 rounded-sm bg-gray-200" />
            <div className="h-3 w-3 rounded-sm bg-gray-200" />
            <div className="h-3 w-3 rounded-sm bg-gray-200" />
          </div>
        </div>
      ),
      bgClass: 'bg-white'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Theme Selection</h3>
        <p className='text-gray-600 text-sm'>Choose and customize the look and feel of your application</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((theme) => {
          const Icon = theme.icon;
          return (
            <div
              key={theme.name.toLowerCase()}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedTheme === theme.name.toLowerCase()
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-opacity-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTheme(theme.name.toLowerCase())}
            >
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <input
                    type="radio"
                    id={theme.name.toLowerCase()}
                    checked={selectedTheme === theme.name.toLowerCase()}
                    onChange={() => setSelectedTheme(theme.name.toLowerCase())}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <label
                        htmlFor={theme.name.toLowerCase()}
                        className="font-medium text-gray-900 block cursor-pointer"
                      >
                        {theme.name}
                      </label>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{theme.description}</p>
                  </div>
                </div>
                <div className={`h-24 rounded border p-4 ${theme.bgClass}`}>
                  {theme.preview}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customization Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Customization</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <div className="mt-1 flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <input
                type="color"
                className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300"
                defaultValue="#3B82F6"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
              <input
                type="color"
                className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300"
                defaultValue="#6B7280"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Accent Color</label>
              <input
                type="color"
                className="mt-1 block w-full h-10 p-1 rounded-md border border-gray-300"
                defaultValue="#8B5CF6"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceContent;