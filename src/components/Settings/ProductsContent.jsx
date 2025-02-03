import React from 'react';
import { PlusCircle, Workflow, Fingerprint, Code, UserCircle } from 'lucide-react';

const ProductsContent = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Workflow Widgets</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Add Widget
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            name: 'Workflow Builder',
            description: 'Create and manage custom workflows',
            icon: <Workflow className="w-6 h-6 text-blue-600" />,
            status: 'Ready'
          },
          {
            name: 'Signature Integration',
            description: 'Add digital signature capabilities',
            icon: <Fingerprint className="w-6 h-6 text-blue-600" />,
            status: 'Beta'
          },
          {
            name: 'Custom API',
            description: 'Configure custom API endpoints',
            icon: <Code className="w-6 h-6 text-blue-600" />,
            status: 'Ready'
          },
          {
            name: 'Account Details',
            description: 'Manage user profiles and settings',
            icon: <UserCircle className="w-6 h-6 text-blue-600" />,
            status: 'Ready'
          }
        ].map((widget, idx) => (
          <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                {widget.icon}
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{widget.name}</h4>
                  <p className="text-sm text-gray-500">{widget.description}</p>
                </div>
              </div>
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                widget.status === 'Beta' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {widget.status}
              </span>
            </div>
            <div className="mt-4 flex space-x-2">
              <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">Configure</button>
              <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">Documentation</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsContent