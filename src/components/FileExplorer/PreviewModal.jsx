'use client';
import { useEffect, useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { Loader2, X } from 'lucide-react';
import { fetchWrapper } from '@/app/lib/fetchWrapper';

// Add CSS to hide Box logo
const hideBoxLogo = `
  .bp-default-logo {
    display: none !important;
  }
  .bp-custom-logo{
    display: none !important;}
  .bp-header {
    background: none !important;
  }
`;

export default function PreviewModal({ isOpen, onClose, fileId }) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);
  const previewRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Add style to hide Box logo
    const style = document.createElement('style');
    style.textContent = hideBoxLogo;
    document.head.appendChild(style);

    // Clean up previous preview instance
    if (previewRef.current) {
      previewRef.current.hide();
      previewRef.current = null;
    }

    if (!isOpen || !fileId) return;

    let preview = null;
    const initPreview = async () => {
      try {
        setIsLoading(true);
        setError('');

        if (!window.Box) {
          const script = document.createElement('script');
          script.src = 'https://cdn01.boxcdn.net/platform/preview/2.93.0/en-US/preview.js';
          
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdn01.boxcdn.net/platform/preview/2.93.0/en-US/preview.css';
          
          document.head.appendChild(link);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        const response = await fetchWrapper(`/api/box/preview/${fileId}`,{}, 'preview');
        const data = await response.json();

        if (!response.ok || !data.accessToken) {
          throw new Error(data.error || 'Failed to get access token');
        }

        setFileInfo(data.fileInfo);
        
        preview = new window.Box.Preview();
        preview.show(fileId, data.accessToken, {
          container: '.preview-container',
          showDownload: true,
          header: 'light',
          showAnnotations: false,
          logoUrl: ' ', // Set to space to remove logo
          hasHeader: false, // Hide the header completely
          onLoad: () => {
            console.log('Preview loaded successfully');
            setIsLoading(false);
          },
          onError: (err) => {
            console.error('Preview load error:', err);
            setError(err.message || 'Failed to load preview');
            setIsLoading(false);
          }
        });
        
        previewRef.current = preview;

      } catch (err) {
        console.error('Preview initialization error:', err);
        setError(err.message || 'Failed to initialize preview');
        setIsLoading(false);
      }
    };

    initPreview();

    return () => {
      if (preview) {
        preview.hide();
      }
      if (previewRef.current) {
        previewRef.current.hide();
        previewRef.current = null;
      }
      // Remove the style when component unmounts
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [isOpen, fileId]);

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-[90vw] w-[1200px] h-[80vh] bg-white rounded-lg shadow-xl relative">
          <div className="flex items-center justify-between px-6 py-4 border-b">
          <Dialog.Title className="text-lg font-semibold text-gray-900">
          {fileInfo?.name || 'File Preview'}
            </Dialog.Title>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full text-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[calc(80vh-73px)] relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="text-red-500 text-center">
                  <h3 className="font-semibold mb-2">Error Loading Preview</h3>
                  <p>{error}</p>
                </div>
              </div>
            )}
            <div className="preview-container h-full" ref={containerRef} />
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}