'use client';
import { useEffect, useState, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { Loader2, X } from 'lucide-react';
import { fetchWrapper } from '@/app/lib/fetchWrapper';
import LoaderSpinner from '../Common/Elements/LoaderSpinner';

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

const hideInlineHeader = `
  .inline-preview .bp-header,
  .inline-preview .bp-header-container,
  .inline-preview .bp-toolbar,
  .inline-preview .bp-toolbar-container {
    display: none !important;
    height: 0 !important;
    min-height: 0 !important;
  }
  .inline-preview .bp-content {
    top: 0 !important;
  }
`;

export default function PreviewModal({ isOpen, onClose, fileId, fileName, variant = 'modal' }) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState(null);
  const previewRef = useRef(null);
  const containerRef = useRef(null);
  const initRequestRef = useRef(0);
  const isInline = variant === 'inline';

  const waitForStableContainer = (requestId, timeoutMs = 5000) =>
    new Promise((resolve, reject) => {
      const startedAt = Date.now();
      let rafId = null;
      let resizeObserver = null;
      let intersectionObserver = null;
      let latestSize = { width: 0, height: 0 };
      let stableFrames = 0;
      let prevArea = -1;
      let isIntersecting = false;

      const cleanup = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (intersectionObserver) {
          intersectionObserver.disconnect();
        }
      };

      const fail = (message) => {
        cleanup();
        reject(new Error(message));
      };

      const el = containerRef.current;
      if (!el) {
        fail('Preview container missing');
        return;
      }

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        latestSize.width = entry.contentRect.width;
        latestSize.height = entry.contentRect.height;
      });
      resizeObserver.observe(el);

      intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isIntersecting = Boolean(entry?.isIntersecting);
        },
        { threshold: [0, 0.01] }
      );
      intersectionObserver.observe(el);

      const tick = () => {
        if (initRequestRef.current !== requestId) {
          cleanup();
          return;
        }

        const target = containerRef.current;
        const rect = target?.getBoundingClientRect?.();
        const width = latestSize.width || rect?.width || 0;
        const height = latestSize.height || rect?.height || 0;
        const area = width * height;
        const hasDomParent =
          Boolean(target?.offsetParent) ||
          (target ? window.getComputedStyle(target).position === 'fixed' : false);
        const renderable = hasDomParent && width > 0 && height > 0 && isIntersecting;

        if (renderable) {
          if (area === prevArea) {
            stableFrames += 1;
          } else {
            stableFrames = 0;
            prevArea = area;
          }

          if (stableFrames >= 2) {
            cleanup();
            resolve(target);
            return;
          }
        } else {
          stableFrames = 0;
          prevArea = -1;
        }

        if (Date.now() - startedAt > timeoutMs) {
          fail('Preview container did not become stably visible');
          return;
        }

        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    });

  useEffect(() => {
    // Add style to hide Box logo
    const style = document.createElement('style');
    style.textContent = `${hideBoxLogo}\n${isInline ? hideInlineHeader : ''}`;
    document.head.appendChild(style);

    // Clean up previous preview instance
    if (previewRef.current) {
      previewRef.current.hide();
      previewRef.current = null;
    }

    if (!isOpen || !fileId) return;

    let preview = null;
    const requestId = Date.now();
    initRequestRef.current = requestId;

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

        const response = await fetchWrapper(`/api/box/preview/${fileId}`,{}, 'file-preview');
        const data = await response.json();

        if (!response.ok || !data.accessToken) {
          throw new Error(data.error || 'Failed to get access token');
        }

        setFileInfo(data.fileInfo);
        
        const targetContainer = await waitForStableContainer(requestId);
        if (initRequestRef.current !== requestId) return;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        preview = new window.Box.Preview();
        preview.show(fileId, data.accessToken, {
          container: targetContainer,
          showDownload: !isInline,
          showPrint: !isInline,
          header: 'light',
          showAnnotations: false,
          autoFocus: false,
          logoUrl: ' ', // Set to space to remove logo
          hasHeader: !isInline,
          onLoad: () => {
            if (initRequestRef.current !== requestId) return;
            console.log('Preview loaded successfully');
            setIsLoading(false);
          },
          onError: (err) => {
            if (initRequestRef.current !== requestId) return;
            console.error('Preview load error:', err);
            setError(err.message || 'Failed to load preview');
            setIsLoading(false);
          }
        });
        
        previewRef.current = preview;

      } catch (err) {
        if (initRequestRef.current !== requestId) return;
        console.error('Preview initialization error:', err);
        setError(err.message || 'Failed to initialize preview');
        setIsLoading(false);
      }
    };

    initPreview();

    return () => {
      initRequestRef.current += 1;
      if (preview) {
        try {
          preview.hide();
        } catch (e) {
          console.warn('Preview hide failed during cleanup', e);
        }
      }
      if (previewRef.current) {
        try {
          previewRef.current.hide();
        } catch (e) {
          console.warn('Preview ref hide failed during cleanup', e);
        }
        previewRef.current = null;
      }
      // Remove the style when component unmounts
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [isOpen, fileId, isInline]);

  const handleClose = () => {
    onClose?.();
    setFileInfo(null)
  }

  if (isInline) {
    return (
      <div className="inline-preview w-full max-h-[55vh] min-h-[420px] bg-white border border-gray-200 rounded-lg overflow-hidden relative">
        <div className="h-[55vh] min-h-[420px] relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              <LoaderSpinner size={32} className='text-blue-500'/>
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
      </div>
    );
  }

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
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full text-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="h-[calc(80vh-73px)] relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <LoaderSpinner size={32} className='text-blue-500'/>
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