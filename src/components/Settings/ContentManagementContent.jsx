import React from 'react';

const ContentManagementContent = () => {
  const contentItems = [
    { title: 'Homepage Banner', type: 'Image', lastUpdated: '2024-01-15' },
    { title: 'About Us', type: 'Text', lastUpdated: '2024-01-14' },
    { title: 'Services', type: 'List', lastUpdated: '2024-01-13' },
    { title: 'Contact Info', type: 'Text', lastUpdated: '2024-01-12' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Content Management</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Add Content
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contentItems.map((content, idx) => (
          <div key={idx} className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-medium text-gray-900">{content.title}</h4>
                <p className="text-sm text-gray-500">Type: {content.type}</p>
                <p className="text-sm text-gray-500">Last Updated: {content.lastUpdated}</p>
              </div>
              <button className="text-blue-600 hover:text-blue-900">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ContentManagementContent;