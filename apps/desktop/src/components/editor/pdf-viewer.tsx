"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

type Props = {
  src: string;
  onSynctexClick?: (page: number, x: number, y: number) => void;
  refreshKey?: number;
};

export function PdfViewer({ src, onSynctexClick, refreshKey = 0 }: Props) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
      if (!onSynctexClick) return;

      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      // Convert pixel coordinates to PDF points (1/72 inch)
      // react-pdf renders at 72 DPI * scale, so divide by scale to get PDF coords
      const xPdf = offsetX / scale;
      // PDF coordinate system has origin at bottom-left, so flip Y
      const pageHeightPdf = rect.height / scale;
      const yPdf = pageHeightPdf - offsetY / scale;

      onSynctexClick(pageNumber, xPdf, yPdf);
    },
    [onSynctexClick, scale],
  );

  const zoomIn = useCallback(() => setScale((s) => Math.min(s + 0.25, 4.0)), []);
  const zoomOut = useCallback(() => setScale((s) => Math.max(s - 0.25, 0.25)), []);
  const zoomReset = useCallback(() => setScale(1.0), []);

  // Fit width on mount
  useEffect(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      // Assume standard letter/A4 width ~612 PDF points
      const fitScale = (containerWidth - 32) / 612;
      if (fitScale > 0.25 && fitScale < 4.0) {
        setScale(fitScale);
      }
    }
  }, [src, refreshKey]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-surface-secondary shrink-0">
        <span className="text-xs text-muted">
          {numPages > 0 ? `${numPages} page${numPages !== 1 ? "s" : ""}` : "Loading..."}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="px-1.5 py-0.5 text-xs text-muted hover:text-foreground hover:bg-surface-tertiary rounded transition-colors"
            title="Zoom out"
          >
            -
          </button>
          <button
            onClick={zoomReset}
            className="px-1.5 py-0.5 text-xs text-muted hover:text-foreground hover:bg-surface-tertiary rounded transition-colors min-w-[3.5rem] text-center"
            title="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            onClick={zoomIn}
            className="px-1.5 py-0.5 text-xs text-muted hover:text-foreground hover:bg-surface-tertiary rounded transition-colors"
            title="Zoom in"
          >
            +
          </button>
        </div>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto bg-accent-hover p-4">
        <Document
          key={refreshKey}
          file={src}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-32 text-sm text-muted">
              Loading PDF...
            </div>
          }
          error={
            <div className="flex items-center justify-center h-32 text-sm text-muted">
              Failed to load PDF.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <div
              key={`page_${i + 1}`}
              className="mb-4 cursor-crosshair"
              onClick={(e) => handlePageClick(e, i + 1)}
            >
              <Page
                pageNumber={i + 1}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
