'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Create a separate component for the preview content
function PreviewContent() {
  const searchParams = useSearchParams();
  const previewUrl = searchParams.get('url');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!previewUrl) {
      setError('No preview URL provided');
      return;
    }

    // Load Box Preview library
    const script = document.createElement('script');
    script.src = 'https://cdn01.boxcdn.net/platform/preview/2.93.0/en-US/preview.js';
    script.onload = () => {
      try {
        // Parse the preview URL to get fileId and access token
        const url = new URL(previewUrl);
        const fileId = url.pathname.split('/').pop();
        const accessToken = url.searchParams.get('access_token');

        if (!fileId || !accessToken) {
          setError('Invalid preview URL format');
          return;
        }

        const preview = new window.Box.Preview();
        preview.show(fileId, {
          container: '.preview-container',
          showDownload: true,
          fileOptions: {
            [fileId]: {
              token: accessToken
            }
          }
        });
      } catch (err) {
        console.error('Preview initialization error:', err);
        setError('Failed to initialize preview');
      }
    };
    document.head.appendChild(script);

    // Add Box Preview styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn01.boxcdn.net/platform/preview/2.93.0/en-US/preview.css';
    document.head.appendChild(link);

    return () => {
      // Cleanup
      if (script.parentNode) script.parentNode.removeChild(script);
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [previewUrl]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-center">
          <h1 className="text-xl font-bold mb-2">Error Loading Preview</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview-container" style={{ height: '100vh', width: '100%' }}></div>
  );
}

// Main component that wraps PreviewContent with Suspense
export default function PreviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PreviewContent />
    </Suspense>
  );
}