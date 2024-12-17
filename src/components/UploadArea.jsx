'use client';
import { useState } from 'react';
import { Import, Upload, X } from 'lucide-react';

export default function UploadArea({ isForImport, onBrowse, onClose }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => file.type === "text/csv"); 
    if(validFiles.length === 0 && isForImport){
      return
    }
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    
    // Create a DataTransfer object
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));
    
    // Set the files to the input
    fileInput.files = dataTransfer.files;
    
    // Dispatch change event
    const event = new Event('change', { bubbles: true });
    Object.defineProperty(event, 'target', { value: fileInput });
    onBrowse(event);
  };

  return (
    <div className="w-full mb-6 mt-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close upload area"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col items-center justify-center space-y-4">
          {isForImport ?
          (
            <Import className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          ):(
            <Upload className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          ) }
          <div className="text-center">
            <p className="text-gray-600">
              Drag and drop file
              {isForImport ? ' csv ' : ' '}
              here or{' '}
              <button
                onClick={onBrowse}
                className="text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:underline"
              >
                browse computer
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}