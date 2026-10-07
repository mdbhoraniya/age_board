'use client';

import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

type PdfViewerProps = {
  dataUrl: string;
  title: string;
};

function loadPdfScript(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject();
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="/pdf.min.js"]');
    if (existing) {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
      } else {
        existing.addEventListener('load', () => resolve(window.pdfjsLib));
        existing.addEventListener('error', () => reject(new Error('Failed to load PDF viewer script')));
      }
      return;
    }

    const script = document.createElement('script');
    script.src = '/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF viewer library failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load /pdf.min.js'));
    document.head.appendChild(script);
  });
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || dataUrl;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ dataUrl, title }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>('');

  // Create Blob URL for "Open in New Tab"
  useEffect(() => {
    try {
      const bytes = dataUrlToBytes(dataUrl);
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Failed to create PDF blob:', err);
    }
  }, [dataUrl]);

  // Load PDF document from binary data
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setRenderError(null);

    const loadPdf = async () => {
      try {
        const pdfjs = await loadPdfScript();
        const bytes = dataUrlToBytes(dataUrl);

        const loadingTask = pdfjs.getDocument({
          data: bytes,
        });

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to parse PDF document:', err);
        if (!isCancelled) {
          setRenderError(err?.message || 'Could not render PDF pages.');
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [dataUrl]);

  // Render current page onto canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask: any = null;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Retina / High-DPI support for crisp text
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        const renderContext = {
          canvasContext: context,
          viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setScale(1.2);
  };

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full w-full select-none bg-slate-900 rounded-xl overflow-hidden shadow-inner">
      {/* PDF Control Bar */}
      <div className="flex items-center justify-between gap-2 p-2.5 sm:px-4 bg-slate-950 text-white border-b border-slate-800 shrink-0 flex-wrap">
        {/* Page navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            aria-label="Previous Page"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm font-bold"
          >
            ‹
          </button>

          <span className="text-xs font-semibold px-1 text-slate-300">
            {totalPages > 0 ? (
              <span>
                Page <strong className="text-white">{currentPage}</strong> of {totalPages}
              </span>
            ) : (
              'Loading...'
            )}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || isLoading}
            aria-label="Next Page"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors text-sm font-bold"
          >
            ›
          </button>
        </div>

        {/* Zoom Controls & Open in New Tab */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              title="Zoom Out"
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30"
            >
              −
            </button>
            <span
              onClick={handleResetZoom}
              title="Click to reset zoom"
              className="px-2 text-[11px] font-mono text-slate-300 cursor-pointer hover:text-white"
            >
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              title="Zoom In"
              className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-30"
            >
              +
            </button>
          </div>

          {blobUrl && (
            <button
              type="button"
              onClick={handleOpenInNewTab}
              title="Open full PDF in a new tab"
              className="inline-flex min-h-[32px] items-center gap-1 rounded-lg bg-blue-600/90 hover:bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors"
            >
              <span>↗️</span>
              <span className="hidden sm:inline">New Tab</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center bg-slate-900/90">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <div className="h-8 w-8 rounded-full border-3 border-blue-500 border-t-transparent animate-spin"></div>
            <p className="text-xs font-medium">Rendering PDF page {currentPage}...</p>
          </div>
        ) : renderError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm">
            <span className="text-4xl mb-3">📄</span>
            <h4 className="text-sm font-bold text-white mb-1">Open PDF</h4>
            <p className="text-xs text-slate-400 mb-4">
              Open the document in your browser&apos;s full PDF viewer:
            </p>
            {blobUrl && (
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <span>↗️</span>
                <span>Open in Native Browser Tab</span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white">
            <canvas ref={canvasRef} className="block max-w-full h-auto" />
          </div>
        )}
      </div>
    </div>
  );
};
